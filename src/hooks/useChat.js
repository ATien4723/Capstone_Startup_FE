import { useState, useCallback, useEffect, useRef } from 'react';
import * as startupService from '@/apis/startupService';
import { toast } from 'react-toastify';
import signalRService from '@/services/signalRService';

export default function useChat(currentUserId) {
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Thêm các state từ component Chat
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [creatorName, setCreatorName] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberTitle, setNewMemberTitle] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // Ref để theo dõi kết nối SignalR
    const signalRConnected = useRef(false);

    // Lấy danh sách chatroom
    const fetchChatRooms = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.getChatRoomsForAccount(currentUserId);
            const items = Array.isArray(res.items) ? res.items : [];
            setChannels(items);
            if (items.length > 0 && !selectedChannel) {
                setSelectedChannel(items[0].chatRoomId);
            }
        } catch (err) {
            setChannels([]);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId, selectedChannel]);

    // Kết nối SignalR và lấy tin nhắn khi chuyển phòng chat
    useEffect(() => {
        const fetchMessages = async () => {
            if (selectedChannel) {
                try {
                    // Lấy tin nhắn từ API
                    const res = await getMessagesInRoom(selectedChannel);
                    setMessages(Array.isArray(res.items) ? res.items : []);

                    // Kết nối SignalR cho chat
                    await connectToSignalR(selectedChannel);
                } catch (err) {
                    console.error("Error fetching messages:", err);
                    setMessages([]);
                }
            } else {
                setMessages([]);
                // Ngắt kết nối SignalR khi không có phòng chat nào được chọn
                disconnectSignalR();
            }
        };
        fetchMessages();

        // Cleanup khi component unmount hoặc khi thay đổi phòng chat
        return () => {
            disconnectSignalR();
        };
    }, [selectedChannel]);

    // Kết nối tới SignalR
    const connectToSignalR = async (chatRoomId) => {
        if (!chatRoomId) return;

        try {
            // Ngắt kết nối cũ nếu có
            await disconnectSignalR();

            // Kết nối mới và đăng ký callback nhận tin nhắn
            await signalRService.initChatConnection(chatRoomId, handleReceiveMessage);
            signalRConnected.current = true;
            console.log("SignalR connected for chat room:", chatRoomId);
        } catch (err) {
            console.error("Error connecting to SignalR:", err);
        }
    };

    // Ngắt kết nối SignalR
    const disconnectSignalR = async () => {
        if (signalRConnected.current) {
            await signalRService.disconnectChat();
            signalRConnected.current = false;
            console.log("SignalR disconnected");
        }
    };

    // Xử lý khi nhận tin nhắn mới từ SignalR
    const handleReceiveMessage = (message) => {
        console.log("Received new message via SignalR:", message);

        // Kiểm tra xem tin nhắn có thuộc phòng chat hiện tại không
        if (message.chatRoomId == selectedChannel) {
            // Thêm tin nhắn mới vào state
            setMessages(prevMessages => {
                // Xóa tin nhắn tạm thời nếu có
                const messagesWithoutTemp = prevMessages.filter(msg => !msg.isTemp);

                // Kiểm tra xem tin nhắn đã tồn tại chưa (không bao gồm tin nhắn tạm thời)
                const exists = messagesWithoutTemp.some(msg =>
                    msg.messageId === message.messageId ||
                    (msg.id === message.id && msg.id !== undefined) ||
                    (msg.messageContent === message.messageContent &&
                        msg.accountId == message.accountId &&
                        Math.abs(new Date(msg.sentAt) - new Date(message.sentAt)) < 5000) // Tin nhắn có nội dung giống nhau gửi trong vòng 5 giây
                );

                if (!exists) {
                    return [message, ...messagesWithoutTemp];
                }
                return messagesWithoutTemp;
            });
        }
    };

    // Tạo nhóm chat
    const createChatRoom = async (data) => {
        setLoading(true); setError(null);
        try {
            await startupService.createChatRoom(data);
            await fetchChatRooms();
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

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
            toast.error("Failed to create group")
        }
    };

    // Thêm thành viên vào chatroom
    const addChatRoomMembers = async (data) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.addChatRoomMembers(data);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Xử lý thêm thành viên
    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUser) {
            toast.error("Please search and select a member first");
            return;
        }

        try {
            console.log("Adding member:", selectedUser); // Debug log

            // Chuẩn bị dữ liệu theo đúng format API yêu cầu
            const requestData = {
                chatRoomId: selectedChannel,
                currentUserId: currentUserId, // Người thêm
                membersToAdd: [
                    {
                        accountId: selectedUser.accountId, // ID người được thêm
                        memberTitle: newMemberTitle // Tên hiển thị do người dùng đặt
                    }
                ]
            };

            console.log("Request data:", requestData); // Debug log
            await addChatRoomMembers(requestData);

            // Reset form và đóng popup
            setShowAddMember(false);
            setNewMemberEmail('');
            setNewMemberTitle('');
            setSelectedUser(null);
            setSearchResults([]);

            toast.success("Member added to chat group");
        } catch (err) {
            console.error("Error adding member:", err);
            toast.error("Failed to add member");
        }
    };

    // Lấy tất cả thành viên của một startup
    const getStartupMembers = async (startupId) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.getStartupMembers(startupId);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Lấy tất cả thành viên của một chatroom
    const getChatRoomMembers = async (chatRoomId) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.getChatRoomMembers(chatRoomId);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Lấy các chatroom mà account thuộc về
    const getChatRoomsForAccount = async (accountId, pageNumber = 1, pageSize = 10) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.getChatRoomsForAccount(accountId, pageNumber, pageSize);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Gửi message
    const sendMessage = async (data) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.sendMessage(data);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Xử lý gửi tin nhắn
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Lưu nội dung tin nhắn trước khi xóa input
        const messageContent = input;

        try {
            // Xóa input ngay lập tức để tránh gửi lại
            setInput('');

            // Không cần tạo tin nhắn tạm thời nữa vì SignalR sẽ trả về tin nhắn rất nhanh
            // Nếu tin nhắn không xuất hiện ngay, có thể thêm lại phần này

            // Gửi tin nhắn lên server
            const response = await sendMessage({
                messageContent: messageContent,
                chatRoomId: selectedChannel,
                accountId: currentUserId
            });

            console.log("Message sent successfully:", response);

            // Tin nhắn sẽ được nhận lại qua SignalR trong handleReceiveMessage
        } catch (err) {
            console.error("Error sending message:", err);
            toast.error('Failed to send message!');
        }
    };

    // Lấy các message trong một chatroom
    const getMessagesInRoom = async (chatRoomId, pageNumber = 1, pageSize = 10) => {
        try {
            const res = await startupService.getMessagesInRoom(chatRoomId, pageNumber, pageSize);
            return res;
        } catch (err) {
            throw err;
        }
    };

    // Debounce function để tránh gọi API quá nhiều lần
    const debounce = (func, delay) => {
        let timeoutId;
        return function (...args) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    // Tìm kiếm account theo email
    const searchAccountByEmail = async (keyword) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.searchAccountByEmail(keyword);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Xử lý tìm kiếm thành viên startup với debounce
    const handleSearchChange = useCallback(
        debounce(async (value) => {
            if (!value.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                // Lấy danh sách thành viên startup
                const res = await getStartupMembers(1); // Sử dụng ID startup mặc định là 1
                // console.log("Startup members:", res); // Log để debug

                // Lấy danh sách thành viên chatroom hiện tại
                let chatRoomMembers = [];
                if (selectedChannel) {
                    const chatRoomRes = await getChatRoomMembers(selectedChannel);

                    if (Array.isArray(chatRoomRes)) {
                        chatRoomMembers = chatRoomRes;
                    } else if (chatRoomRes && Array.isArray(chatRoomRes.items)) {
                        chatRoomMembers = chatRoomRes.items;
                    }
                }

                // Xác định dữ liệu để xử lý (mảng thành viên startup)
                let members = [];
                if (Array.isArray(res)) {
                    // Nếu res là một mảng trực tiếp
                    members = res;
                } else if (res && Array.isArray(res.items)) {
                    // Nếu res có thuộc tính items là mảng
                    members = res.items;
                }

                // Lọc bỏ các thành viên đã có trong chatroom
                let availableMembers = members.filter(member => {
                    // Kiểm tra xem thành viên có trong chatroom không
                    const alreadyInRoom = chatRoomMembers.some(chatMember =>
                        chatMember.accountId == member.accountId ||
                        chatMember.memberAccountId == member.accountId
                    );

                    return !alreadyInRoom; // Chỉ giữ lại những thành viên chưa có trong chatroom
                });

                // Lọc kết quả dựa trên từ khóa tìm kiếm
                const filteredResults = availableMembers.filter(member => {
                    // Tìm kiếm theo fullName
                    const nameMatch = member.fullName &&
                        member.fullName.toLowerCase().includes(value.toLowerCase());

                    // Tìm kiếm theo các trường khác nếu có
                    const emailMatch = member.email &&
                        member.email.toLowerCase().includes(value.toLowerCase());
                    const titleMatch = member.roleName &&
                        member.roleName.toLowerCase().includes(value.toLowerCase());

                    return nameMatch || emailMatch || titleMatch;
                });

                console.log("Final filtered results:", filteredResults); // Log để debug
                setSearchResults(filteredResults);
            } catch (err) {
                console.error("Search error:", err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300),
        [selectedChannel] // Thêm selectedChannel vào dependencies để khi chuyển phòng chat, danh sách được cập nhật
    );

    // Xử lý khi thay đổi input email
    const handleEmailInputChange = (e) => {
        const value = e.target.value;
        setNewMemberEmail(value);
        handleSearchChange(value);
    };

    // Xử lý chọn thành viên từ kết quả tìm kiếm
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setNewMemberTitle(user?.fullName || ''); // Đặt fullName làm tên mặc định từ kết quả tìm kiếm
        setSearchResults([]); // Đóng kết quả tìm kiếm
    };

    // Xử lý xóa nhóm chat
    const handleDeleteChatRoom = async () => {
        if (!selectedChannel) return;
        if (window.confirm("Are you sure you want to delete this chat group?")) {
            try {
                // Gọi API xóa nhóm chat (cần implement trong startupService)
                // await startupService.deleteChatRoom(selectedChannel);
                toast.success("Chat group deleted");
                fetchChatRooms();
                setSelectedChannel(null);
            } catch (err) {
                toast.error("Failed to delete chat group");
            }
        }
        setShowDropdown(false);
    };

    // Xử lý tên hiển thị cho thành viên mới
    useEffect(() => {
        if (selectedUser && selectedUser.fullName) {
            // Sử dụng fullName làm tên hiển thị mặc định
            setNewMemberTitle(selectedUser.fullName);
        } else {
            setNewMemberTitle('');
        }
    }, [selectedUser]);

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            disconnectSignalR();
        };
    }, []);

    return {
        // State
        channels,
        selectedChannel,
        loading,
        error,
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

        // Methods
        fetchChatRooms,
        createChatRoom,
        handleCreateGroup,
        addChatRoomMembers,
        handleAddMember,
        getStartupMembers,
        getChatRoomMembers,
        getChatRoomsForAccount,
        sendMessage,
        handleSendMessage,
        getMessagesInRoom,
        searchAccountByEmail,
        handleSearchChange,
        handleEmailInputChange,
        handleSelectUser,
        handleDeleteChatRoom,

        // SignalR methods
        connectToSignalR,
        disconnectSignalR,
    };
} 