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

// API: Thêm thành viên vào startup
export const inviteUserToStartup = async (data) => {
    const response = await axiosClient.post('/api/Startup/invite-member', data);
    return response;
};

// API: Cập nhật vai trò của thành viên trong startup
export const updateMemberRole = async (data) => {
    const response = await axiosClient.put('/api/Startup/update-member-role', data);
    return response;
};

// API: Xóa thành viên khỏi startup
export const removeMemberFromStartup = async (startupId, memberId) => {
    const response = await axiosClient.delete(`/api/Startup/${startupId}/remove-member/${memberId}`);
    return response;
};

// API: Tìm kiếm người dùng theo email
export const searchAccountByEmail = async (keyword) => {
    const response = await axiosClient.get('/api/Startup/search-account-by-email', {
        params: { keyword }
    });
    return response;
};

// API: Lấy thông tin vai trò theo roleId
export const getRole = async (roleId) => {
    const response = await axiosClient.get(`/api/Startup/rolestartup/${roleId}`);
    return response;
};

// API: Lấy tất cả vai trò của một startup
export const getRolesByStartup = async (startupId) => {
    const response = await axiosClient.get(`/api/Startup/Getall-rolestartup/${startupId}`);
    return response;
};

// API: Tạo vai trò mới
export const createRole = async (data) => {
    const response = await axiosClient.post('/api/Startup/Create-role', data);
    return response;
};

// API: Cập nhật vai trò
export const updateRole = async (data) => {
    const response = await axiosClient.put('/api/Startup/Update-role', data);
    return response;
};

// API: Xóa vai trò
export const deleteRole = async (roleId) => {
    const response = await axiosClient.delete(`/api/Startup/Update-role/${roleId}`);
    return response;
};