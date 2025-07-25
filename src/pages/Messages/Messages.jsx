import React, { useEffect, useState, useRef } from 'react';
import { getUserId } from '@/apis/authService';
import { getRelativeTime } from "@/utils/dateUtils";
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Navbar from '@/components/Navbar/Navbar';
import useMessage from '@/hooks/useMessage';

export default function Messages() {
    const currentUserId = getUserId();
    const {
        chatRooms,
        selectedChatRoom,
        loading,
        messages,
        messageInput,
        attachments,
        chatMembers,
        hasMoreMessages,

        setSelectedChatRoom,
        setMessageInput,

        fetchChatRooms,
        fetchMessages,
        ensureChatRoom,
        sendNewMessage,
        loadMoreMessages,
        handleAddAttachment,
        handleRemoveAttachment
    } = useMessage(currentUserId);

    const [showMembersSidebar, setShowMembersSidebar] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null); // Thêm ref cho container tin nhắn

    // State cho modal xem ảnh phóng to
    const [imagePreview, setImagePreview] = useState({
        show: false,
        url: ''
    });

    // Hàm mở modal xem ảnh
    const openImagePreview = (url) => {
        setImagePreview({
            show: true,
            url
        });
    };

    // Hàm đóng modal xem ảnh
    const closeImagePreview = () => {
        setImagePreview({
            show: false,
            url: ''
        });
    };

    // Cuộn xuống cuối cùng khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        // Chia sẻ ref với window để có thể truy cập từ useMessage.js
        window.messagesEndRef = messagesEndRef;
    }, [messages]);

    // Khi component unmount, xóa ref khỏi window
    useEffect(() => {
        return () => {
            delete window.messagesEndRef;
        };
    }, []);

    // Lấy danh sách phòng chat khi component mount
    useEffect(() => {
        fetchChatRooms();

        // Kiểm tra xem có chatRoomId được lưu trong localStorage không
        const savedChatRoomId = localStorage.getItem('selectedChatRoomId');
        if (savedChatRoomId) {
            console.log("Đã tìm thấy chatRoomId trong localStorage:", savedChatRoomId);
            // Đặt timeout nhỏ để đảm bảo danh sách phòng chat đã được tải
            setTimeout(() => {
                setSelectedChatRoom(parseInt(savedChatRoomId));
                localStorage.removeItem('selectedChatRoomId');
                console.log("Đã chọn phòng chat từ localStorage:", savedChatRoomId);
            }, 30);
        }
    }, [fetchChatRooms]);


    // Xử lý gửi tin nhắn
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() && attachments.length === 0) return;
        sendNewMessage(messageInput);
    };

    // Xử lý khi chọn phòng chat
    const handleSelectChatRoom = (chatRoomId) => {
        setSelectedChatRoom(chatRoomId);
    };

    // Lọc phòng chat theo từ khóa tìm kiếm
    const filteredChatRooms = chatRooms.filter(room =>
        room.targetName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Hiển thị nội dung tin nhắn dựa trên loại
    const renderMessageContent = (msg) => {
        switch (msg.type) {
            case "Link":
                return (
                    <div className="leading-relaxed">
                        <div>{msg.content}</div>
                        {/* Tách và hiển thị các link */}
                        {msg.content.match(/(https?:\/\/[^\s]+)/g)?.map((url, index) => (
                            <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline break-all"
                            >
                                {url}
                            </a>
                        ))}
                    </div>
                );
            case "File":
                return (
                    <div className="leading-relaxed">
                        {/* Đối với loại File, content chính là URL của file */}
                        {msg.content && (
                            <div>
                                {/* Kiểm tra loại file để hiển thị phù hợp */}
                                {msg.content.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                    // Hiển thị ảnh
                                    <img
                                        src={msg.content}
                                        alt="Hình ảnh"
                                        className="max-w-full rounded-lg max-h-60 object-contain cursor-pointer hover:opacity-90"
                                        onClick={() => openImagePreview(msg.content)}
                                    />
                                ) : msg.content.match(/\.(mp4|webm|ogg)$/i) ? (
                                    // Hiển thị video
                                    <video
                                        controls
                                        className="max-w-full rounded-lg max-h-60"
                                    >
                                        <source src={msg.content} />
                                        Trình duyệt của bạn không hỗ trợ video này.
                                    </video>
                                ) : (
                                    // Hiển thị link tải xuống cho các loại file khác
                                    <a
                                        href={msg.content}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center bg-gray-100 rounded-md p-2 hover:bg-gray-200 transition-colors"
                                    >
                                        <i className="fas fa-file-download mr-2 text-blue-500"></i>
                                        <span className="text-sm text-blue-600">Tải xuống tệp đính kèm</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                );
            case "Text":
            default:
                return <div className="leading-relaxed">{msg.content}</div>;
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 pt-20 pb-6">
                {/* Header */}
                <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg px-6 py-4 flex justify-between items-center mb-6 rounded-lg text-white">
                    <h1 className="text-2xl font-bold flex items-center">
                        <i className="fas fa-comments text-2xl mr-3"></i>
                        Tin nhắn
                    </h1>
                    <div className="flex space-x-3">
                        <button
                            className={`p-2 rounded-lg text-sm font-medium transition duration-300 flex items-center space-x-1 ${showMembersSidebar ? 'bg-white text-blue-600' : 'bg-blue-700 text-white hover:bg-blue-900'}`}
                            onClick={() => setShowMembersSidebar(!showMembersSidebar)}
                        >
                            <i className="fa-solid fa-user-group-simple text-lg"></i>
                            <span>Danh bạ</span>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="bg-white shadow-xl rounded-lg overflow-hidden flex h-[calc(100vh-180px)] border border-gray-200">
                    {/* Danh sách cuộc trò chuyện */}
                    <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-100">
                            <h2 className="font-bold text-gray-800 flex items-center">
                                <i className="fas fa-comment-dots text-blue-500 mr-2"></i>
                                Cuộc trò chuyện
                            </h2>
                            {/* <button
                                className="ml-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow transition-all duration-200 focus:outline-none flex items-center justify-center"
                                title="Tạo cuộc trò chuyện mới"
                            >
                                <i className="fas fa-plus"></i>
                            </button> */}
                        </div>
                        <div className="px-4 py-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-gray-100 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                                    placeholder="Tìm kiếm tin nhắn..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <i className="fas fa-search absolute left-3 top-3 text-gray-400 text-sm"></i>
                                {searchQuery && (
                                    <button
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <i className="fas fa-times text-sm"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {loading && chatRooms.length === 0 ? (
                                <div className="flex justify-center items-center h-32">
                                    <CircularProgress size={24} />
                                </div>
                            ) : filteredChatRooms.length > 0 ? (
                                filteredChatRooms.map(room => (
                                    <button
                                        key={room.chatRoomId}
                                        onClick={() => handleSelectChatRoom(room.chatRoomId)}
                                        className={`w-full flex items-center p-3 hover:bg-gray-100 transition-colors ${selectedChatRoom === room.chatRoomId ? 'bg-blue-100' : ''}`}
                                    >
                                        <img
                                            src={room.targetAvatar || 'https://via.placeholder.com/40'}
                                            alt={room.targetName}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div className="ml-3 flex-1 text-left">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900">{room.targetName}</span>
                                                <span className="text-xs text-gray-500">
                                                    {room.latestMessageTime ? getRelativeTime(room.latestMessageTime) : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate max-w-[200px]">{room.latestMessageContent}</p>
                                        </div>
                                        {room.unreadCount > 0 && (
                                            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {room.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <i className="fas fa-search text-4xl text-gray-300 mb-2"></i>
                                        <p className="text-sm">Không tìm thấy cuộc trò chuyện nào</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Khung chat */}
                    <div className={`flex-1 flex flex-col bg-white ${showMembersSidebar ? 'border-r border-gray-200' : ''}`}>
                        {selectedChatRoom ? (
                            <>
                                {/* Header cuộc trò chuyện */}
                                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shadow-sm">
                                    {loading ? (
                                        <div className="flex items-center">
                                            <CircularProgress size={20} />
                                            <div className="ml-3">
                                                <h2 className="font-medium text-gray-900">Đang tải...</h2>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <img
                                                src={chatRooms.find(r => r.chatRoomId === selectedChatRoom)?.targetAvatar || 'https://via.placeholder.com/40'}
                                                alt="Avatar"
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="ml-3">
                                                <h2 className="font-medium text-gray-900">
                                                    {chatRooms.find(r => r.chatRoomId === selectedChatRoom)?.targetName}
                                                </h2>
                                                <p className="text-xs text-gray-500">Trực tuyến</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="relative">
                                        <button
                                            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-all duration-200"
                                        >
                                            <i className="fas fa-ellipsis-h text-gray-600"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* Tin nhắn */}
                                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50"
                                    ref={messagesContainerRef} // Thêm ref cho container tin nhắn
                                >
                                    {loading && messages.length === 0 ? (
                                        <div className="flex justify-center items-center h-32">
                                            <CircularProgress size={24} />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Hiển thị tin nhắn theo thứ tự thời gian, tin nhắn cũ nhất ở trên cùng */}
                                            {messages
                                                .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
                                                .map(msg => {
                                                    const isMe = msg.senderId == currentUserId || msg.senderAccountId == currentUserId;
                                                    const senderInfo = chatMembers[msg.senderId || msg.senderAccountId];

                                                    return (
                                                        <div
                                                            key={msg.id || msg.messageId}
                                                            className={`flex items-start space-x-3 ${isMe ? 'justify-end' : ''}`}
                                                        >
                                                            {!isMe && (
                                                                <img
                                                                    src={senderInfo?.avatar || msg.avatarUrl || 'https://via.placeholder.com/40'}
                                                                    alt={senderInfo?.fullName || msg.name || 'User'}
                                                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
                                                                />
                                                            )}
                                                            <div
                                                                className={`max-w-sm px-4 py-3 rounded-lg shadow-sm ${isMe
                                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none'
                                                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                                                    }`}
                                                                style={{ wordBreak: 'break-word' }}
                                                            >
                                                                {!isMe && (
                                                                    <div className="font-semibold text-sm mb-1">
                                                                        {senderInfo?.fullName || msg.name || 'User'}
                                                                    </div>
                                                                )}
                                                                {renderMessageContent(msg)}
                                                                <div className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                                                    {getRelativeTime(msg.sentAt || msg.createdAt)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Input tin nhắn */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                                    <div className="flex flex-col space-y-2">
                                        <div className="flex">
                                            <input
                                                type="text"
                                                className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Nhập tin nhắn..."
                                                value={messageInput}
                                                onChange={e => setMessageInput(e.target.value)}
                                            />
                                            <label className="bg-gray-100 text-gray-700 px-3 py-2 cursor-pointer hover:bg-gray-200 transition-all flex items-center border-t border-b border-gray-300">
                                                <i className="fas fa-paperclip text-blue-600"></i>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={e => {
                                                        if (e.target.files && e.target.files.length > 0) {
                                                            handleAddAttachment(Array.from(e.target.files));
                                                        }
                                                    }}
                                                    multiple
                                                />
                                            </label>
                                            <button
                                                type="submit"
                                                className="bg-blue-600 text-white px-5 py-2 rounded-r-lg hover:bg-blue-700 transition-all flex items-center gap-1"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <div className="flex items-center">
                                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                                        Đang gửi...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-paper-plane"></i>
                                                        Gửi
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Hiển thị file đính kèm */}
                                        {attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {attachments.map((file, index) => (
                                                    <div key={index} className="bg-gray-100 rounded-md p-1 flex items-center">
                                                        <span className="text-xs text-gray-700 truncate max-w-[100px]">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            className="ml-1 text-gray-500 hover:text-red-500"
                                                            onClick={() => handleRemoveAttachment(index)}
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </>
                        ) : (
                            // Hiển thị khi chưa chọn cuộc trò chuyện
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <i className="fas fa-comments text-6xl mb-4"></i>
                                <p className="text-lg font-medium">Chọn một cuộc trò chuyện để bắt đầu</p>
                                <p className="text-sm mt-2">Hoặc tạo một cuộc trò chuyện mới</p>
                                <button
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Tạo cuộc trò chuyện mới
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar phải: Danh bạ */}
                    {showMembersSidebar && (
                        <div className="w-72 bg-gray-50 flex flex-col">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-100">
                                <h2 className="font-bold text-gray-800 flex items-center">
                                    <i className="fas fa-address-book text-blue-500 mr-2"></i>
                                    Danh bạ
                                </h2>
                            </div>
                            <div className="px-3 py-3 border-b border-gray-200 bg-gray-50">
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Tìm kiếm liên hệ..."
                                    />
                                    <i className="fas fa-search text-gray-400 absolute left-2 top-2.5 text-sm"></i>
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                <div className="mb-4 mt-2">
                                    <div className="font-bold text-xs text-gray-500 mb-1 px-4 uppercase tracking-wider">Liên hệ gần đây</div>
                                    {[1, 2, 3].map(id => (
                                        <li key={id} className="group list-none">
                                            <div className="flex items-center justify-between p-3 rounded-lg mx-2 hover:bg-white hover:shadow-sm transition-all">
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative">
                                                        <img
                                                            src={`https://via.placeholder.com/40?text=User${id}`}
                                                            alt="avatar"
                                                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                                        />
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">Người dùng {id}</div>
                                                        <div className="text-xs text-gray-500">Trực tuyến</div>
                                                    </div>
                                                </div>
                                                <button
                                                    className="text-blue-500 hover:bg-blue-50 p-1 rounded-full"
                                                    onClick={() => ensureChatRoom(id)}
                                                >
                                                    <i className="fas fa-comment text-sm"></i>
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal xem ảnh phóng to */}
            {imagePreview.show && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
                    onClick={closeImagePreview}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            className="absolute top-2 right-2 bg-white rounded-full p-2 text-gray-800 hover:bg-gray-200"
                            onClick={closeImagePreview}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        <img
                            src={imagePreview.url}
                            alt="Xem ảnh"
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                    </div>
                </div>
            )}
        </>
    );
} 