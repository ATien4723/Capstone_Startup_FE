import React, { useEffect, useState, useRef } from 'react';
import { getRelativeTime } from "@/utils/dateUtils";
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import { getUserId } from '@/apis/authService';
import useStartupChat from '@/hooks/useStartupChat';
import { toast } from 'react-toastify';

export default function UserChat() {
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
        selectedFile,
        startupId,

        setSelectedChatRoom,
        setMessageInput,
        setSelectedFile,

        fetchChatRooms,
        fetchMessages,
        ensureChatRoom,
        sendNewMessageAsStartup,
        loadMoreMessages,
        handleAddAttachment,
        handleRemoveAttachment,
        fetchUserInfo
    } = useStartupChat(currentUserId);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showMembersSidebar, setShowMembersSidebar] = useState(false);
    const [switchingRoom, setSwitchingRoom] = useState(false);
    const [imagePreview, setImagePreview] = useState({
        show: false,
        url: ''
    });

    // Hàm xử lý khi cuộn xuống để tải thêm tin nhắn cũ
    const handleScroll = () => {
        if (!messagesContainerRef.current || loadingMore || !hasMoreMessages) return;

        // Với flex-col-reverse, chúng ta cần theo dõi khoảng cách từ dưới cùng
        const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
        const scrolledToBottom = scrollHeight - scrollTop - clientHeight;

        // Nếu người dùng đã cuộn xuống gần cuối khung chat (trong khoảng 200px từ cuối)
        if (scrolledToBottom < 200) {
            setLoadingMore(true);

            // Lưu vị trí cuộn và chiều cao hiện tại
            const oldScrollHeight = messagesContainerRef.current.scrollHeight;
            const oldScrollTop = messagesContainerRef.current.scrollTop;

            // Tải thêm tin nhắn
            loadMoreMessages().then(() => {
                setLoadingMore(false);

                // Sau khi tải thêm tin nhắn, giữ nguyên vị trí cuộn tương đối
                setTimeout(() => {
                    if (messagesContainerRef.current) {
                        const newScrollHeight = messagesContainerRef.current.scrollHeight;
                        const heightDifference = newScrollHeight - oldScrollHeight;
                        messagesContainerRef.current.scrollTop = oldScrollTop + heightDifference;
                    }
                }, 100);
            }).catch(() => {
                setLoadingMore(false);
            });
        }
    };

    // Thêm sự kiện lắng nghe cuộn cho container tin nhắn
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => {
                container.removeEventListener('scroll', handleScroll);
            };
        }
    }, [loadingMore, hasMoreMessages, selectedChatRoom]);

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

    // Chia sẻ ref với window để có thể truy cập từ useMessage.js
    useEffect(() => {
        window.messagesEndRef = messagesEndRef;
    }, [messages, selectedChatRoom]);

    // Khi component unmount, xóa ref khỏi window
    useEffect(() => {
        return () => {
            delete window.messagesEndRef;
        };
    }, []);

    // Lấy danh sách phòng chat khi component mount
    useEffect(() => {
        const loadData = async () => {
            await fetchChatRooms(); // luôn gọi, bên trong tự xử lý startupId

            const savedChatRoomId = localStorage.getItem('selectedChatRoomId');
            if (savedChatRoomId) {
                setTimeout(() => {
                    setSelectedChatRoom(parseInt(savedChatRoomId));
                    localStorage.removeItem('selectedChatRoomId');
                }, 30);
            }
        };

        loadData();
    }, [fetchChatRooms]);

    // Xử lý gửi tin nhắn
    const [sendingMessage, setSendingMessage] = useState(false);

    // Xử lý gửi tin nhắn với vai trò là startup
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (sendingMessage) return; // Không gửi nếu đang trong quá trình gửi tin nhắn
        if (!messageInput.trim() && attachments.length === 0) return;

        try {
            setSendingMessage(true); // Đánh dấu đang gửi tin nhắn
            // Luôn gửi tin nhắn với vai trò startup
            await sendNewMessageAsStartup(e);
        } finally {
            // Đảm bảo luôn reset trạng thái gửi tin nhắn khi hoàn tất
            setTimeout(() => {
                setSendingMessage(false);
            }, 300);
        }
    };

    // Xử lý khi chọn phòng chat
    const handleSelectChatRoom = (chatRoomId) => {
        if (selectedChatRoom === chatRoomId) {
            console.log("Đã chọn phòng chat này rồi:", chatRoomId);
            return; // Tránh chọn lại phòng chat hiện tại
        }

        // Đánh dấu đang chuyển phòng chat
        setSwitchingRoom(true);

        try {
            // Làm sạch tin nhắn cũ trước khi chuyển phòng chat
            setSelectedChatRoom(chatRoomId);
        } finally {
            // Đảm bảo reset flag sau một thời gian nhỏ
            setTimeout(() => {
                // Tắt trạng thái chuyển phòng chat
                setSwitchingRoom(false);
            }, 300); // Cho thêm thời gian để tải tin nhắn
        }
    };

    // Lọc phòng chat theo từ khóa tìm kiếm
    const filteredChatRooms = chatRooms.filter(room =>
        room.targetName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Hiển thị nội dung tin nhắn dựa trên loại
    const renderMessageContent = (msg) => {
        const isMe = msg.senderId == currentUserId || msg.senderAccountId == currentUserId;

        // Kiểm tra nếu tin nhắn là hình ảnh
        if (msg.type === "File" && msg.content && (
            msg.content.toLowerCase().endsWith('.jpg') ||
            msg.content.toLowerCase().endsWith('.jpeg') ||
            msg.content.toLowerCase().endsWith('.png') ||
            msg.content.toLowerCase().endsWith('.gif') ||
            msg.content.toLowerCase().endsWith('.webp')
        )) {
            return null; // Hình ảnh sẽ được xử lý riêng ở nơi khác
        }

        switch (msg.type) {
            case "Link":
                return (
                    <div className="leading-relaxed">
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
                if (!msg.content) return null;

                // Kiểm tra loại file để hiển thị phù hợp
                if (msg.content.toLowerCase().endsWith('.mp4') ||
                    msg.content.toLowerCase().endsWith('.webm') ||
                    msg.content.toLowerCase().endsWith('.mov') ||
                    msg.content.toLowerCase().endsWith('.avi')) {
                    return (
                        <div className="flex flex-col">
                            <div className="overflow-hidden shadow-md rounded-lg">
                                <video
                                    controls
                                    className="max-w-full"
                                >
                                    <source src={msg.content} />
                                    Trình duyệt của bạn không hỗ trợ video này.
                                </video>
                            </div>
                        </div>
                    );
                } else {
                    // Hiển thị link tải xuống cho các loại file khác
                    return (
                        <div className="flex items-center bg-gray-50 p-3 text-gray-700 rounded-lg">
                            <i className="fas fa-file-download mr-2 text-blue-500"></i>
                            <a
                                href={msg.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-blue-500 transition-colors"
                            >
                                Attachment
                            </a>
                        </div>
                    );
                }
            case "Text":
            default:
                return <div className="leading-relaxed">{msg.content}</div>;
        }
    };

    // Hàm gửi tin nhắn với tư cách là startup
    // const sendStartupMessage = async (startupId, content, chatRoomId, file = null) => {
    //     try {
    //         if (!startupId) {
    //             toast.error('Cần cung cấp ID của startup!');
    //             return null;
    //         }

    //         if (!chatRoomId) {
    //             toast.error('Cần cung cấp ID phòng chat!');
    //             return null;
    //         }

    //         // Xác định loại tin nhắn dựa vào file nếu có
    //         let messageType = 'Text';
    //         if (file) {
    //             // Kiểm tra loại file để xác định loại tin nhắn
    //             const fileName = file.name.toLowerCase();
    //             if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
    //                 fileName.endsWith('.png') || fileName.endsWith('.gif')) {
    //                 messageType = 'Image';
    //             } else if (fileName.endsWith('.mp4') || fileName.endsWith('.avi') ||
    //                 fileName.endsWith('.mov') || fileName.endsWith('.webm')) {
    //                 messageType = 'Video';
    //             } else {
    //                 messageType = 'File';
    //             }
    //         }

    //         // Gọi hàm từ useMessage hook để gửi tin nhắn
    //         const result = await sendMessageAsStartup(startupId, content, chatRoomId, messageType, file);

    //         // Cuộn xuống để hiển thị tin nhắn mới
    //         if (window.messagesEndRef && window.messagesEndRef.current) {
    //             window.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    //         }

    //         return result;
    //     } catch (error) {
    //         console.error('Lỗi khi gửi tin nhắn từ startup:', error);
    //         toast.error('Không thể gửi tin nhắn từ startup này');
    //         return null;
    //     }
    // };

    // Lấy thông tin người gửi khi tin nhắn thay đổi
    useEffect(() => {
        const fetchSendersInfo = async () => {
            if (messages.length > 0) {
                // Lấy tất cả các tin nhắn không phải từ startup và chưa có thông tin người gửi
                const messagesNeedInfo = messages.filter(msg =>
                    msg.senderId && !msg.senderStartupId &&
                    (!chatMembers[msg.senderId] || !chatMembers[msg.senderId].fullName)
                );

                // Lấy danh sách unique senderIds
                const uniqueSenderIds = [...new Set(messagesNeedInfo.map(msg => msg.senderId))];

                // Lấy thông tin từng người gửi
                for (const senderId of uniqueSenderIds) {
                    if (senderId) {
                        await fetchUserInfo(senderId);
                    }
                }
            }
        };

        fetchSendersInfo();
    }, [messages, chatMembers, fetchUserInfo]);

    return (
        <>
            {/* Header */}
            <header className="bg-gradient-to-r from-green-600 to-green-800 shadow-lg px-6 py-4 flex justify-between items-center mb-6 rounded-lg text-white">
                <h1 className="text-2xl font-bold flex items-center">
                    <i className="fas fa-building text-2xl mr-3"></i>
                    Business Messages
                </h1>
                {/* <div className="flex space-x-3">
                    <button
                        className={`p-2 rounded-lg text-sm font-medium transition duration-300 flex items-center space-x-1 ${showMembersSidebar ? 'bg-white text-green-600' : 'bg-green-700 text-white hover:bg-green-900'}`}
                        onClick={() => setShowMembersSidebar(!showMembersSidebar)}
                    >
                        <i className="fa-solid fa-user-group-simple text-lg"></i>
                        <span>Contacts</span>
                    </button>
                </div> */}
            </header>

            {/* Main Content */}
            <div className="bg-white shadow-xl rounded-lg overflow-hidden flex h-[calc(100vh-180px)] border border-gray-200">
                {/* Danh sách cuộc trò chuyện */}
                <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-100">
                        <h2 className="font-bold text-gray-800 flex items-center">
                            <i className="fas fa-comment-dots text-green-500 mr-2"></i>
                            Conversations
                        </h2>
                    </div>
                    <div className="px-4 py-3">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full bg-gray-100 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all"
                                placeholder="Search messages..."
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

                    {/* Danh sách phòng chat */}
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
                                    className={`w-full flex items-center p-3 hover:bg-gray-100 transition-colors ${selectedChatRoom === room.chatRoomId ? 'bg-green-100' : ''}`}
                                >
                                    <img
                                        src={room.targetAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
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
                                        <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                            {room.latestMessageContent && (
                                                room.latestMessageContent.toLowerCase().endsWith('.jpg') ||
                                                room.latestMessageContent.toLowerCase().endsWith('.jpeg') ||
                                                room.latestMessageContent.toLowerCase().endsWith('.png') ||
                                                room.latestMessageContent.toLowerCase().endsWith('.gif') ||
                                                room.latestMessageContent.toLowerCase().endsWith('.webp')
                                            ) ? '🖼️ Image' : room.latestMessageContent}
                                        </p>
                                    </div>
                                    {room.unreadCount > 0 && (
                                        <span className="ml-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                                {!chatRooms.find(r => r.chatRoomId === selectedChatRoom) ? (
                                    <div className="flex items-center">
                                        <CircularProgress size={20} />
                                        <div className="ml-3">
                                            <h2 className="font-medium text-gray-900">Loading...</h2>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <img
                                            src={chatRooms.find(r => r.chatRoomId === selectedChatRoom)?.targetAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                            alt="Avatar"
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="ml-3">
                                            <h2 className="font-medium text-gray-900">
                                                {chatRooms.find(r => r.chatRoomId === selectedChatRoom)?.targetName}
                                            </h2>
                                            <p className="text-xs text-gray-500">Online</p>
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
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 flex flex-col-reverse"
                                ref={messagesContainerRef}
                            >
                                <div ref={messagesEndRef} />
                                {/* Hiển thị trạng thái đang tải thêm tin nhắn */}
                                {loadingMore && (
                                    <div className="flex justify-center py-2">
                                        <CircularProgress size={20} />
                                    </div>
                                )}

                                {switchingRoom ? (
                                    <div className="flex items-center justify-center h-32">
                                        {/* Không hiển thị loading khi chuyển phòng */}
                                    </div>
                                ) : loading && messages.length === 0 ? (
                                    <div className="flex justify-center items-center h-32">
                                        <CircularProgress size={24} />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                        <i className="fas fa-comments text-4xl mb-3"></i>
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Hiển thị tin nhắn theo thứ tự thời gian, tin nhắn cũ nhất ở trên cùng */}
                                        {messages
                                            .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                                            .map(msg => {
                                                const isMe = msg.senderStartupId == startupId;
                                                // Xác định thông tin người gửi dựa trên senderId hoặc senderStartupId
                                                let senderInfo;

                                                if (msg.senderStartupId && msg.senderStartupId != startupId) {
                                                    // Trường hợp tin nhắn từ startup khác
                                                    senderInfo = chatMembers[`startup_${msg.senderStartupId}`] || {
                                                        fullName: msg.name || "Startup",
                                                        avatar: msg.avatarUrl
                                                    };
                                                } else if (msg.senderId || msg.senderAccountId) {
                                                    // Trường hợp tin nhắn từ người dùng
                                                    const senderId = msg.senderId || msg.senderAccountId;
                                                    senderInfo = chatMembers[senderId] || {
                                                        fullName: msg.name || 'User',
                                                        avatar: msg.avatarUrl
                                                    };
                                                }



                                                const isImageMessage = msg.type === "File" && msg.content && (
                                                    msg.content.toLowerCase().endsWith('.jpg') ||
                                                    msg.content.toLowerCase().endsWith('.jpeg') ||
                                                    msg.content.toLowerCase().endsWith('.png') ||
                                                    msg.content.toLowerCase().endsWith('.gif') ||
                                                    msg.content.toLowerCase().endsWith('.webp')
                                                );

                                                return (
                                                    <div
                                                        key={msg.id || msg.messageId}
                                                        className={`flex items-start space-x-3 ${isMe ? 'justify-end' : ''}`}
                                                    >
                                                        {!isMe && (
                                                            <img
                                                                src={senderInfo?.avatar || msg.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                                                alt={senderInfo?.fullName || msg.name || 'User'}
                                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
                                                            />
                                                        )}

                                                        {isImageMessage ? (
                                                            <div className="max-w-sm">
                                                                {!isMe && (
                                                                    <div className="font-semibold text-sm mb-1 ml-1">
                                                                        {senderInfo?.fullName || msg.name || 'User'}
                                                                    </div>
                                                                )}

                                                                <div className="rounded-lg overflow-hidden shadow-sm">
                                                                    <img
                                                                        src={msg.content}
                                                                        alt="Hình ảnh"
                                                                        className="max-w-full object-contain cursor-pointer hover:opacity-90"
                                                                        onClick={() => openImagePreview(msg.content)}
                                                                    />
                                                                </div>

                                                                <div className={`text-xs mt-1 ml-1 ${isMe ? 'text-right text-gray-600' : 'text-gray-500'}`}>
                                                                    {getRelativeTime(msg.sentAt || msg.createdAt)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={`max-w-sm px-4 py-3 rounded-lg shadow-sm ${isMe
                                                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-tr-none'
                                                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                                                    }`}
                                                                style={{ wordBreak: 'break-word' }}
                                                            >
                                                                {!isMe && (
                                                                    <div className="font-semibold text-sm mb-1">
                                                                        {senderInfo?.fullName || msg.name || 'User'}
                                                                    </div>
                                                                )}
                                                                {/* Không hiển thị content trực tiếp, mà dùng renderMessageContent */}
                                                                {renderMessageContent(msg)}
                                                                <div className={`text-xs mt-1 ${isMe ? 'text-green-100' : 'text-gray-500'}`}>
                                                                    {getRelativeTime(msg.sentAt || msg.createdAt)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </>
                                )}
                            </div>

                            {/* Input tin nhắn */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex">
                                        <input
                                            type="text"
                                            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Type a message..."
                                            value={messageInput}
                                            onChange={e => setMessageInput(e.target.value)}
                                        />
                                        <label className="bg-gray-100 text-gray-700 px-3 py-2 cursor-pointer hover:bg-gray-200 transition-all flex items-center border-t border-b border-gray-300">
                                            <i className="fas fa-paperclip text-green-600"></i>
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
                                            className="bg-green-600 text-white px-5 py-2 rounded-r-lg hover:bg-green-700 transition-all flex items-center gap-1"
                                            disabled={sendingMessage}
                                        >
                                            {sendingMessage ? (
                                                <div className="flex items-center">
                                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                                    Sending...
                                                </div>
                                            ) : (
                                                <>
                                                    <i className="fas fa-paper-plane"></i>
                                                    Send
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
                            <i className="fas fa-building text-6xl mb-4 text-green-300"></i>
                            <p className="text-lg font-medium">Chọn một cuộc trò chuyện để bắt đầu</p>
                            <p className="text-sm mt-2">Hoặc tạo một cuộc trò chuyện mới</p>
                            <button
                                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                onClick={() => toast.info('Tính năng đang được phát triển')}
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
