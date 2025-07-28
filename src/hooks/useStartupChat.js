import { useState, useCallback, useEffect, useRef } from 'react';
import * as chatService from '@/apis/chatService';
import * as startupService from '@/apis/startupService';
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

/**
 * Hook để quản lý tin nhắn với vai trò là startup
 * @param {number} currentUserId - ID của người dùng hiện tại
 * @param {number} initialChatRoomId - ID của phòng chat ban đầu (tùy chọn)
 * @returns {object} - Các state và hàm để quản lý tin nhắn của startup
 */
export default function useStartupChat(currentUserId, initialChatRoomId = null) {
    // State quản lý phòng chat
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedChatRoom, setSelectedChatRoom] = useState(initialChatRoomId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [startupId, setStartupId] = useState(null);

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
    const chatRoomsRef = useRef([]); // Theo dõi chatRooms mà không gây re-render

    // Lấy startupId từ accountId người dùng hiện tại
    const fetchStartupId = useCallback(async () => {
        if (!currentUserId) return null;

        try {
            const startupResponse = await startupService.getStartupIdByAccountId(currentUserId);
            let fetchedStartupId = startupResponse;
            if (!fetchedStartupId) {
                console.error('Không tìm thấy startupId cho user:', currentUserId);
                return null;
            }
            setStartupId(fetchedStartupId);
            return fetchedStartupId;
        } catch (err) {
            console.error('Lỗi khi lấy startupId:', err);
            return null;
        }
    }, [currentUserId]);

    // Khởi tạo startupId khi component mount
    useEffect(() => {
        fetchStartupId();
    }, [fetchStartupId]);

    // Lấy danh sách phòng chat của startup
    const fetchChatRooms = useCallback(async (shouldSelectFirst = true) => {
        let id = startupId;

        if (!id) {
            id = await fetchStartupId(); // lấy startupId mới
            if (!id) {
                console.warn('fetchStartupId không trả về startupId hợp lệ');
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            // Sử dụng API lấy danh sách phòng chat của startup
            const response = await chatService.getChatRoomsByStartup(id);

            const rooms = Array.isArray(response) ? response : [];

            // console.log('Danh sách phòng chat của startup:', rooms);
            setChatRooms(rooms);
            chatRoomsRef.current = rooms.map(room => room.chatRoomId);

            // Tự động chọn phòng chat đầu tiên nếu chưa có phòng chat nào được chọn
            if (shouldSelectFirst && rooms.length > 0 && !selectedChatRoom) {
                setSelectedChatRoom(rooms[0].chatRoomId);
            }
        } catch (err) {
            setError(err);
            console.error('Lỗi khi lấy danh sách phòng chat của startup:', err);
        } finally {
            setLoading(false);
        }
    }, [startupId, selectedChatRoom, fetchStartupId]);

    // Lấy tin nhắn của phòng chat
    const fetchMessages = useCallback(async (chatRoomId, page = 1, pageSize = 20) => {
        if (!chatRoomId) return Promise.resolve();

        // Lưu lại ID phòng chat hiện tại để kiểm tra sau khi API trả về
        const requestChatRoomId = chatRoomId;

        // Khi tải trang đầu tiên của phòng chat mới, làm sạch tin nhắn cũ trước
        if (page === 1) {
            setMessages([]);
        }

        setLoading(true);
        setError(null);

        try {
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
                    senderStartupId: msg.senderStartupId,
                    content: msg.content,
                    sentAt: msg.sentAt,
                    isRead: msg.isRead,
                    type: messageType,
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

    // Lấy thông tin người dùng từ API
    const fetchUserInfo = async (userId) => {
        try {
            const userInfo = await getAccountInfo(userId);
            if (userInfo) {
                setChatMembers(prev => ({
                    ...prev,
                    [userId]: {
                        id: userId,
                        fullName: userInfo.fullName || userInfo.name,
                        avatar: userInfo.avatar || userInfo.avatarUrl
                    }
                }));
                return userInfo;
            }
        } catch (err) {
            console.error(`Lỗi khi lấy thông tin người dùng ${userId}:`, err);
        }
    };

    // Lấy thông tin startup từ API
    const fetchStartupInfo = async (startupId) => {
        try {
            const startupInfo = await startupService.getStartupById(startupId);
            return startupInfo && startupInfo.data ? startupInfo.data : startupInfo;
        } catch (err) {
            console.error(`Lỗi khi lấy thông tin startup ${startupId}:`, err);
            return null;
        }
    };

    // Tạo phòng chat mới
    const ensureChatRoom = async (targetAccountId, targetStartupId = null) => {
        if (!startupId) {
            const fetchedStartupId = await fetchStartupId();
            if (!fetchedStartupId) {
                toast.error('Không thể xác định startup của bạn!');
                return null;
            }
        }

        setLoading(true);
        setError(null);

        try {
            // Đảm bảo rằng senderStartupId là startupId của người dùng hiện tại
            const response = await chatService.ensureRoom(null, targetAccountId, startupId);

            // Làm mới danh sách phòng chat
            await fetchChatRooms(false);

            // Chọn phòng chat mới tạo
            if (response && response.chatRoomId) {
                setSelectedChatRoom(response.chatRoomId);
            }

            return response;
        } catch (err) {
            setError(err);
            console.error('Lỗi khi tạo phòng chat:', err);
            toast.error('Không thể tạo phòng chat. Vui lòng thử lại sau!');
            return null;
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
            chatRoomsRef.current = roomIds;

            // Kết nối với tất cả các phòng chat
            await signalRService.initChatConnection(roomIds, (message) => {
                handleNewMessage(message);
            });
            signalRConnected.current = true;
            console.log('Đã kết nối SignalR cho tất cả phòng chat của startup:', roomIds);
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
                messageType = MESSAGE_TYPES.FILE;
            }
        }

        // Chuẩn hóa dữ liệu tin nhắn từ SignalR
        const normalizedMessage = {
            id: message.messageId || message.id,
            chatRoomId: message.chatRoomId,
            senderId: message.senderAccountId,
            senderStartupId: message.senderStartupId,
            content: message.content,
            sentAt: message.sentAt,
            isRead: message.isRead,
            type: messageType,
            name: message.name,
            avatarUrl: message.avatarUrl
        };

        // Cập nhật thông tin tin nhắn mới nhất trong danh sách phòng chat
        updateChatRoomLatestMessage(normalizedMessage);

        // Chỉ cập nhật danh sách tin nhắn nếu tin nhắn thuộc phòng chat đang xem
        if (message.chatRoomId === selectedChatRoom) {
            setMessages(prev => {
                // Loại bỏ các tin nhắn tạm thời có nội dung giống tin nhắn thật từ server
                const filtered = prev.filter(msg =>
                    !(msg.isTemp && msg.content === normalizedMessage.content &&
                        (msg.senderId == normalizedMessage.senderId || msg.senderStartupId == normalizedMessage.senderStartupId))
                );

                // Kiểm tra xem tin nhắn đã có trong danh sách chưa (trừ các tin nhắn tạm)
                const exists = filtered.some(msg =>
                    (!msg.isTemp && msg.id == normalizedMessage.id) ||
                    (!msg.isTemp && msg.content == normalizedMessage.content &&
                        (msg.senderId == normalizedMessage.senderId || msg.senderStartupId == normalizedMessage.senderStartupId) &&
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

        // Xử lý thông tin người gửi
        if (normalizedMessage.senderId) {
            // Trường hợp người gửi là account
            if (normalizedMessage.name && normalizedMessage.avatarUrl && normalizedMessage.senderId) {
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
                const getUserInfo = async () => {
                    try {
                        const userInfo = await fetchUserInfo(normalizedMessage.senderId);
                        // Sau khi có thông tin người dùng, cập nhật tên và avatar cho tin nhắn
                        if (userInfo) {
                            setMessages(prev => prev.map(msg => {
                                if (msg.id === normalizedMessage.id ||
                                    (msg.senderId == normalizedMessage.senderId &&
                                        msg.content === normalizedMessage.content)) {
                                    return {
                                        ...msg,
                                        name: userInfo.fullName || userInfo.name,
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
                if (!chatMembers[normalizedMessage.senderId]) {
                    getUserInfo();
                } else {
                    // Nếu đã có thông tin trong chatMembers, sử dụng thông tin có sẵn để cập nhật tin nhắn
                    const existingUser = chatMembers[normalizedMessage.senderId];
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
                }
            }
        } else if (normalizedMessage.senderStartupId) {
            // Trường hợp người gửi là startup - lấy thông tin startup
            const processStartupSender = async () => {
                try {
                    const startupId = normalizedMessage.senderStartupId;

                    // Nếu đã có thông tin của startup này trong chatMembers, không cần lấy lại
                    if (chatMembers[`startup_${startupId}`]) {
                        return;
                    }

                    // Lấy thông tin startup từ API
                    const startupInfo = await fetchStartupInfo(startupId);

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
                                if ((msg.id === normalizedMessage.id || msg.messageId === normalizedMessage.messageId) ||
                                    (msg.senderStartupId === startupId && msg.content === normalizedMessage.content)) {
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

            processStartupSender();
        }
    }, [selectedChatRoom, chatMembers, fetchUserInfo, fetchStartupInfo]);

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

    // Xử lý gửi tin nhắn với tư cách startup
    const sendNewMessageAsStartup = async (e) => {
        if (e) e.preventDefault();
        if (!messageInput.trim() && !selectedFile && attachments.length === 0) return;
        if (!startupId) {
            const fetchedStartupId = await fetchStartupId();
            if (!fetchedStartupId) {
                toast.error('Không thể xác định startup của bạn!');
                return null;
            }
        }

        try {
            const messageContent = messageInput;
            setMessageInput('');

            // Xác định loại tin nhắn dựa vào file được chọn
            let typeMessage = MESSAGE_TYPES.TEXT;
            if (selectedFile) {
                typeMessage = MESSAGE_TYPES.FILE;
            }

            // Lấy thông tin startup để hiển thị
            let startupInfo = await fetchStartupInfo(startupId);

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

            console.log("Đang gửi tin nhắn với vai trò startup:", messageContent);

            // Gửi tin nhắn tới server
            const response = await sendMessage(messageData);
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
            return null;
        }
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

    // Xử lý khi thay đổi phòng chat
    useEffect(() => {
        if (selectedChatRoom) {
            setMessagePage(1);
            fetchMessages(selectedChatRoom, 1);
        }
    }, [selectedChatRoom, fetchMessages]);

    // Lấy danh sách phòng chat khi component mount hoặc khi startupId thay đổi
    useEffect(() => {
        if (startupId) {
            fetchChatRooms();
        }
    }, [startupId, fetchChatRooms]);

    // Kết nối SignalR sau khi có danh sách phòng chat - chỉ kết nối một lần
    useEffect(() => {
        if (chatRooms.length > 0 && !signalRConnected.current) {
            connectToSignalR();
        }
    }, [chatRooms, connectToSignalR]);

    // Kiểm tra nếu có phòng chat mới để kết nối thêm
    useEffect(() => {
        if (signalRConnected.current && chatRooms.length > chatRoomsRef.current.length) {
            disconnectSignalR().then(() => {
                connectToSignalR();
            });
        }
    }, [chatRooms.length, disconnectSignalR, connectToSignalR]);

    // Cleanup khi unmount
    useEffect(() => {
        return () => {
            disconnectSignalR();
        };
    }, [disconnectSignalR]);

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
        startupId,

        // Setters
        setSelectedChatRoom,
        setMessageInput,
        setSelectedFile,
        setMessages,

        // Actions
        fetchChatRooms,
        fetchMessages,
        ensureChatRoom,
        sendNewMessageAsStartup,
        loadMoreMessages,
        handleAddAttachment,
        handleRemoveAttachment,
        fetchStartupId,
        fetchStartupInfo,
        fetchUserInfo
    };
} 