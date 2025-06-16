import React, { useState, useEffect } from 'react';
import useChat from '@/hooks/useChat';
import { toast } from 'react-toastify';
import { getRelativeTime } from '@/utils/dateUtils';

export default function Chat() {
    const [input, setInput] = useState('');
    // State cho popup tạo group chat
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [creatorName, setCreatorName] = useState('');
    const [messages, setMessages] = useState([]);
    const currentUserId = 1;

    const {
        channels,
        selectedChannel,
        setSelectedChannel,
        fetchChatRooms,
        createChatRoom,
        sendMessage,
        getMessagesInRoom,
        loading,
        error,
        // getMessagesInRoom,
    } = useChat(currentUserId);

    // Lấy danh sách chatroom khi vào trang
    useEffect(() => {
        fetchChatRooms();
    }, [fetchChatRooms]);

    // Set selectedChannel khi channels thay đổi
    // useEffect(() => {
    //     if (channels.length > 0 && !selectedChannel) {
    //         setSelectedChannel(channels[0].chatRoomId);
    //     }
    // }, [channels, selectedChannel]);

    // Lấy tin nhắn khi chuyển phòng chat
    useEffect(() => {
        const fetchMessages = async () => {
            if (selectedChannel) {
                try {
                    const res = await getMessagesInRoom(selectedChannel);
                    setMessages(Array.isArray(res.items) ? res.items : []);
                } catch (err) {
                    setMessages([]);
                }
            } else {
                setMessages([]);
            }
        };
        fetchMessages();
    }, [selectedChannel]);

    // Xử lý tạo nhóm chat
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await createChatRoom({
                roomName: newGroupName,
                startupId: 1,
                creatorAccountId: currentUserId,
                memberTitle: creatorName
            });
            setShowCreateGroup(false);
            setNewGroupName('');
            setCreatorName('');
        } catch (err) {
            toast.error("them nhom that bai")
        }
    };
    // Xử lý gửi tin nhắn
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        try {
            await sendMessage({ messageContent: input, chatRoomId: selectedChannel, accountId: currentUserId });
            // Gọi lại API lấy danh sách tin nhắn mới nhất
            const res = await getMessagesInRoom(selectedChannel);
            setMessages(Array.isArray(res.items) ? res.items : []);
            setInput('');
        } catch (err) {
            alert('Gửi tin nhắn thất bại!');
        }
    };

    return (
        <>
            {/* Header */}
            <header className="bg-white shadow px-4 py-4 flex justify-between items-center mb-6 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
            </header>

            {/* Chat Interface */}
            <div className="bg-white shadow rounded-lg overflow-hidden flex h-[calc(100vh-180px)]">
                {/* Sidebar trái: Server */}


                {/* Sidebar giữa: Kênh */}
                <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="font-bold text-gray-800">Text Channels</h2>
                        <button
                            className="ml-2 p-1 bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-600 rounded-full shadow transition-all duration-200 focus:outline-none flex items-center justify-center"
                            title="Thêm nhóm chat"
                            onClick={() => setShowCreateGroup(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    <ul className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
                        {(channels || []).map(channel => (
                            <li key={channel.chatRoomId}>
                                <button
                                    onClick={() => setSelectedChannel(channel.chatRoomId)}
                                    className={`w-full flex items-center px-4 py-2 rounded text-left transition-all duration-200 ${selectedChannel === channel.chatRoomId ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-700 hover:bg-gray-200'}`}
                                >
                                    # {channel.roomName}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Khung chat chính */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Header */}
                    <div className="h-14 flex items-center px-6 border-b border-gray-200 bg-white">
                        <span className="text-lg font-bold text-gray-800">
                            # {channels.find(c => c.chatRoomId === selectedChannel)?.roomName || ''}
                        </span>
                    </div>

                    {/* Tin nhắn */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                        {[...messages].reverse().map(msg => {
                            const isMe = msg.accountId === currentUserId;
                            return (
                                <div
                                    key={msg.messageId || msg.id}
                                    className={`flex items-start space-x-3 ${isMe ? 'justify-end' : ''}`}
                                >
                                    {!isMe && (
                                        <img
                                            src={msg.avatarUrl}
                                            alt="avatar"
                                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                        />
                                    )}
                                    <div
                                        className={`max-w-xs px-4 py-2 rounded-lg shadow
                                            ${isMe
                                                ? 'bg-blue-500 text-white ml-auto'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}
                                        style={{ wordBreak: 'break-word' }}
                                    >
                                        {!isMe && (
                                            <div className="font-semibold">
                                                {msg.memberTitle || msg.accountId}
                                            </div>
                                        )}
                                        <div>{msg.messageContent}</div>
                                        <div className="text-xs text-gray-200/80">
                                            {/* {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : ''} */}
                                            {msg.sentAt ? getRelativeTime(msg.sentAt) : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input gửi tin nhắn */}
                    <form className="p-4 border-t border-gray-200" onSubmit={handleSendMessage}>
                        <div className="flex">
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập tin nhắn..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 transition-all"
                                disabled={loading}
                            >
                                Gửi
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Popup tạo group chat */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                            onClick={() => setShowCreateGroup(false)}
                        >
                            ×
                        </button>
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Tạo nhóm chat mới</h3>
                        <form onSubmit={handleCreateGroup}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-1">Tên nhóm chat</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="Nhập tên nhóm..."
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-1">Tên phòng chat</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={creatorName}
                                    onChange={e => setCreatorName(e.target.value)}
                                    placeholder="Nhập tên phòng..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-all font-bold"
                                disabled={loading}
                            >
                                Tạo nhóm
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
} 