import { useState, useCallback, useEffect, useRef } from 'react';
import * as chatService from '@/apis/chatService';
import { toast } from 'react-toastify';
import signalRService from '@/services/signalRService';
import { getAccountInfo } from '@/apis/accountService';

// Định nghĩa các loại tin nhắn
const MESSAGE_TYPES = {
    TEXT: 'Text',
    FILE: 'File',
    IMAGE: 'Image',
    VIDEO: 'Video'
};

export default function useMessage(currentUserId, initialChatRoomId = null) {
    // State quản lý phòng chat
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedChatRoom, setSelectedChatRoom] = useState(initialChatRoomId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State quản lý tin nhắn
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [messagePage, setMessagePage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);

    // State quản lý thành viên chat
    const [chatMembers, setChatMembers] = useState({});

    // Ref để theo dõi kết nối SignalR
    const signalRConnected = useRef(false);

    // Lấy danh sách phòng chat
    const fetchChatRooms = useCallback(async (shouldSelectFirst = true) => {
        if (!currentUserId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await chatService.getChatRoomsByAccount(currentUserId);
            const rooms = Array.isArray(response.items) ? response.items :
                Array.isArray(response) ? response : [];

            setChatRooms(rooms);

            // Tự động chọn phòng chat đầu tiên nếu chưa có phòng chat nào được chọn
            if (shouldSelectFirst && rooms.length > 0 && !selectedChatRoom) {
                setSelectedChatRoom(rooms[0].chatRoomId);
            }
        } catch (err) {
            setError(err);
            console.error('Lỗi khi lấy danh sách phòng chat:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId, selectedChatRoom]); // Phụ thuộc vào currentUserId và selectedChatRoom

    // Lấy tin nhắn của phòng chat
    const fetchMessages = useCallback(async (chatRoomId, page = 1, pageSize = 20) => {
        if (!chatRoomId) return Promise.resolve();

        // Lưu lại ID phòng chat hiện tại để kiểm tra sau khi API trả về
        const requestChatRoomId = chatRoomId;

        // Khi tải trang đầu tiên của phòng chat mới, làm sạch tin nhắn cũ trước
        if (page === 1) {
            // console.log(`Đặt tin nhắn về mảng rỗng cho phòng ${chatRoomId}`);
            setMessages([]);
        }

        setLoading(true);
        setError(null);

        try {
            // console.log(`Đang gọi API getMessages cho phòng ${chatRoomId}`);
            const response = await chatService.getMessages(chatRoomId, page, pageSize);

            // Kiểm tra xem phòng chat hiện tại có còn là phòng được yêu cầu không
            if (selectedChatRoom !== requestChatRoomId) {
                console.log(`Phòng chat đã thay đổi từ ${requestChatRoomId} sang ${selectedChatRoom}, bỏ qua kết quả`);
                return null;
            }

            const messageList = Array.isArray(response.items) ? response.items :
                Array.isArray(response) ? response : [];

            // Chuẩn hóa dữ liệu tin nhắn
            const normalizedMessages = messageList.map(msg => {
                // Xác định loại tin nhắn dựa trên nội dung
                let messageType = msg.type || MESSAGE_TYPES.TEXT;

                // Kiểm tra nội dung để xác định loại tin nhắn chính xác hơn
                if (msg.content) {
                    const contentLower = msg.content.toLowerCase();
                    if (contentLower.endsWith('.jpg') || contentLower.endsWith('.jpeg') ||
                        contentLower.endsWith('.png') || contentLower.endsWith('.gif') ||
                        contentLower.endsWith('.webp')) {
                        messageType = MESSAGE_TYPES.FILE;
                    }
                }

                return {
                    id: msg.messageId,
                    chatRoomId: msg.chatRoomId,
                    senderId: msg.senderAccountId,
                    content: msg.content,
                    sentAt: msg.sentAt,
                    isRead: msg.isRead,
                    type: messageType, // Sử dụng loại tin nhắn đã xác định
                    name: msg.name,
                    avatarUrl: msg.avatarUrl
                };
            });

            // Kiểm tra lại lần nữa trước khi cập nhật state
            if (selectedChatRoom !== requestChatRoomId) {
                console.log(`Phòng chat đã thay đổi (kiểm tra lần 2), bỏ qua kết quả`);
                return null;
            }

            if (page === 1) {
                // Sắp xếp tin nhắn từ mới đến cũ để phù hợp với flex-col-reverse
                setMessages(normalizedMessages);
                // console.log(`Đã cập nhật ${normalizedMessages.length} tin nhắn cho phòng ${requestChatRoomId}`);
            } else {
                // Khi tải thêm tin nhắn cũ, thêm vào cuối mảng
                setMessages(prev => [...prev, ...normalizedMessages]);
                // console.log(`Đã thêm ${normalizedMessages.length} tin nhắn cũ cho phòng ${requestChatRoomId}`);
            }

            // Kiểm tra xem còn tin nhắn để tải không
            setHasMoreMessages(messageList.length === pageSize && response.hasNextPage);

            // Cập nhật thông tin người gửi từ response
            updateChatMembersFromMessages(messageList);

            return response;
        } catch (err) {
            if (selectedChatRoom === requestChatRoomId) { // Chỉ hiển thị lỗi nếu vẫn là phòng đang xem
                setError(err);
                console.error(`Lỗi khi lấy tin nhắn cho phòng ${chatRoomId}:`, err);
            }
            return Promise.reject(err);
        } finally {
            if (selectedChatRoom === requestChatRoomId) { // Chỉ cập nhật loading nếu vẫn là phòng đang xem
                setLoading(false);
            }
        }
    }, [selectedChatRoom]);

    // Cập nhật thông tin người gửi từ response tin nhắn
    const updateChatMembersFromMessages = (messageList) => {
        if (!messageList || messageList.length === 0) return;

        const updatedMembers = { ...chatMembers };

        messageList.forEach(msg => {
            if (msg.senderAccountId && msg.name) {
                updatedMembers[msg.senderAccountId] = {
                    id: msg.senderAccountId,
                    fullName: msg.name,
                    avatar: msg.avatarUrl
                };
            }
        });

        setChatMembers(updatedMembers);
    };

    // Lấy thông tin người gửi tin nhắn - Phiên bản cũ (giữ lại để tương thích)
    const fetchChatMembersInfo = async (messageList) => {
        const uniqueSenderIds = [...new Set(messageList.map(msg => msg.senderId))];

        // Lọc ra các ID chưa có trong state
        const newSenderIds = uniqueSenderIds.filter(id => !chatMembers[id]);

        if (newSenderIds.length === 0) return;

        try {
            // Sử dụng fetchCurrentUserInfo để lấy thông tin người dùng
            await Promise.all(newSenderIds.map(id => fetchCurrentUserInfo(id)));
        } catch (err) {
            console.error('Lỗi khi lấy thông tin người dùng:', err);
        }
    };

    // Tạo phòng chat mới
    const ensureChatRoom = async (targetAccountId, targetStartupId) => {
        setLoading(true);
        setError(null);

        try {

            const response = await chatService.ensureRoom(currentUserId, targetAccountId, targetStartupId);

            // Làm mới danh sách phòng chat
            await fetchChatRooms();

            // Chọn phòng chat mới tạo
            if (response && response.chatRoomId) {
                setSelectedChatRoom(response.chatRoomId);
            }

            return response;
        } catch (err) {
            setError(err);
            console.error('Lỗi khi tạo phòng chat:', err);
            toast.error('Không thể tạo phòng chat. Vui lòng thử lại sau!');
        } finally {
            setLoading(false);
        }
    };

    // Gửi tin nhắn
    const sendMessage = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const res = await chatService.sendMessage(data);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Kết nối SignalR cho tất cả phòng chat
    const connectToSignalR = useCallback(async () => {
        if (chatRooms.length === 0) return;

        try {
            // Lấy danh sách ID của tất cả phòng chat
            const roomIds = chatRooms.map(room => room.chatRoomId);

            // Kết nối với tất cả các phòng chat
            await signalRService.initChatConnection(roomIds, (message) => {
                // Gọi handleNewMessage ở đây để tránh vòng lặp dependency
                handleNewMessage(message);
            });
            signalRConnected.current = true;
            // console.log('Đã kết nối SignalR cho tất cả phòng chat:', roomIds);
        } catch (err) {
            console.error('Lỗi kết nối SignalR:', err);
        }
    }, [chatRooms]);

    // Ngắt kết nối SignalR
    const disconnectSignalR = useCallback(async () => {
        if (signalRConnected.current) {
            await signalRService.disconnectChat();
            signalRConnected.current = false;
            console.log('Đã ngắt kết nối SignalR');
        }
    }, []);

    // Xử lý khi nhận tin nhắn mới từ SignalR
    const handleNewMessage = useCallback((message) => {
        if (!message) return;

        console.log("Nhận tin nhắn mới từ SignalR:", message);


        // Xác định loại tin nhắn dựa trên nội dung
        let messageType = message.type || MESSAGE_TYPES.TEXT;

        // Kiểm tra nội dung để xác định loại tin nhắn chính xác hơn
        if (message.content) {
            const contentLower = message.content.toLowerCase();
            if (contentLower.endsWith('.jpg') || contentLower.endsWith('.jpeg') ||
                contentLower.endsWith('.png') || contentLower.endsWith('.gif') ||
                contentLower.endsWith('.webp')) {
                messageType = MESSAGE_TYPES.FILE;  // Đánh dấu là file để hiển thị đúng
            }
        }

        // Chuẩn hóa dữ liệu tin nhắn từ SignalR nếu cần
        const normalizedMessage = {
            id: message.messageId || message.id,
            chatRoomId: message.chatRoomId,
            senderId: message.senderAccountId,
            content: message.content,
            sentAt: message.sentAt,
            isRead: message.isRead,
            type: messageType,
            name: message.name, // Thêm tên người gửi
            avatarUrl: message.avatarUrl // Thêm avatar người gửi
        };

        // Cập nhật thông tin tin nhắn mới nhất trong danh sách phòng chat (cho tất cả phòng)
        updateChatRoomLatestMessage(normalizedMessage);

        // Chỉ cập nhật danh sách tin nhắn nếu tin nhắn thuộc phòng chat đang xem
        if (message.chatRoomId === selectedChatRoom) {
            setMessages(prev => {
                // Loại bỏ các tin nhắn tạm thời có nội dung giống tin nhắn thật từ server
                const filtered = prev.filter(msg =>
                    !(msg.isTemp && msg.content === normalizedMessage.content &&
                        msg.senderId == normalizedMessage.senderId)
                );

                // Kiểm tra xem tin nhắn đã có trong danh sách chưa (trừ các tin nhắn tạm)
                const exists = filtered.some(msg =>
                    (!msg.isTemp && msg.id == normalizedMessage.id) ||
                    (!msg.isTemp && msg.content == normalizedMessage.content &&
                        msg.senderId == normalizedMessage.senderId &&
                        Math.abs(new Date(msg.sentAt) - new Date(normalizedMessage.sentAt)) < 5000)
                );

                if (!exists) {
                    // Thêm tin nhắn mới vào đầu mảng (flex-col-reverse)
                    return [normalizedMessage, ...filtered];
                }
                return filtered; // Trả về danh sách đã lọc bỏ tin nhắn tạm
            });

            // Cuộn xuống để hiển thị tin nhắn mới
            scrollToBottom();
        }

        console.log("🔍 Tin nhắn nhận được:", normalizedMessage);


        // Cập nhật thông tin người gửi vào chatMembers
        if (normalizedMessage.name && normalizedMessage.senderId) {
            setChatMembers(prev => ({
                ...prev,
                [normalizedMessage.senderId]: {
                    id: normalizedMessage.senderId,
                    fullName: normalizedMessage.name,
                    avatar: normalizedMessage.avatarUrl
                }
            }));
        }
        // Lấy thông tin người gửi nếu chưa có và không có trong response
        else if (normalizedMessage.senderId && !chatMembers[normalizedMessage.senderId]) {
            fetchChatMembersInfo([normalizedMessage]);
        }
    }, [selectedChatRoom, chatMembers]);

    // Xử lý tải thêm tin nhắn khi cuộn lên
    const loadMoreMessages = () => {
        if (loading || !hasMoreMessages) return Promise.resolve();

        const nextPage = messagePage + 1;
        setMessagePage(nextPage);
        return fetchMessages(selectedChatRoom, nextPage);
    };

    // Cuộn xuống cuối cùng khi có tin nhắn mới
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (window.messagesEndRef && window.messagesEndRef.current) {
                window.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }, []);

    // Cập nhật thông tin tin nhắn mới nhất của phòng chat
    const updateChatRoomLatestMessage = (message) => {
        if (!message || !message.chatRoomId) return;

        setChatRooms(prev => {
            return prev.map(room => {
                if (room.chatRoomId === message.chatRoomId) {
                    // Xác định nội dung hiển thị cho tin nhắn mới nhất
                    let displayContent = message.content;

                    // Nếu là hình ảnh, hiển thị "🖼️ Hình ảnh" thay vì URL
                    if (message.type === MESSAGE_TYPES.FILE && message.content) {
                        const contentLower = message.content.toLowerCase();
                        if (contentLower.endsWith('.jpg') || contentLower.endsWith('.jpeg') ||
                            contentLower.endsWith('.png') || contentLower.endsWith('.gif') ||
                            contentLower.endsWith('.webp')) {
                            displayContent = '🖼️ Hình ảnh';
                        } else if (contentLower.endsWith('.mp4') || contentLower.endsWith('.webm') ||
                            contentLower.endsWith('.mov') || contentLower.endsWith('.avi')) {
                            displayContent = '🎬 Video';
                        } else {
                            displayContent = '📎 Tệp đính kèm';
                        }
                    }

                    // Cập nhật thông tin tin nhắn mới nhất
                    return {
                        ...room,
                        latestMessageContent: displayContent,
                        latestMessageTime: message.sentAt
                    };
                }
                return room;
            });
        });
    };

    // Xử lý gửi tin nhắn
    const sendNewMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() && !selectedFile && attachments.length === 0) return;

        try {
            const messageContent = messageInput;
            setMessageInput('');

            // Xác định loại tin nhắn dựa vào file được chọn
            let typeMessage = MESSAGE_TYPES.TEXT;
            if (selectedFile) {
                typeMessage = MESSAGE_TYPES.FILE;  // Tất cả các loại file đều là FILE
            }

            // Chuẩn bị dữ liệu tin nhắn để gửi
            const messageData = {
                content: messageContent,
                chatRoomId: selectedChatRoom,
                senderAccountId: currentUserId,
                type: typeMessage,
                file: selectedFile,
                attachments: attachments
            };

            // Tạo một đối tượng tin nhắn tạm thời để cập nhật UI ngay lập tức
            const tempMessage = {
                id: `temp-${Date.now()}`,
                chatRoomId: selectedChatRoom,
                senderId: currentUserId,
                senderAccountId: currentUserId, // Thêm trường này để đảm bảo đúng với format
                content: messageContent,
                sentAt: new Date().toISOString(),
                isRead: false,
                isTemp: true, // Đánh dấu là tin nhắn tạm thời
                type: typeMessage
            };

            // Cập nhật tin nhắn mới nhất trong phòng chat ngay lập tức
            updateChatRoomLatestMessage(tempMessage);

            // Hiển thị tin nhắn tạm thời ngay lập tức trên UI
            setMessages(prevMessages => [tempMessage, ...prevMessages]);

            console.log("Đang gửi tin nhắn:", messageContent);

            // Gửi tin nhắn tới server
            const response = await sendMessage(messageData);
            console.log("Gửi tin nhắn thành công:", response);

            // Xóa các file đính kèm sau khi gửi
            setSelectedFile(null);
            setAttachments([]);

            // Cuộn xuống để hiển thị tin nhắn mới
            scrollToBottom();
        } catch (err) {
            console.error("Lỗi khi gửi tin nhắn:", err);
            toast.error('Gửi tin nhắn thất bại!');
        }
    };

    // Xử lý khi thay đổi phòng chat
    useEffect(() => {
        if (selectedChatRoom) {
            // Chỉ tải tin nhắn của phòng được chọn, không cần kết nối SignalR lại
            // console.log(`Tải tin nhắn cho phòng chat ${selectedChatRoom}`);
            setMessagePage(1);
            // Gọi API để lấy tin nhắn
            fetchMessages(selectedChatRoom, 1);
        }
    }, [selectedChatRoom]);

    // Lấy danh sách phòng chat khi component mount
    useEffect(() => {
        if (currentUserId) {
            fetchChatRooms();
        }

        // Cleanup khi unmount
        return () => {
            disconnectSignalR();
        };
    }, [currentUserId]);

    // Kết nối SignalR sau khi có danh sách phòng chat
    useEffect(() => {
        if (chatRooms.length > 0) {
            // Kết nối SignalR một lần sau khi có danh sách phòng chat
            connectToSignalR();
        }
    }, [chatRooms.length, connectToSignalR]);

    // Xử lý thêm file đính kèm
    const handleAddAttachment = (files) => {
        if (files && files.length > 0) {
            setSelectedFile(files[0]); // Lưu file đầu tiên vào selectedFile
            setAttachments(prev => [...prev, ...Array.from(files)]); // Lưu tất cả các file vào attachments
        }
    };

    // Xử lý xóa file đính kèm
    const handleRemoveAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return {
        // State
        chatRooms,
        selectedChatRoom,
        loading,
        error,
        messages,
        messageInput,
        attachments,
        chatMembers,
        hasMoreMessages,
        selectedFile,

        // Setters
        setSelectedChatRoom,
        setMessageInput,
        setSelectedFile,
        setMessages,

        // Actions
        fetchChatRooms,
        fetchMessages,
        ensureChatRoom,
        sendNewMessage,
        loadMoreMessages,
        handleAddAttachment,
        handleRemoveAttachment
    };
} 