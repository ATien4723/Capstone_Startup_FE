import { useState, useCallback, useEffect, useRef } from 'react';
import * as chatService from '@/apis/chatService';
import { toast } from 'react-toastify';
import signalRService from '@/services/signalRService';
import { getAccountInfo } from '@/apis/accountService';
import * as startupService from '@/apis/startupService';

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
    const chatRoomsRef = useRef([]); // Thêm ref để theo dõi chatRooms mà không gây re-render
    const chatMembersRef = useRef({}); // Ref để lưu chatMembers

    // Debug: Log khi chatMembers thay đổi
    useEffect(() => {
        // console.log("ChatMembers đã được cập nhật:", chatMembers);
        chatMembersRef.current = chatMembers; // Cập nhật ref
    }, [chatMembers]);

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
                    senderAccountId: msg.senderAccountId, // Thêm trường này để đảm bảo tính nhất quán
                    senderStartupId: msg.senderStartupId,
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

            // Lấy thông tin người gửi cho các tin nhắn trong trường hợp không có đủ thông tin
            const sendersWithoutInfo = messageList.filter(msg =>
                msg.senderAccountId && (!msg.name || !msg.avatarUrl) && !chatMembers[msg.senderAccountId]
            );
            const uniqueSenderIds = [...new Set(sendersWithoutInfo.map(msg => msg.senderAccountId))];

            // Lấy thông tin người gửi nếu cần
            if (uniqueSenderIds.length > 0) {
                try {
                    await Promise.all(uniqueSenderIds.map(id => fetchCurrentUserInfo(id)));
                } catch (err) {
                    console.error('Lỗi khi lấy thông tin người gửi:', err);
                }
            }

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

        setChatMembers(prev => {
            const updatedMembers = { ...prev };

            messageList.forEach(msg => {
                // console.log("Xử lý tin nhắn:", {
                //     senderAccountId: msg.senderAccountId,
                //     name: msg.name,
                //     avatarUrl: msg.avatarUrl
                // });

                if (msg.senderAccountId && msg.name) {
                    // Trường hợp tin nhắn từ user
                    updatedMembers[msg.senderAccountId] = {
                        id: msg.senderAccountId,
                        fullName: msg.name,
                        avatar: msg.avatarUrl
                    };
                    // console.log("Đã thêm user vào chatMembers:", updatedMembers[msg.senderAccountId]);
                } else if (msg.senderStartupId && msg.name) {
                    // Trường hợp tin nhắn từ startup
                    updatedMembers[`startup_${msg.senderStartupId}`] = {
                        id: `startup_${msg.senderStartupId}`,
                        fullName: msg.name,
                        avatar: msg.avatarUrl,
                        isStartup: true,
                        startupId: msg.senderStartupId
                    };
                    // console.log("Đã thêm startup vào chatMembers:", updatedMembers[`startup_${msg.senderStartupId}`]);
                } else {
                    // console.log("Không thêm vào chatMembers vì thiếu thông tin:", {
                    //     senderAccountId: msg.senderAccountId,
                    //     senderStartupId: msg.senderStartupId,
                    //     name: msg.name
                    // });
                }
            });

            // console.log("UpdatedMembers trước khi return:", updatedMembers);
            return updatedMembers;
        });
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

    // Lấy thông tin người dùng từ API
    const fetchCurrentUserInfo = async (userId) => {
        try {
            const userInfo = await getAccountInfo(userId);
            if (userInfo) {
                // Tạo fullName từ firstName và lastName
                const fullName = userInfo.fullName ||
                    (userInfo.firstName && userInfo.lastName ?
                        `${userInfo.firstName} ${userInfo.lastName}` :
                        userInfo.firstName || userInfo.lastName || userInfo.name || 'User');

                // Cập nhật thông tin vào state chatMembers
                setChatMembers(prev => ({
                    ...prev,
                    [userId]: {
                        id: userId,
                        fullName: fullName,
                        avatar: userInfo.avatar || userInfo.avatarUrl
                    }
                }));

                // Trả về userInfo với fullName đã được tạo
                return {
                    ...userInfo,
                    fullName: fullName
                };
            }
        } catch (err) {
            console.error(`Lỗi khi lấy thông tin người dùng ${userId}:`, err);
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
        if (signalRConnected.current) return; // Không kết nối lại nếu đã kết nối

        try {
            // Lấy danh sách ID của tất cả phòng chat
            const roomIds = chatRooms.map(room => room.chatRoomId);
            chatRoomsRef.current = roomIds; // Lưu danh sách phòng hiện tại

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
        console.log("ChatMembers hiện tại:", chatMembers);


        // Xác định loại tin nhắn dựa trên nội dung
        let messageType = message.type || MESSAGE_TYPES.TEXT;

        // Kiểm tra nội dung để xác định loại tin nhắn chính xác hơn
        if (message.content) {
            const contentLower = message.content.toLowerCase();
            if (contentLower.endsWith('.jpg') || contentLower.endsWith('.jpeg') ||
                contentLower.endsWith('.png') || contentLower.endsWith('.gif') ||
                contentLower.endsWith('.webp')) {
                messageType = MESSAGE_TYPES.FILE;  // Đánh dấu là file để hiển thị đúng
            } else if (contentLower.endsWith('.mp4') || contentLower.endsWith('.webm') ||
                contentLower.endsWith('.mov') || contentLower.endsWith('.avi') ||
                contentLower.endsWith('.mkv')) {
                messageType = MESSAGE_TYPES.FILE;  // Đánh dấu video cũng là file để hiển thị đúng
            }
        }

        // Lấy thông tin người gửi từ chatMembers nếu có
        let senderName = message.name;
        let senderAvatar = message.avatarUrl;

        // console.log("Thông tin ban đầu - senderName:", senderName, "senderAvatar:", senderAvatar);
        // console.log("SenderAccountId:", message.senderAccountId);
        // console.log("ChatMember cho user này:", chatMembersRef.current[message.senderAccountId]);

        if (message.senderAccountId && chatMembersRef.current[message.senderAccountId]) {
            const memberInfo = chatMembersRef.current[message.senderAccountId];
            senderName = senderName || memberInfo.fullName;
            senderAvatar = senderAvatar || memberInfo.avatar;
            console.log("Sau khi lấy từ chatMembers - senderName:", senderName, "senderAvatar:", senderAvatar);
        }


        // Chuẩn hóa dữ liệu tin nhắn từ SignalR nếu cần
        const normalizedMessage = {
            id: message.messageId || message.id,
            chatRoomId: message.chatRoomId,
            senderId: message.senderAccountId,
            senderAccountId: message.senderAccountId, // Thêm trường này để đảm bảo tính nhất quán
            senderStartupId: message.senderStartupId,
            content: message.content,
            sentAt: message.sentAt,
            isRead: message.isRead,
            type: messageType,
            name: senderName, // Tên người gửi (ưu tiên từ chatMembers)
            avatarUrl: senderAvatar // Avatar người gửi (ưu tiên từ chatMembers)
        };



        // Cập nhật thông tin tin nhắn mới nhất trong danh sách phòng chat (cho tất cả phòng)
        updateChatRoomLatestMessage(normalizedMessage);

        // Chỉ cập nhật danh sách tin nhắn nếu tin nhắn thuộc phòng chat đang xem
        if (message.chatRoomId === selectedChatRoom) {
            setMessages(prev => {
                // Loại bỏ các tin nhắn tạm thời có nội dung giống tin nhắn thật từ server
                const filtered = prev.filter(msg =>
                    !(msg.isTemp && msg.content === normalizedMessage.content &&
                        ((msg.senderId == normalizedMessage.senderId) ||
                            (msg.senderStartupId == normalizedMessage.senderStartupId)))
                );

                // Kiểm tra xem tin nhắn đã có trong danh sách chưa (trừ các tin nhắn tạm)
                const exists = filtered.some(msg =>
                    (!msg.isTemp && msg.id == normalizedMessage.id) ||
                    (!msg.isTemp && msg.content == normalizedMessage.content &&
                        ((msg.senderId == normalizedMessage.senderId) ||
                            (msg.senderStartupId == normalizedMessage.senderStartupId)) &&
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

        // Xử lý thông tin người gửi
        if (normalizedMessage.senderId) {
            // Trường hợp người gửi là account
            if (normalizedMessage.name && normalizedMessage.senderId) {
                // Cập nhật thông tin người gửi vào chatMembers
                setChatMembers(prev => ({
                    ...prev,
                    [normalizedMessage.senderId]: {
                        id: normalizedMessage.senderId,
                        fullName: normalizedMessage.name,
                        avatar: normalizedMessage.avatarUrl
                    }
                }));
            } else if (normalizedMessage.senderId) {
                // Trường hợp không có tên hoặc avatar, lấy thông tin người dùng từ API
                // Trường hợp không có tên, lấy thông tin người dùng từ API
                const getUserInfo = async () => {
                    try {
                        const userInfo = await fetchCurrentUserInfo(normalizedMessage.senderId);

                        // Sau khi có thông tin người dùng, cập nhật tên và avatar cho tin nhắn
                        if (userInfo) {
                            setMessages(prev => prev.map(msg => {
                                if (msg.id === normalizedMessage.id ||
                                    (msg.senderId == normalizedMessage.senderId &&
                                        msg.content === normalizedMessage.content)) {
                                    return {
                                        ...msg,
                                        name: userInfo.fullName,
                                        avatarUrl: userInfo.avatar || userInfo.avatarUrl
                                    };
                                }
                                return msg;
                            }));
                        }
                    } catch (err) {
                        console.error(`Lỗi khi lấy thông tin người dùng ${normalizedMessage.senderId}:`, err);
                    }
                };

                // Kiểm tra xem đã có thông tin người dùng này trong chatMembers chưa
                if (!chatMembersRef.current[normalizedMessage.senderId] || !normalizedMessage.name) {
                    getUserInfo();
                } else {
                    // Nếu đã có thông tin trong chatMembers, sử dụng thông tin có sẵn để cập nhật tin nhắn
                    const existingUser = chatMembersRef.current[normalizedMessage.senderId];
                    if (existingUser && existingUser.fullName) {
                        setMessages(prev => prev.map(msg => {
                            if (msg.id === normalizedMessage.id ||
                                (msg.senderId == normalizedMessage.senderId &&
                                    msg.content === normalizedMessage.content)) {
                                return {
                                    ...msg,
                                    name: existingUser.fullName,
                                    avatarUrl: existingUser.avatar
                                };
                            }
                            return msg;
                        }));
                    } else {
                        // Nếu thông tin trong chatMembers không đầy đủ, lấy lại từ API
                        getUserInfo();
                    }
                }
            }
        } else if (normalizedMessage.senderStartupId) {
            // Trường hợp người gửi là startup - lấy thông tin startup
            const fetchStartupInfo = async () => {
                try {
                    const startupId = normalizedMessage.senderStartupId;
                    const response = await startupService.getStartupById(startupId);
                    const startupInfo = response?.data;

                    if (startupInfo) {
                        // Cập nhật thông tin startup vào chatMembers
                        setChatMembers(prev => ({
                            ...prev,
                            [`startup_${startupId}`]: {
                                id: `startup_${startupId}`,
                                fullName: startupInfo.startupName || startupInfo.name,
                                avatar: startupInfo.logo || startupInfo.avatarUrl,
                                isStartup: true,
                                startupId: startupId
                            }
                        }));

                        // Cập nhật tên và avatar cho tin nhắn nếu chưa có
                        if (!normalizedMessage.name || !normalizedMessage.avatarUrl) {
                            setMessages(prev => prev.map(msg => {
                                if (msg.id === normalizedMessage.id ||
                                    (msg.senderStartupId === startupId &&
                                        msg.content === normalizedMessage.content)) {
                                    return {
                                        ...msg,
                                        name: startupInfo.startupName || startupInfo.name,
                                        avatarUrl: startupInfo.logo || startupInfo.avatarUrl
                                    };
                                }
                                return msg;
                            }));
                        }
                    }
                } catch (err) {
                    console.error(`Lỗi khi lấy thông tin startup ${normalizedMessage.senderStartupId}:`, err);
                }
            };

            // Kiểm tra xem đã có thông tin của startup này chưa
            if (!chatMembersRef.current[`startup_${normalizedMessage.senderStartupId}`]) {
                fetchStartupInfo();
            }
        }
    }, [selectedChatRoom]);

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

            // Lấy thông tin người gửi từ chatMembers hoặc từ API
            let currentUserInfo = chatMembers[currentUserId];
            if (!currentUserInfo) {
                try {
                    currentUserInfo = await fetchCurrentUserInfo(currentUserId);
                } catch (err) {
                    console.error('Lỗi khi lấy thông tin người gửi hiện tại:', err);
                }
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
                type: typeMessage,
                // Thêm thông tin người gửi từ thông tin người dùng hiện tại
                name: currentUserInfo?.fullName,
                avatarUrl: currentUserInfo?.avatar
            };

            // Chỉ hiển thị tin nhắn tạm trên UI nếu không phải là file hình ảnh hoặc video
            // Vì tin nhắn hình ảnh/video cần đợi upload xong mới có URL đúng
            if (!(typeMessage === MESSAGE_TYPES.FILE && selectedFile &&
                (selectedFile.type.includes('image/') ||
                    selectedFile.type.includes('video/') ||
                    (messageContent && (
                        // Định dạng hình ảnh
                        messageContent.toLowerCase().endsWith('.jpg') ||
                        messageContent.toLowerCase().endsWith('.jpeg') ||
                        messageContent.toLowerCase().endsWith('.png') ||
                        messageContent.toLowerCase().endsWith('.gif') ||
                        messageContent.toLowerCase().endsWith('.webp') ||
                        // Định dạng video
                        messageContent.toLowerCase().endsWith('.mp4') ||
                        messageContent.toLowerCase().endsWith('.mov') ||
                        messageContent.toLowerCase().endsWith('.avi') ||
                        messageContent.toLowerCase().endsWith('.webm') ||
                        messageContent.toLowerCase().endsWith('.mkv')
                    ))))) {

                // Cập nhật tin nhắn mới nhất trong phòng chat ngay lập tức
                updateChatRoomLatestMessage(tempMessage);

                // Hiển thị tin nhắn tạm thời ngay lập tức trên UI
                setMessages(prevMessages => [tempMessage, ...prevMessages]);
            }

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

    // Xử lý gửi tin nhắn với vai trò là startup
    const sendNewMessageAsStartup = async (e) => {
        if (e) e.preventDefault();
        if (!messageInput.trim() && !selectedFile && attachments.length === 0) return;

        try {
            const messageContent = messageInput;
            setMessageInput('');

            // Xác định loại tin nhắn dựa vào file được chọn
            let typeMessage = MESSAGE_TYPES.TEXT;
            if (selectedFile) {
                typeMessage = MESSAGE_TYPES.FILE;  // Tất cả các loại file đều là FILE
            }

            // Lấy startupId từ accountId hiện tại
            let startupId = null;
            try {
                const startupResponse = await startupService.getStartupIdByAccountId(currentUserId);
                if (startupResponse) {
                    if (typeof startupResponse === 'number') {
                        startupId = startupResponse;
                    } else if (startupResponse.startupId) {
                        startupId = startupResponse.startupId;
                    } else if (startupResponse.data) {
                        startupId = startupResponse.data;
                    }
                }

                if (!startupId) {
                    toast.error("Bạn không có quyền gửi tin nhắn với vai trò startup!");
                    return;
                }
            } catch (err) {
                console.error('Lỗi khi lấy startupId:', err);
                toast.error('Không thể xác định startup của bạn!');
                return;
            }

            // Lấy thông tin startup để hiển thị
            let startupInfo = null;
            try {
                const infoResponse = await startupService.getStartupById(startupId);
                startupInfo = infoResponse && infoResponse.data ? infoResponse.data : infoResponse;
            } catch (err) {
                console.error('Lỗi khi lấy thông tin startup:', err);
            }

            // Chuẩn bị dữ liệu tin nhắn để gửi
            const messageData = {
                content: messageContent,
                chatRoomId: selectedChatRoom,
                senderAccountId: null, // Không dùng accountId khi gửi từ startup
                senderStartupId: startupId,
                type: typeMessage,
                file: selectedFile,
                attachments: attachments
            };

            // Tạo tin nhắn tạm thời để cập nhật UI ngay lập tức
            const tempMessage = {
                id: `temp-${Date.now()}`,
                chatRoomId: selectedChatRoom,
                senderId: null,
                senderStartupId: startupId,
                content: messageContent,
                sentAt: new Date().toISOString(),
                isRead: false,
                isTemp: true,
                type: typeMessage,
                name: startupInfo ? startupInfo.startupName : 'Startup',
                avatarUrl: startupInfo ? startupInfo.logo : null
            };

            // Cập nhật tin nhắn mới nhất trong phòng chat ngay lập tức
            updateChatRoomLatestMessage(tempMessage);

            // Hiển thị tin nhắn tạm thời ngay lập tức trên UI
            setMessages(prevMessages => [tempMessage, ...prevMessages]);

            console.log("Đang gửi tin nhắn với vai trò startup:", messageContent);

            // Gửi tin nhắn tới server
            const response = await chatService.sendMessage(messageData);
            console.log("Gửi tin nhắn thành công:", response);

            // Xóa các file đính kèm sau khi gửi
            setSelectedFile(null);
            setAttachments([]);

            // Cuộn xuống để hiển thị tin nhắn mới
            scrollToBottom();

            return response;
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

    // Kết nối SignalR sau khi có danh sách phòng chat - chỉ kết nối một lần
    useEffect(() => {
        if (chatRooms.length > 0 && !signalRConnected.current) {
            connectToSignalR();
        }
    }, [chatRooms, connectToSignalR]);

    // Kiểm tra nếu có phòng chat mới để kết nối thêm
    useEffect(() => {
        // Nếu đã kết nối và số lượng phòng chat thay đổi đáng kể, 
        // thì cần kết nối lại để thêm phòng chat mới vào SignalR
        if (signalRConnected.current && chatRooms.length > chatRoomsRef.current.length) {
            disconnectSignalR().then(() => {
                connectToSignalR();
            });
        }
    }, [chatRooms.length, disconnectSignalR, connectToSignalR]);

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

    // // Gửi tin nhắn với SenderStartupId
    // const sendMessageAsStartup = async (startupId, content, chatRoomId, typeMessage = MESSAGE_TYPES.TEXT, file = null) => {
    //     setLoading(true);
    //     setError(null);

    //     try {
    //         // Chuẩn bị dữ liệu tin nhắn để gửi từ startup
    //         const messageData = {
    //             content: content,
    //             chatRoomId: chatRoomId,
    //             senderAccountId: null, // Không dùng accountId khi gửi từ startup
    //             senderStartupId: startupId, // Sử dụng startupId
    //             type: typeMessage,
    //             file: file
    //         };

    //         // Tạo tin nhắn tạm thời để hiển thị ngay lập tức
    //         const tempMessage = {
    //             id: `temp-${Date.now()}`,
    //             chatRoomId: chatRoomId,
    //             senderId: null,
    //             senderStartupId: startupId,
    //             content: content,
    //             sentAt: new Date().toISOString(),
    //             isRead: false,
    //             isTemp: true,
    //             type: typeMessage,
    //             // Thêm các thông tin startup nếu cần
    //         };

    //         // Cập nhật UI ngay lập tức với tin nhắn tạm thời
    //         setMessages(prevMessages => [tempMessage, ...prevMessages]);

    //         // Gửi tin nhắn tới server
    //         const response = await chatService.sendMessage(messageData);
    //         console.log("Đã gửi tin nhắn từ startup:", response);

    //         return response;
    //     } catch (err) {
    //         setError(err);
    //         console.error("Lỗi khi gửi tin nhắn từ startup:", err);
    //         toast.error('Gửi tin nhắn thất bại!');
    //         throw err;
    //     } finally {
    //         setLoading(false);
    //     }
    // };

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
        sendNewMessageAsStartup,
        loadMoreMessages,
        handleAddAttachment,
        handleRemoveAttachment
    };
} 