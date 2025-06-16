import axiosClient from '@/config/axiosClient';

// API: Tạo startup
export const createStartup = async (formData) => {
    // formData là FormData object chứa các trường của CreateStartupRequest
    const response = await axiosClient.post('/api/Startup/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// API: Lấy tất cả startup
export const getAllStartups = async () => {
    const response = await axiosClient.get('/api/Startup/all');
    return response.data;
};


// API: Lấy tất cả stage
export const getStage = async () => {
    const response = await axiosClient.get('/api/Startup/stage');
    return response;
};

// API: Kiểm tra membership
export const checkMembership = async (accountID) => {
    const response = await axiosClient.get('/api/Startup/check-membership', {
        params: { accountID },
    });
    return response;
};

// API: Tạo chatroom
export const createChatRoom = async (data) => {
    const response = await axiosClient.post('/api/Startup/create-chatromm', data);
    return response;
};

// API: Thêm thành viên vào chatroom
export const addChatRoomMembers = async (data) => {
    const response = await axiosClient.post('/api/Startup/add-chatroom-members', data);
    return response;
};

// API: Lấy tất cả thành viên của một startup
export const getStartupMembers = async (startupId) => {
    const response = await axiosClient.get(`/api/Startup/${startupId}/startup-members`);
    return response;
};

// API: Lấy tất cả thành viên của một chatroom
export const getChatRoomMembers = async (chatRoomId) => {
    const response = await axiosClient.get(`/api/Startup/${chatRoomId}/chatroom-members`);
    return response;
};

// API: Lấy các chatroom mà account thuộc về
export const getChatRoomsForAccount = async (accountId, pageNumber = 1, pageSize = 10) => {
    const response = await axiosClient.get(`/api/Startup/chatrooms/${accountId}`, {
        params: { pageNumber, pageSize },
    });
    return response;
};

// API: Gửi message
export const sendMessage = async (data) => {
    const response = await axiosClient.post('/api/Startup/message', data);
    return response;
};

// API: Lấy các message trong một chatroom
export const getMessagesInRoom = async (chatRoomId, pageNumber = 1, pageSize = 10) => {
    const response = await axiosClient.get(`/api/Startup/room-messages/${chatRoomId}`, {
        params: { pageNumber, pageSize },
    });
    return response;
};

