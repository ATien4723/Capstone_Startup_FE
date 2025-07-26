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

        setLoading(true);
        setError(null);

        try {
            const response = await chatService.getMessages(chatRoomId, page, pageSize);
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

            if (page === 1) {
                // Sắp xếp tin nhắn từ mới đến cũ để phù hợp với flex-col-reverse
                setMessages(normalizedMessages);
            } else {
                // Khi tải thêm tin nhắn cũ, thêm vào cuối mảng
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
            senderId: message.senderAccountId || message.senderId,
            content: message.content,
            sentAt: message.sentAt,
            isRead: message.isRead,
            type: messageType,
            name: message.name, // Thêm tên người gửi
            avatarUrl: message.avatarUrl // Thêm avatar người gửi
        };

        setMessages(prev => {
            // Loại bỏ các tin nhắn tạm thời
            const filtered = prev.filter(msg => !msg.isTemp);

            // Kiểm tra xem tin nhắn đã có trong danh sách chưa
            const exists = filtered.some(msg =>
            (msg.id == normalizedMessage.id ||
                (msg.content == normalizedMessage.content &&
                    msg.senderId == normalizedMessage.senderId &&
                    Math.abs(new Date(msg.sentAt) - new Date(normalizedMessage.sentAt)) < 5000))
            );

            if (!exists) {
                // Với flex-col-reverse, thêm tin nhắn mới vào đầu mảng
                // Không cần cuộn xuống vì tin nhắn mới sẽ tự hiển thị ở dưới cùng

                // Cập nhật thông tin tin nhắn mới nhất trong danh sách phòng chat
                updateChatRoomLatestMessage(normalizedMessage);

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
                content: messageContent,
                sentAt: new Date().toISOString(),
                isRead: false,
                type: typeMessage
            };

            // Cập nhật tin nhắn mới nhất trong phòng chat ngay lập tức
            updateChatRoomLatestMessage(tempMessage);

            await sendMessage(messageData);

            setSelectedFile(null);
            setAttachments([]);
        } catch (err) {
            console.error("Lỗi khi gửi tin nhắn:", err);
            toast.error('Gửi tin nhắn thất bại!');
        }
    };

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