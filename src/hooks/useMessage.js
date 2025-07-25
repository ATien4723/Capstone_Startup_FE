import { useState, useCallback, useEffect, useRef } from 'react';
import * as chatService from '@/apis/chatService';
import { toast } from 'react-toastify';
import signalRService from '@/services/signalRService';
import { getAccountInfo } from '@/apis/accountService';

// Hằng số cho các loại tin nhắn
const MESSAGE_TYPES = {
    TEXT: "Text",
    LINK: "Link",
    FILE: "File"
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
    const fetchMessages = useCallback(async (chatRoomId, page = 1, pageSize = 10) => {
        if (!chatRoomId) return Promise.resolve();

        setLoading(true);
        setError(null);

        try {
            const response = await chatService.getMessages(chatRoomId, page, pageSize);
            const messageList = Array.isArray(response.items) ? response.items :
                Array.isArray(response) ? response : [];

            // Chuẩn hóa dữ liệu tin nhắn
            const normalizedMessages = messageList.map(msg => ({
                id: msg.messageId,
                chatRoomId: msg.chatRoomId,
                senderId: msg.senderAccountId,
                content: msg.content,
                sentAt: msg.sentAt,
                isRead: msg.isRead,
                type: msg.type || MESSAGE_TYPES.TEXT, // Thêm loại tin nhắn, mặc định là TEXT
                name: msg.name,
                avatarUrl: msg.avatarUrl
            }));

            if (page === 1) {
                setMessages(normalizedMessages);
            } else {
                setMessages(prev => [...prev, ...normalizedMessages]);
            }

            // Kiểm tra xem còn tin nhắn để tải không
            setHasMoreMessages(messageList.length === pageSize && response.hasNextPage);

            // Cập nhật thông tin người gửi từ response
            updateChatMembersFromMessages(messageList);

            return response;
        } catch (err) {
            setError(err);
            console.error('Lỗi khi lấy tin nhắn:', err);
            return Promise.reject(err);
        } finally {
            setLoading(false);
        }
    }, []);

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

    // Lấy thông tin người gửi tin nhắn
    const fetchChatMembersInfo = async (messageList) => {
        const uniqueSenderIds = [...new Set(messageList.map(msg => msg.senderId))];

        // Lọc ra các ID chưa có trong state
        const newSenderIds = uniqueSenderIds.filter(id => !chatMembers[id]);

        if (newSenderIds.length === 0) return;

        try {
            const memberInfoPromises = newSenderIds.map(id => getAccountInfo(id));
            const memberInfos = await Promise.all(memberInfoPromises);

            setChatMembers(prev => {
                const updated = { ...prev };
                newSenderIds.forEach((id, index) => {
                    updated[id] = memberInfos[index];
                });
                return updated;
            });
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

    // Gửi tin nhắn mới
    const sendNewMessage = async (content) => {
        if (!selectedChatRoom || (!content.trim() && attachments.length === 0)) return;

        // Xác định loại tin nhắn
        let messageType = MESSAGE_TYPES.TEXT;
        let messageContent = content;

        // Kiểm tra nếu là link
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        if (urlRegex.test(content)) {
            messageType = MESSAGE_TYPES.LINK;
        }

        // Nếu có file đính kèm thì là loại FILE
        if (attachments.length > 0) {
            messageType = MESSAGE_TYPES.FILE;
            // Khi gửi file, không gửi kèm nội dung văn bản
            messageContent = "";
        }

        // Reset input trước khi gửi
        setMessageInput('');

        // Chỉ tạo tin nhắn tạm thời nếu không phải loại FILE
        // Vì tin nhắn FILE cần URL từ server sau khi upload
        if (messageType !== MESSAGE_TYPES.FILE) {
            // Tạo tin nhắn tạm thời để hiển thị ngay lập tức
            const tempMessage = {
                id: `temp-${Date.now()}`,
                chatRoomId: selectedChatRoom,
                senderId: currentUserId,
                content: messageContent,
                sentAt: new Date().toISOString(),
                isTemp: true, // Đánh dấu là tin nhắn tạm thời
                type: messageType // Thêm loại tin nhắn
            };

            // Thêm tin nhắn tạm thời vào đầu danh sách
            setMessages(prev => [tempMessage, ...prev]);

            // Cuộn xuống cuối cùng
            setTimeout(() => {
                if (window.messagesEndRef && window.messagesEndRef.current) {
                    window.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        } else {
            // Hiển thị loading khi đang upload file
            setLoading(true);
        }

        try {
            // Chuẩn bị FormData
            const formData = new FormData();
            formData.append('ChatRoomId', selectedChatRoom);
            formData.append('SenderAccountId', currentUserId);

            // SenderStartupId có thể null
            if (window.currentStartupId) {
                formData.append('SenderStartupId', window.currentStartupId);
            }

            // Nếu là loại File, chỉ gửi file mà không gửi nội dung văn bản
            if (messageType !== MESSAGE_TYPES.FILE) {
                formData.append('Content', messageContent);
            }

            formData.append('Type', messageType); // Thêm loại tin nhắn

            // Thêm file đính kèm
            if (attachments.length > 0) {
                attachments.forEach(file => {
                    formData.append('File', file);
                });
            }

            // Gửi tin nhắn
            await chatService.sendMessage(formData);

            // Reset attachments
            setAttachments([]);

            // Tắt loading nếu đang upload file
            if (messageType === MESSAGE_TYPES.FILE) {
                setLoading(false);
            }
        } catch (err) {
            console.error('Lỗi khi gửi tin nhắn:', err);
            toast.error('Không thể gửi tin nhắn. Vui lòng thử lại sau!');
            setLoading(false);

            // Xóa tin nhắn tạm thời nếu gửi thất bại và không phải loại FILE
            if (messageType !== MESSAGE_TYPES.FILE) {
                setMessages(prev => prev.filter(msg => !msg.isTemp));
            }
        }
    };

    // Kết nối SignalR cho chat
    const connectToSignalR = useCallback(async () => {
        if (!selectedChatRoom) return;

        try {
            await signalRService.initChatConnection(selectedChatRoom, handleNewMessage);
            signalRConnected.current = true;
            console.log('Đã kết nối SignalR cho phòng chat:', selectedChatRoom);
        } catch (err) {
            console.error('Lỗi kết nối SignalR:', err);
        }
    }, [selectedChatRoom]);

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
        if (!message || message.chatRoomId !== selectedChatRoom) return;

        // Chuẩn hóa dữ liệu tin nhắn từ SignalR nếu cần
        const normalizedMessage = {
            id: message.messageId || message.id,
            chatRoomId: message.chatRoomId,
            senderId: message.senderAccountId || message.senderId,
            content: message.content,
            sentAt: message.sentAt,
            isRead: message.isRead,
            type: message.type || MESSAGE_TYPES.TEXT, // Thêm loại tin nhắn, mặc định là TEXT
            name: message.name, // Thêm tên người gửi
            avatarUrl: message.avatarUrl // Thêm avatar người gửi
        };

        setMessages(prev => {
            // Loại bỏ các tin nhắn tạm thời
            const filtered = prev.filter(msg => !msg.isTemp);

            // Kiểm tra xem tin nhắn đã có trong danh sách chưa
            const exists = filtered.some(msg =>
            (msg.id == normalizedMessage.messageId ||
                (msg.content == normalizedMessage.content &&
                    msg.senderId == normalizedMessage.senderId &&
                    Math.abs(new Date(msg.sentAt) - new Date(normalizedMessage.sentAt)) < 5000))
            );

            if (!exists) {
                // Thêm tin nhắn mới và cuộn xuống cuối cùng
                setTimeout(() => {
                    if (window.messagesEndRef && window.messagesEndRef.current) {
                        window.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);

                return [normalizedMessage, ...filtered];
            }
            return filtered;
        });

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

    // Xử lý khi thay đổi phòng chat
    useEffect(() => {
        if (selectedChatRoom) {
            // Lấy tin nhắn và kết nối SignalR
            setMessagePage(1);
            fetchMessages(selectedChatRoom, 1);
            connectToSignalR();
        }

        // Cleanup khi unmount hoặc thay đổi phòng chat
        return () => {
            disconnectSignalR();
        };
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

    // Xử lý tải thêm tin nhắn khi cuộn lên
    const loadMoreMessages = () => {
        if (loading || !hasMoreMessages) return Promise.resolve();

        const nextPage = messagePage + 1;
        setMessagePage(nextPage);
        return fetchMessages(selectedChatRoom, nextPage);
    };

    // Cuộn xuống cuối cùng khi có tin nhắn mới
    const scrollToBottom = () => {
        setTimeout(() => {
            if (window.messagesEndRef && window.messagesEndRef.current) {
                window.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    // Xử lý thêm file đính kèm
    const handleAddAttachment = (files) => {
        setAttachments(prev => [...prev, ...files]);
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

        // Setters
        setSelectedChatRoom,
        setMessageInput,

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