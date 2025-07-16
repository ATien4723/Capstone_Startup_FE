import React, { useEffect, useState } from 'react';
import useChat from '@/hooks/useChat';
import { getRelativeTime } from '@/utils/dateUtils';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import { getUserId } from '@/apis/authService';

export default function Chat() {
    const currentUserId = getUserId(); // ID của người dùng hiện tại
    const [hasSearched, setHasSearched] = useState(false); // State để theo dõi đã tìm kiếm hay chưa
    const [searchChannelKey, setSearchChannelKey] = useState(''); // State để lưu từ khóa tìm kiếm kênh

    const {
        // State
        channels,
        selectedChannel,
        loading,
        messages,
        input,
        showCreateGroup,
        newGroupName,
        creatorName,
        showDropdown,
        showAddMember,
        newMemberEmail,
        newMemberTitle,
        searchResults,
        selectedUser,
        isSearching,
        chatRoomMembers,
        showEditMember,
        selectedMember,
        editMemberTitle,
        showMembersSidebar,
        searchMessageKey,
        isSearchingMessages,
        selectedFile,

        // Actions
        setSelectedChannel,
        setInput,
        setShowCreateGroup,
        setNewGroupName,
        setCreatorName,
        setShowDropdown,
        setShowAddMember,
        setNewMemberEmail,
        setNewMemberTitle,
        setSelectedUser,
        setShowEditMember,
        setSelectedMember,
        setEditMemberTitle,
        setShowMembersSidebar,
        setSearchMessageKey,
        setSelectedFile,

        // Methods
        fetchChatRooms,
        handleCreateGroup,
        handleSendMessage,
        handleEmailInputChange,
        handleSelectUser,
        handleAddMember,
        handleDeleteChatRoom,
        handleUpdateMemberTitle,
        handleRemoveMember,
        handleEditMember,
        handleSearchMessages,
        resetMessageSearch,
        handleKickChatRoomMembers,
    } = useChat(currentUserId);

    // Lấy danh sách chatroom khi vào trang
    useEffect(() => {
        fetchChatRooms();
    }, [fetchChatRooms]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = () => {
            setShowDropdown(false);
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [setShowDropdown]);

    // Hàm xử lý tìm kiếm tin nhắn
    const handleSearch = async (e) => {
        e.preventDefault();
        await handleSearchMessages(e);
        setHasSearched(true); // Đánh dấu đã tìm kiếm
    };

    // Hàm xử lý reset tìm kiếm
    const handleReset = () => {
        resetMessageSearch();
        setHasSearched(false); // Reset trạng thái tìm kiếm
    };

    // Lọc danh sách kênh chat theo từ khóa tìm kiếm
    const filteredChannels = channels?.filter(channel =>
        channel.roomName.toLowerCase().includes(searchChannelKey.toLowerCase())
    ) || [];

    return (
        <>
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg px-6 py-4 flex justify-between items-center mb-6 rounded-lg text-white">
                <h1 className="text-2xl font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                </h1>
                <div className="flex space-x-3">
                    <button
                        className={`p-2 rounded-lg text-sm font-medium transition duration-300 flex items-center space-x-1 ${showMembersSidebar ? 'bg-white text-blue-600' : 'bg-blue-700 text-white hover:bg-blue-900'}`}
                        onClick={() => setShowMembersSidebar(!showMembersSidebar)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Members</span>
                    </button>
                </div>
            </header>

            {/* Chat Interface */}
            <div className="bg-white shadow-xl rounded-lg overflow-hidden flex h-[calc(100vh-180px)] border border-gray-200">
                {/* Sidebar giữa: Kênh */}
                <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-100">
                        <h2 className="font-bold text-gray-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Chat Channels
                        </h2>
                        <button
                            className="ml-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow transition-all duration-200 focus:outline-none flex items-center justify-center"
                            title="Create new chat group"
                            onClick={() => setShowCreateGroup(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        <div className="px-4 py-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-gray-100 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                                    placeholder="Search channels..."
                                    value={searchChannelKey}
                                    onChange={(e) => setSearchChannelKey(e.target.value)}
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchChannelKey && (
                                    <button
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        onClick={() => setSearchChannelKey('')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        <ul className="px-2 py-2 space-y-1">
                            {filteredChannels.length > 0 ? (
                                filteredChannels.map(channel => (
                                    <li key={channel.chatRoomId + '-' + channel.roomName}>
                                        <button
                                            onClick={() => setSelectedChannel(channel.chatRoomId)}
                                            className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${selectedChannel === channel.chatRoomId
                                                ? 'bg-blue-100 text-blue-700 font-bold shadow-sm'
                                                : 'text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                                                {channel.roomName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-medium truncate"># {channel.roomName}</p>
                                                <p className="text-xs text-gray-500 truncate">Click to view messages</p>
                                            </div>
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-3 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm">Không tìm thấy kênh nào</p>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Khung chat chính */}
                <div className={`flex-1 flex flex-col bg-white ${showMembersSidebar ? 'border-r border-gray-200' : ''}`}>
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center space-x-3">
                            {selectedChannel && (
                                <>
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {(channels.find(c => c.chatRoomId === selectedChannel)?.roomName || '').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="text-lg font-bold text-gray-800">
                                            # {channels.find(c => c.chatRoomId === selectedChannel)?.roomName || ''}
                                        </span>
                                        <p className="text-xs text-gray-500">
                                            {chatRoomMembers?.length || 0} members
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {selectedChannel && (
                            <div className="relative">
                                <button
                                    className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-all duration-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDropdown(!showDropdown);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                    </svg>
                                </button>

                                {showDropdown && (
                                    <div
                                        className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => {
                                                setShowAddMember(true);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                            Add Member
                                        </button>
                                        <button
                                            onClick={handleDeleteChatRoom}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete Chat Group
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tin nhắn */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
                        {selectedChannel ? (
                            [...messages].reverse().map(msg => {
                                const isMe = msg.accountId == currentUserId;
                                return (
                                    <div
                                        key={(msg.messageId || msg.id) + '-' + (msg.sentAt || '')}
                                        className={`flex items-start space-x-3 ${isMe ? 'justify-end' : ''}`}
                                    >
                                        {!isMe && (
                                            <img
                                                src={msg.avatarUrl || 'https://via.placeholder.com/40'}
                                                alt="avatar"
                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
                                            />
                                        )}

                                        {/* Nội dung tin nhắn */}
                                        {msg.messageType === 'Image' ? (
                                            <div className="flex flex-col max-w-sm">
                                                {!isMe && (
                                                    <div className="font-semibold mb-1 ml-1 text-sm">
                                                        {msg.memberTitle || msg.accountId}
                                                    </div>
                                                )}
                                                <div className={`${isMe ? 'rounded-l-lg rounded-br-lg' : 'rounded-r-lg rounded-bl-lg'} overflow-hidden shadow-md`}>
                                                    <img
                                                        src={msg.messageContent}
                                                        alt="Image"
                                                        className="w-full cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(msg.messageContent, '_blank')}
                                                    />
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 ml-1">
                                                    {msg.sentAt ? getRelativeTime(msg.sentAt) : ''}
                                                </div>
                                            </div>
                                        ) : msg.messageType === 'Video' ? (
                                            <div className="flex flex-col max-w-sm">
                                                {!isMe && (
                                                    <div className="font-semibold mb-1 ml-1 text-sm">
                                                        {msg.memberTitle || msg.accountId}
                                                    </div>
                                                )}
                                                <div className={`${isMe ? 'rounded-l-lg rounded-br-lg' : 'rounded-r-lg rounded-bl-lg'} overflow-hidden shadow-md`}>
                                                    <video
                                                        src={msg.messageContent}
                                                        controls
                                                        className="w-full"
                                                    >
                                                        Video not supported
                                                    </video>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 ml-1">
                                                    {msg.sentAt ? getRelativeTime(msg.sentAt) : ''}
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={`max-w-sm px-4 py-3 rounded-lg shadow-sm
                                                    ${isMe
                                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none'
                                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                                    }`}
                                                style={{ wordBreak: 'break-word' }}
                                            >
                                                {!isMe && (
                                                    <div className="font-semibold text-sm mb-1">
                                                        {msg.memberTitle || msg.accountId}
                                                    </div>
                                                )}
                                                <div>
                                                    {msg.messageType === "File" ? (
                                                        <div className="flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                            </svg>
                                                            <a
                                                                href={msg.messageContent}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="underline hover:text-blue-500 transition-colors"
                                                            >
                                                                Attached file
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <div className="leading-relaxed">{msg.messageContent}</div>
                                                    )}
                                                </div>
                                                <div className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                                    {msg.sentAt ? getRelativeTime(msg.sentAt) : ''}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-lg font-medium">Select a channel to start chatting</p>
                                <p className="text-sm mt-2">Or create a new chat channel to start a conversation</p>
                                <button
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    onClick={() => setShowCreateGroup(true)}
                                >
                                    Create new chat channel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Input gửi tin nhắn */}
                    <form className="p-4 border-t border-gray-200 bg-white" onSubmit={handleSendMessage}>
                        <div className="flex flex-col space-y-2">
                            {selectedFile && (
                                <div className="flex items-center bg-blue-50 p-2 rounded border border-blue-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <span className="text-sm text-gray-700 flex-1 truncate">{selectedFile.name}</span>
                                    <button
                                        type="button"
                                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                        onClick={() => setSelectedFile(null)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <div className="flex">
                                <input
                                    type="text"
                                    className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Type a message..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    disabled={!selectedChannel}
                                />
                                <label className="bg-gray-100 text-gray-700 px-3 py-2 cursor-pointer hover:bg-gray-200 transition-all flex items-center border-t border-b border-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setSelectedFile(file);
                                            }
                                        }}
                                        disabled={!selectedChannel}
                                    />
                                </label>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-5 py-2 rounded-r-lg hover:bg-blue-700 transition-all flex items-center gap-1 disabled:bg-blue-300"
                                    disabled={loading || !selectedChannel}
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </div>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Send
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Sidebar phải: Danh sách thành viên */}
                {showMembersSidebar && (
                    <div className="w-72 bg-gray-50 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-100">
                            <h2 className="font-bold text-gray-800 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Members
                            </h2>
                            <button
                                className="ml-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow transition-all duration-200 focus:outline-none flex items-center justify-center"
                                title="Add member"
                                onClick={() => setShowAddMember(true)}
                                disabled={!selectedChannel}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        {/* Thanh tìm kiếm tin nhắn */}
                        {selectedChannel && (
                            <div className="px-3 py-3 border-b border-gray-200 bg-gray-50">
                                <form onSubmit={handleSearch} className="flex flex-col space-y-2">
                                    <div className="flex items-center relative">
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Search messages..."
                                            value={searchMessageKey}
                                            onChange={(e) => setSearchMessageKey(e.target.value)}
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <button
                                            type="submit"
                                            className="absolute right-2 bg-blue-500 text-white p-0.5 rounded hover:bg-blue-600 transition-all"
                                            disabled={isSearchingMessages || !searchMessageKey.trim()}
                                        >
                                            {isSearchingMessages ? (
                                                <CircularProgress size={14} color="inherit" />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {hasSearched && (
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="w-full px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-all flex items-center justify-center gap-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Reset Search
                                        </button>
                                    )}
                                </form>
                            </div>
                        )}

                        {/* Tách nhóm leader và member */}
                        <div className="overflow-y-auto flex-1">
                            {selectedChannel ? (() => {
                                const leaders = (chatRoomMembers || []).filter(m => m.canAdministerChannel);
                                const members = (chatRoomMembers || []).filter(m => !m.canAdministerChannel);
                                return (
                                    <>
                                        {leaders.length > 0 && (
                                            <div className="mb-4 mt-2">
                                                <div className="font-bold text-xs text-gray-500 mb-1 px-4 uppercase tracking-wider">Administrators — {leaders.length}</div>
                                                {leaders.map(member => (
                                                    <li key={member.memberId + '-' + member.accountId} className="group list-none">
                                                        <div className="flex items-center justify-between p-3 rounded-lg mx-2 hover:bg-white hover:shadow-sm transition-all">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="relative">
                                                                    <img
                                                                        src={member.avatarUrl || 'https://via.placeholder.com/32'}
                                                                        alt="avatar"
                                                                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                                                    />
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-sm flex items-center gap-1">
                                                                        {member.memberTitle || 'No name'}
                                                                        <span title="Administrator" className="ml-1">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                            </svg>
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {member.accountId == currentUserId ? 'You' : 'Administrator'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="hidden group-hover:flex space-x-1">
                                                                {(() => {
                                                                    const currentUser = chatRoomMembers.find(m => m.accountId == currentUserId);
                                                                    if (currentUser && currentUser.canAdministerChannel && member.accountId == currentUserId) {
                                                                        return (
                                                                            <button
                                                                                className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200"
                                                                                onClick={() => handleEditMember(member)}
                                                                                title="Edit"
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                </svg>
                                                                            </button>
                                                                        );
                                                                    }
                                                                    else if (currentUser && currentUser.canAdministerChannel && member.accountId != currentUserId) {
                                                                        return (
                                                                            <>
                                                                                <button
                                                                                    className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200"
                                                                                    onClick={() => handleEditMember(member)}
                                                                                    title="Edit"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                    </svg>
                                                                                </button>
                                                                                <button
                                                                                    className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200"
                                                                                    onClick={() => handleKickChatRoomMembers(member.accountId)}
                                                                                    title="Remove from group"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                    </svg>
                                                                                </button>
                                                                            </>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </div>
                                        )}
                                        {members.length > 0 && (
                                            <div>
                                                <div className="font-bold text-xs text-gray-500 mb-1 px-4 uppercase tracking-wider">Members — {members.length}</div>
                                                {members.map(member => (
                                                    <li key={member.memberId + '-' + member.accountId} className="group list-none">
                                                        <div className="flex items-center justify-between p-3 rounded-lg mx-2 hover:bg-white hover:shadow-sm transition-all">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="relative">
                                                                    <img
                                                                        src={member.avatarUrl || 'https://via.placeholder.com/32'}
                                                                        alt="avatar"
                                                                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                                                    />
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-sm">
                                                                        {member.memberTitle || 'No name'}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {member.accountId == currentUserId ? 'You' : 'Member'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="hidden group-hover:flex space-x-1">
                                                                {(() => {
                                                                    const currentUser = chatRoomMembers.find(m => m.accountId == currentUserId);
                                                                    if (currentUser && currentUser.canAdministerChannel && member.accountId == currentUserId) {
                                                                        return (
                                                                            <button
                                                                                className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200"
                                                                                onClick={() => handleEditMember(member)}
                                                                                title="Edit"
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                </svg>
                                                                            </button>
                                                                        );
                                                                    }
                                                                    else if (currentUser && currentUser.canAdministerChannel && member.accountId != currentUserId) {
                                                                        return (
                                                                            <>
                                                                                <button
                                                                                    className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200"
                                                                                    onClick={() => handleEditMember(member)}
                                                                                    title="Edit"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                    </svg>
                                                                                </button>
                                                                                <button
                                                                                    className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200"
                                                                                    onClick={() => handleKickChatRoomMembers(member.accountId)}
                                                                                    title="Remove from group"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                    </svg>
                                                                                </button>
                                                                            </>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                );
                            })() : (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-center">Select a chat channel to view members</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Popup tạo group chat */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-96 relative animate-fadeIn">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                            onClick={() => setShowCreateGroup(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="text-center mb-6">
                            <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Create New Chat Group</h3>
                            <p className="text-gray-500 text-sm">Create a new chat group to start a conversation with your colleagues</p>
                        </div>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-1 text-sm font-medium">Group Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="Enter group name..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1 text-sm font-medium">Your Display Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={creatorName}
                                    onChange={e => setCreatorName(e.target.value)}
                                    placeholder="Enter your display name..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all font-bold flex items-center justify-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m6 0H6" />
                                        </svg>
                                        Create Group
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Popup thêm thành viên */}
            {showAddMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-[450px] relative animate-fadeIn">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                            onClick={() => {
                                setShowAddMember(false);
                                setNewMemberEmail('');
                                setNewMemberTitle('');
                                setSelectedUser(null);
                                setSearchResults([]);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="text-center mb-6">
                            <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Add Member</h3>
                            <p className="text-gray-500 text-sm">Add a new member to the chat group</p>
                        </div>

                        {/* Tìm kiếm thành viên startup */}
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2 text-sm font-medium">Search members by email</label>
                            <Autocomplete
                                options={Array.isArray(searchResults) ? searchResults : []}
                                loading={isSearching}
                                getOptionLabel={option => option?.fullName || option?.roleName || ''}
                                value={selectedUser}
                                onChange={(event, value) => {
                                    handleSelectUser(value);
                                }}
                                inputValue={newMemberEmail}
                                onInputChange={(event, value, reason) => {
                                    handleEmailInputChange({ target: { value } });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Enter email..."
                                        variant="outlined"
                                        size="small"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.accountId + '-' + (option.email || '')}>
                                        <Avatar src={option.avatarUrl} sx={{ width: 28, height: 28, mr: 1 }} />
                                        <div className="ml-2 flex flex-col">
                                            <span className="text-sm font-medium">{option.fullName}</span>
                                            <span className="text-xs text-gray-500">{option.roleName}</span>
                                        </div>
                                    </li>
                                )}
                                noOptionsText="No members found"
                                isOptionEqualToValue={(option, value) =>
                                    (option.accountId && value.accountId && option.accountId === value.accountId) ||
                                    (option.memberId && value.memberId && option.memberId === value.memberId)
                                }
                            />
                        </div>

                        {/* Thông tin người dùng đã chọn */}
                        {selectedUser && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
                                <div className="flex items-center">
                                    <Avatar
                                        src={selectedUser.avatarUrl}
                                        sx={{ width: 40, height: 40 }}
                                        className="border-2 border-white shadow-sm"
                                    />
                                    <div className="ml-3">
                                        <div className="font-medium">{selectedUser.fullName || 'No name'}</div>
                                        <div className="text-sm text-gray-600">{selectedUser.roleName || ''}</div>
                                    </div>
                                </div>
                                <button
                                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-blue-100"
                                    onClick={() => setSelectedUser(null)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Form thêm thành viên */}
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-1 text-sm font-medium">Set display name for the member</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={newMemberTitle}
                                    onChange={e => setNewMemberTitle(e.target.value)}
                                    placeholder="Enter display name..."
                                    required
                                    disabled={!selectedUser}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all font-bold flex items-center justify-center"
                                disabled={loading || !selectedUser}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Add Member
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa thành viên */}
            {showEditMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-96 relative animate-fadeIn">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                            onClick={() => {
                                setShowEditMember(false);
                                setSelectedMember(null);
                                setEditMemberTitle('');
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="text-center mb-6">
                            <div className="bg-amber-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Edit Member</h3>
                            <p className="text-gray-500 text-sm">Change the display name of the member in the chat group</p>
                        </div>

                        {/* Thông tin thành viên đang chỉnh sửa */}
                        {selectedMember && (
                            <div className="mb-4 p-4 bg-amber-50 rounded-lg flex items-center border border-amber-100">
                                <Avatar
                                    src={selectedMember.avatarUrl || 'https://via.placeholder.com/32'}
                                    sx={{ width: 50, height: 50 }}
                                    className="border-2 border-white shadow-sm"
                                />
                                <div className="ml-3">
                                    <div className="font-medium">{selectedMember.fullName || 'No name'}</div>
                                    <div className="text-sm text-gray-600">{selectedMember.accountId == currentUserId ? 'You' : 'Member'}</div>
                                </div>
                            </div>
                        )}

                        {/* Form chỉnh sửa tên hiển thị */}
                        <form onSubmit={handleUpdateMemberTitle} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-1 text-sm font-medium">Display Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                    value={editMemberTitle}
                                    onChange={e => setEditMemberTitle(e.target.value)}
                                    placeholder="Enter display name..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-all font-bold flex items-center justify-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Update
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
} 