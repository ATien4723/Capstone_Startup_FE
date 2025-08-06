import React, { useEffect, useState, useRef } from 'react';
import { getUserId } from '@/apis/authService';
import { getRelativeTime } from "@/utils/dateUtils";
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Navbar from '@/components/Navbar/Navbar';
import useMessage from '@/hooks/useMessage';
import useVideoCall from '@/hooks/useVideoCall';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Messages() {
    const { chatRoomId } = useParams();
    const navigate = useNavigate();
    const currentUserId = getUserId();
    const isInitializing = useRef(false); // Tham chiếu để kiểm soát quá trình khởi tạo
    const hasInitialized = useRef(false); // Tham chiếu để đánh dấu đã khởi tạo xong

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
        setMessages,

        fetchChatRooms,
        fetchMessages,
        ensureChatRoom,
        sendNewMessage,
        loadMoreMessages,
        handleAddAttachment,
        handleRemoveAttachment
    } = useMessage(currentUserId);

    // Sử dụng hook useVideoCall
    const {
        isCallModalOpen,
        isCallActive,
        isCallIncoming,
        callerInfo,
        calleeInfo,
        isMuted,
        isVideoOff,
        connectionEstablished,

        localVideoRef,
        remoteVideoRef,

        startVideoCall,
        endCall,
        // checkIncomingCall,
        answerCall,
        rejectCall,
        toggleMute,
        toggleVideo,
    } = useVideoCall(currentUserId);

    const [showMembersSidebar, setShowMembersSidebar] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null); // Thêm ref cho container tin nhắn
    const [loadingMore, setLoadingMore] = useState(false); // Thêm state để theo dõi trạng thái tải thêm tin nhắn
    const [switchingRoom, setSwitchingRoom] = useState(false); // Thêm state để theo dõi trạng thái chuyển phòng
    const [sendingMessage, setSendingMessage] = useState(false); // Thêm state riêng để theo dõi việc gửi tin nhắn

    // State cho modal xem ảnh phóng to
    const [imagePreview, setImagePreview] = useState({
        show: false,
        url: ''
    });

    // Định kỳ kiểm tra cuộc gọi đến khi đã chọn một phòng chat
    // useEffect(() => {
    //     if (!selectedChatRoom) return;

    //     // Kiểm tra ngay khi component mount hoặc selectedChatRoom thay đổi
    //     checkIncomingCall(selectedChatRoom);

    //     // Kiểm tra định kỳ mỗi 5 giây
    //     const intervalId = setInterval(() => {
    //         checkIncomingCall(selectedChatRoom);
    //     }, 5000);

    //     return () => {
    //         clearInterval(intervalId);
    //     };
    // }, [selectedChatRoom]);

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

    // Không cần cuộn xuống khi có tin nhắn mới nữa vì đã dùng flex-col-reverse
    useEffect(() => {
        // Chia sẻ ref với window để có thể truy cập từ useMessage.js
        window.messagesEndRef = messagesEndRef;
    }, [messages, selectedChatRoom]);

    // Khi component unmount, xóa ref khỏi window
    useEffect(() => {
        return () => {
            delete window.messagesEndRef;
        };
    }, []);

    // Lấy danh sách phòng chat và tự động chọn phòng đầu tiên nếu không có chatRoomId
    useEffect(() => {
        // Nếu đang trong quá trình khởi tạo, bỏ qua
        if (isInitializing.current) return;

        // Nếu đã khởi tạo xong và không có thay đổi từ URL, bỏ qua
        if (hasInitialized.current &&
            ((chatRoomId && parseInt(chatRoomId) === selectedChatRoom) ||
                (!chatRoomId && selectedChatRoom))) {
            return;
        }

        // Đánh dấu là đang khởi tạo để tránh gọi lại
        isInitializing.current = true;

        const initializeChat = async () => {
            try {
                // Tải danh sách phòng chat
                await fetchChatRooms(false); // false để không tự động chọn phòng đầu tiên

                // Nếu có chatRoomId từ URL, ưu tiên sử dụng nó
                if (chatRoomId) {
                    const roomId = parseInt(chatRoomId);
                    setMessages([]);
                    setSelectedChatRoom(roomId);
                }
                // Nếu không có chatRoomId từ URL và đã có phòng chat đang chọn, giữ nguyên
                else if (selectedChatRoom) {
                    console.log("Giữ nguyên phòng chat đang chọn:", selectedChatRoom);
                    // Cập nhật URL theo phòng chat đang chọn
                    navigate(`/messages/u/${selectedChatRoom}`, { replace: true });
                }
                // Nếu không có chatRoomId từ URL và không có phòng chat đang chọn
                else {
                    // Nếu không có chatRoomId từ URL, kiểm tra localStorage
                    const savedChatRoomId = localStorage.getItem('selectedChatRoomId');
                    if (savedChatRoomId) {
                        const roomId = parseInt(savedChatRoomId);
                        console.log("Chọn phòng chat từ localStorage:", roomId);
                        setMessages([]);
                        setSelectedChatRoom(roomId);

                        // Đánh dấu đang chuyển phòng chat
                        setSwitchingRoom(true);
                        setTimeout(() => {
                            setSwitchingRoom(false);
                        }, 100);

                        localStorage.removeItem('selectedChatRoomId');
                        // Cập nhật URL
                        navigate(`/messages/u/${roomId}`, { replace: true });
                    }
                    // Nếu không có cả hai và có ít nhất một phòng chat, chọn phòng đầu tiên
                    else if (chatRooms.length > 0) {
                        const firstRoomId = chatRooms[0].chatRoomId;
                        console.log("Tự động chọn phòng chat đầu tiên:", firstRoomId);
                        setMessages([]);
                        setSelectedChatRoom(firstRoomId);
                        // Cập nhật URL
                        navigate(`/messages/u/${firstRoomId}`, { replace: true });
                    }
                }

                // Đánh dấu là đã khởi tạo xong
                hasInitialized.current = true;
            } catch (error) {
                console.error("Lỗi khi khởi tạo chat:", error);
            } finally {
                // Kết thúc quá trình khởi tạo
                isInitializing.current = false;
            }
        };

        initializeChat();
    }, [chatRoomId, fetchChatRooms, chatRooms, navigate, setMessages, setSelectedChatRoom, selectedChatRoom]);

    // Xử lý gửi tin nhắn
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (sendingMessage) return; // Không gửi nếu đang trong quá trình gửi tin nhắn
        if (!messageInput.trim() && attachments.length === 0) return;

        try {
            setSendingMessage(true); // Đánh dấu đang gửi tin nhắn
            await sendNewMessage(e);
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

        // console.log("Người dùng chọn phòng chat:", chatRoomId);

        // Đánh dấu đang chuyển phòng chat
        setSwitchingRoom(true);

        // Đánh dấu là đang khởi tạo để tránh useEffect gọi lại
        isInitializing.current = true;

        try {
            // Làm sạch tin nhắn cũ trước khi chuyển phòng chat
            setMessages([]);

            // Chọn phòng chat mới
            setSelectedChatRoom(chatRoomId);

            // Cập nhật URL
            navigate(`/messages/u/${chatRoomId}`, { replace: true });

            // Đánh dấu là đã khởi tạo xong
            hasInitialized.current = true;
        } finally {
            // Đảm bảo reset flag sau một thời gian nhỏ
            setTimeout(() => {
                isInitializing.current = false;
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

        // Kiểm tra nếu tin nhắn là hình ảnh hoặc video
        if (msg.type === "File" && msg.content && (
            msg.content.toLowerCase().endsWith('.jpg') ||
            msg.content.toLowerCase().endsWith('.jpeg') ||
            msg.content.toLowerCase().endsWith('.png') ||
            msg.content.toLowerCase().endsWith('.gif') ||
            msg.content.toLowerCase().endsWith('.webp') ||
            msg.content.toLowerCase().endsWith('.mp4') ||
            msg.content.toLowerCase().endsWith('.webm') ||
            msg.content.toLowerCase().endsWith('.mov') ||
            msg.content.toLowerCase().endsWith('.avi')
        )) {
            return null; // Hình ảnh và video sẽ được xử lý riêng ở nơi khác
        }

        switch (msg.type) {
            case "Link":
                return (
                    <div className="leading-relaxed">
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
            case "Text":
            default:
                return <div className="leading-relaxed">{msg.content}</div>;
        }
    };

    // Kiểm tra xem có phải chat với startup không
    const isStartupChat = () => {
        const chatRoom = chatRooms.find(r => r.chatRoomId === selectedChatRoom);
        if (!chatRoom) return false;

        // console.log('🔍 Chat Room Type Check:', {
        //     chatRoomId: selectedChatRoom,
        //     type: chatRoom.type,
        //     isUserToStartup: chatRoom.type === "UserToStartup"
        // });

        // Kiểm tra type của chatRoom
        return chatRoom.type === "UserToStartup";
    };

    // Hàm bắt đầu cuộc gọi video với người dùng hiện tại
    const initiateVideoCall = () => {
        // Kiểm tra nếu không có phòng chat được chọn
        if (!selectedChatRoom) {
            toast.error("Vui lòng chọn một cuộc trò chuyện trước khi gọi");
            return;
        }

        // Lấy thông tin người nhận cuộc gọi
        const chatRoom = chatRooms.find(r => r.chatRoomId === selectedChatRoom);
        if (!chatRoom) {
            toast.error("Không tìm thấy thông tin cuộc trò chuyện");
            return;
        }

        // Gọi hàm startVideoCall từ hook với thông tin đầy đủ
        const targetInfo = {
            id: chatRoom.targetAccountId,
            name: chatRoom.targetName,
            fullName: chatRoom.targetName,
            avatarUrl: chatRoom.targetAvatar, // Sử dụng targetAvatar từ chatRoom
            accountId: chatRoom.targetAccountId
        };

        // console.log('🎯 Target Info for Video Call:', targetInfo);
        // console.log('🎯 Chat Room Data:', chatRoom);

        startVideoCall(
            selectedChatRoom, // chatRoomId
            chatRoom.targetName, // Tên người nhận
            targetInfo // Thông tin đầy đủ của người nhận
        );
    };

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 pt-20 pb-6">
                {/* Header */}
                <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg px-6 py-4 flex justify-between items-center mb-6 rounded-lg text-white">
                    <h1 className="text-2xl font-bold flex items-center">
                        <i className="fas fa-comments text-2xl mr-3"></i>
                        Messages
                    </h1>
                    {/* <div className="flex space-x-3">
                        <button
                            className={`p-2 rounded-lg text-sm font-medium transition duration-300 flex items-center space-x-1 ${showMembersSidebar ? 'bg-white text-blue-600' : 'bg-blue-700 text-white hover:bg-blue-900'}`}
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
                                <i className="fas fa-comment-dots text-blue-500 mr-2"></i>
                                Conversations
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
                                        className={`w-full flex items-center p-3 hover:bg-gray-100 transition-colors ${selectedChatRoom === room.chatRoomId ? 'bg-blue-100' : ''}`}
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
                                                ) ? '🖼️ Image' :
                                                    room.latestMessageContent && (
                                                        room.latestMessageContent.toLowerCase().endsWith('.mp4') ||
                                                        room.latestMessageContent.toLowerCase().endsWith('.webm') ||
                                                        room.latestMessageContent.toLowerCase().endsWith('.mov') ||
                                                        room.latestMessageContent.toLowerCase().endsWith('.avi') ||
                                                        (room.latestMessageContent.includes('cloudinary.com/') && room.latestMessageContent.includes('/video/'))
                                                    ) ? '🎬 Video' : room.latestMessageContent}
                                            </p>
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
                                    {!chatRooms.find(r => r.chatRoomId === selectedChatRoom) ? (
                                        <div className="flex items-center">
                                            <CircularProgress size={20} />
                                            <div className="ml-3">
                                                <h2 className="font-medium text-gray-900">Loading...</h2>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            {/* <button
                                                className="mr-2 text-gray-600 hover:text-gray-800"
                                                onClick={() => {
                                                    setSelectedChatRoom(null);
                                                    navigate('/messages');
                                                }}
                                            >
                                                <i className="fas fa-arrow-left"></i>
                                            </button> */}
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
                                    <div className="flex items-center space-x-2">
                                        {/* Nút gọi video */}
                                        {/* Chỉ hiển thị nút video call khi chat 1-1 với người dùng, không phải startup */}
                                        {!isStartupChat() && (
                                            <button
                                                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none transition-all duration-200"
                                                title="Video call"
                                                onClick={initiateVideoCall}
                                            >
                                                <i className="fas fa-video"></i>
                                            </button>
                                        )}

                                        <button
                                            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-all duration-200"
                                            title="Copy link"
                                            onClick={() => {
                                                const url = `${window.location.origin}/messages/u/${selectedChatRoom}`;
                                                navigator.clipboard.writeText(url);
                                                // toast.success("Conversation link copied");
                                            }}
                                        >
                                            <i className="fas fa-link text-gray-600"></i>
                                        </button>

                                        <button
                                            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-all duration-200"
                                        >
                                            <i className="fas fa-ellipsis-h text-gray-600"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* Tin nhắn */}
                                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 flex flex-col-reverse"
                                    ref={messagesContainerRef} // Thêm ref cho container tin nhắn
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
                                                    const isMe = msg.senderId == currentUserId || msg.senderAccountId == currentUserId;
                                                    // Xác định thông tin người gửi dựa trên senderId hoặc senderStartupId
                                                    let senderInfo;

                                                    if (msg.senderStartupId) {
                                                        // Trường hợp tin nhắn từ startup
                                                        senderInfo = chatMembers[`startup_${msg.senderStartupId}`] || {
                                                            fullName: msg.name || "Startup",
                                                            avatar: msg.avatarUrl
                                                        };
                                                    } else {
                                                        // Trường hợp tin nhắn từ người dùng
                                                        senderInfo = chatMembers[msg.senderId] || chatMembers[msg.senderAccountId] || {
                                                            fullName: msg.name,
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

                                                    const isVideoMessage = msg.type === "File" && msg.content && (
                                                        msg.content.toLowerCase().endsWith('.mp4') ||
                                                        msg.content.toLowerCase().endsWith('.webm') ||
                                                        msg.content.toLowerCase().endsWith('.mov') ||
                                                        msg.content.toLowerCase().endsWith('.avi')
                                                    );
                                                    // Kiểm tra tin nhắn tạm
                                                    const isTemp = msg.isTemp === true;

                                                    return (
                                                        <div
                                                            key={msg.id || msg.messageId}
                                                            className={`flex items-start space-x-3 ${isMe ? 'justify-end' : ''} ${isTemp ? 'opacity-90' : ''}`}
                                                        >
                                                            {!isMe && (
                                                                <img
                                                                    src={senderInfo?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                                                    alt={senderInfo?.fullName || 'User'}
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
                                                                            alt="Image"
                                                                            className="max-w-full object-contain cursor-pointer hover:opacity-90"
                                                                            onClick={() => openImagePreview(msg.content)}
                                                                        />
                                                                    </div>

                                                                    <div className={`text-xs mt-1 ml-1 ${isMe ? 'text-right text-gray-600' : 'text-gray-500'}`}>
                                                                        {getRelativeTime(msg.sentAt || msg.createdAt)}
                                                                    </div>
                                                                </div>
                                                            ) : isVideoMessage ? (
                                                                <div className="max-w-sm">
                                                                    {!isMe && (
                                                                        <div className="font-semibold text-sm mb-1 ml-1">
                                                                            {senderInfo?.fullName || msg.name || 'User'}
                                                                        </div>
                                                                    )}

                                                                    <div className="rounded-lg overflow-hidden shadow-sm">
                                                                        <video
                                                                            src={msg.content}
                                                                            controls
                                                                            className="w-full"
                                                                        >
                                                                            Video not supported
                                                                        </video>
                                                                    </div>

                                                                    <div className={`text-xs mt-1 ml-1 ${isMe ? 'text-right text-gray-600' : 'text-gray-500'}`}>
                                                                        {getRelativeTime(msg.sentAt || msg.createdAt)}
                                                                    </div>
                                                                </div>
                                                            ) : (
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
                                                                    {/* Không hiển thị content trực tiếp, mà dùng renderMessageContent */}
                                                                    {renderMessageContent(msg)}
                                                                    <div className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
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
                                                className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Type a message..."
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
                                                disabled={sendingMessage}
                                            >
                                                {sendingMessage ? (
                                                    <div className="flex items-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
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
                                                {attachments.map((file, index) => {
                                                    const isImage = file.type && file.type.startsWith('image/');
                                                    const isVideo = file.type && file.type.startsWith('video/');

                                                    return (
                                                        <div key={index} className="relative group">
                                                            {isImage ? (
                                                                <div className="relative">
                                                                    <img
                                                                        src={URL.createObjectURL(file)}
                                                                        alt={`Preview ${index + 1}`}
                                                                        className="w-20 h-20 object-cover rounded-lg shadow-md"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                                                        onClick={() => handleRemoveAttachment(index)}
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            ) : isVideo ? (
                                                                <div className="relative">
                                                                    <video
                                                                        src={URL.createObjectURL(file)}
                                                                        className="w-20 h-20 object-cover rounded-lg shadow-md"
                                                                        muted
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                                                        onClick={() => handleRemoveAttachment(index)}
                                                                    >
                                                                        ×
                                                                    </button>
                                                                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                                                                        <i className="fas fa-play"></i>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-gray-100 rounded-md p-2 flex items-center">
                                                                    <i className="fas fa-file mr-2 text-gray-500"></i>
                                                                    <span className="text-xs text-gray-700 truncate max-w-[100px]">{file.name}</span>
                                                                    <button
                                                                        type="button"
                                                                        className="ml-2 text-gray-500 hover:text-red-500"
                                                                        onClick={() => handleRemoveAttachment(index)}
                                                                    >
                                                                        <i className="fas fa-times"></i>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </>
                        ) : (
                            // Hiển thị khi chưa chọn cuộc trò chuyện
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <CircularProgress size={30} className="mb-4" />
                                <p className="text-lg font-medium">Redirecting to chat room...</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar phải: Danh bạ */}
                    {/* {showMembersSidebar && (
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
                    )} */}
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

            {/* Modal cuộc gọi video */}
            {isCallModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Header của modal cuộc gọi */}
                        <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                            <div className="text-white font-bold flex items-center">
                                <i className="fas fa-video mr-3"></i>

                                {/* Hiển thị avatar và tên */}
                                {isCallIncoming && callerInfo ? (
                                    <div className="flex items-center">
                                        <img
                                            src={callerInfo.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                            alt={callerInfo.name}
                                            className="w-8 h-8 rounded-full mr-3"
                                            onError={(e) => {
                                                e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                                            }}
                                        />
                                        <div>
                                            <div className="text-sm">{callerInfo.name} đang gọi cho bạn</div>
                                            <div className="text-xs text-gray-300">Cuộc gọi video</div>
                                        </div>
                                    </div>
                                ) : calleeInfo ? (
                                    <div className="flex items-center">
                                        <img
                                            src={calleeInfo.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                            alt={calleeInfo.name}
                                            className="w-8 h-8 rounded-full mr-3"
                                            onError={(e) => {
                                                e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                                            }}
                                        />
                                        <div>
                                            <div className="text-sm">
                                                {connectionEstablished
                                                    ? `Đang trong cuộc gọi với ${calleeInfo.name}`
                                                    : `Đang gọi ${calleeInfo.name}...`
                                                }
                                            </div>
                                            <div className="text-xs text-gray-300">Cuộc gọi video</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {isCallIncoming
                                            ? "Cuộc gọi đến"
                                            : isCallActive
                                                ? connectionEstablished
                                                    ? "Đang trong cuộc gọi"
                                                    : "Đang kết nối cuộc gọi..."
                                                : "Đang gọi..."
                                        }
                                    </div>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    className={`p-2 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-80`}
                                    title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                                    onClick={toggleVideo}
                                    disabled={!isCallActive}
                                >
                                    <i className={`fas ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
                                </button>
                                <button
                                    className={`p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-80`}
                                    title={isMuted ? "Turn on microphone" : "Turn off microphone"}
                                    onClick={toggleMute}
                                    disabled={!isCallActive}
                                >
                                    <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                                </button>
                                <button
                                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                                    title="End call"
                                    onClick={endCall}
                                >
                                    <i className="fas fa-phone-slash"></i>
                                </button>
                            </div>
                        </div>

                        {/* Nội dung modal cuộc gọi */}
                        <div className="flex-1 flex flex-col md:flex-row">
                            {/* Khu vực hiển thị video */}
                            <div className="flex-1 relative">
                                {/* Video người nhận */}
                                <div className="h-full bg-gray-800 flex items-center justify-center">
                                    {connectionEstablished ? (
                                        <video
                                            ref={remoteVideoRef}
                                            className="h-full w-full object-cover"
                                            autoPlay
                                            playsInline
                                        />
                                    ) : (
                                        <div className="text-center p-6">
                                            {/* Avatar người gọi/người nhận */}
                                            <div className="h-24 w-24 rounded-full mx-auto mb-4 overflow-hidden border-4 border-gray-600">
                                                {isCallIncoming && callerInfo?.avatarUrl ? (
                                                    <img
                                                        src={callerInfo.avatarUrl}
                                                        alt={callerInfo.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : calleeInfo?.avatarUrl ? (
                                                    <img
                                                        src={calleeInfo.avatarUrl}
                                                        alt={calleeInfo.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}

                                                {/* Fallback icon */}
                                                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                                    <i className="fas fa-user text-4xl text-gray-400"></i>
                                                </div>
                                            </div>

                                            {isCallIncoming ? (
                                                <div>
                                                    <h3 className="text-white text-xl font-medium">
                                                        {/* {callerInfo?.name || "Ai đó"} đang gọi cho bạn */}
                                                        Tien dz test cuoc goi den hihihi
                                                    </h3>
                                                    <div className="flex justify-center mt-6 space-x-4">
                                                        <button
                                                            className="px-6 py-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                                                            onClick={rejectCall}
                                                        >
                                                            <i className="fas fa-phone-slash mr-2"></i>
                                                            Từ chối
                                                        </button>
                                                        <button
                                                            className="px-6 py-2 bg-green-500 rounded-full text-white hover:bg-green-600"
                                                            onClick={() => {
                                                                answerCall();
                                                            }}
                                                        >
                                                            <i className="fas fa-phone mr-2"></i>
                                                            Trả lời
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : isCallActive ? (
                                                <div>
                                                    <h3 className="text-white text-xl font-medium mb-3">
                                                        {connectionEstablished
                                                            ? `Đang trong cuộc gọi với ${calleeInfo?.name || chatRooms.find(r => r.chatRoomId === selectedChatRoom)?.targetName || "..."}`
                                                            : `Đang kết nối với ${calleeInfo?.name || chatRooms.find(r => r.chatRoomId === selectedChatRoom)?.targetName || "..."}`
                                                        }
                                                    </h3>
                                                    {!connectionEstablished && (
                                                        <div className="flex items-center justify-center">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                                            <span className="ml-3 text-white">Đang kết nối...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <h3 className="text-white text-xl font-medium mb-3">
                                                        Đang gọi{" "}
                                                        {calleeInfo?.name || chatRooms.find(r => r.chatRoomId === selectedChatRoom)?.targetName || "..."}
                                                    </h3>
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-pulse">
                                                            <i className="fas fa-phone text-white text-2xl"></i>
                                                        </div>
                                                        <span className="ml-3 text-white">Đang gọi...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-4 right-4 w-1/4 aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
                                    <video
                                        ref={localVideoRef}
                                        className="h-full w-full object-cover"
                                        autoPlay
                                        muted
                                        playsInline
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 
