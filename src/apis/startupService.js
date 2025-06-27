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
    return response;
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
    const response = await axiosClient.post('/api/Startup/message', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
};

// API: Lấy các message trong một chatroom
export const getMessagesInRoom = async (chatRoomId, pageNumber = 1, pageSize = 10) => {
    const response = await axiosClient.get(`/api/Startup/room-messages/${chatRoomId}`, {
        params: { pageNumber, pageSize },
    });
    return response;
};

// API: Cập nhật vai trò của thành viên trong startup
export const updateMemberRole = async (data) => {
    const response = await axiosClient.put('/api/Startup/update-member-role', data);
    return response;
};

// API: Xóa thành viên khỏi startup
export const removeMemberFromStartup = async (startupId, accountId) => {
    const response = await axiosClient.delete(`/api/Startup/kick-member?startupId=${startupId}&accountId=${accountId}`);
    return response;
};

// API: Tìm kiếm người dùng theo email
export const searchAccountByEmail = async (keyword) => {
    const response = await axiosClient.get('/api/Startup/search-account-by-email', {
        params: { keyword }
    });
    return response;
};

// API lay role theo roleId
export const getRole = async (roleId) => {
    const response = await axiosClient.get(`/api/Startup/rolestartup/${roleId}`);
    return response;
};

// API lay tat ca role
export const getRolesByStartup = async (startupId) => {
    const response = await axiosClient.get(`/api/Startup/Getall-rolestartup/${startupId}`);
    return response;
};

// API: tao  role
export const createRole = async (data) => {
    const response = await axiosClient.post('/api/Startup/Create-role', data);
    return response;
};

// API: Update a role
export const updateRole = async (data) => {
    const response = await axiosClient.put('/api/Startup/Update-role', data);
    return response;
};

// API: Delete role
export const deleteRole = async (roleId) => {
    const response = await axiosClient.delete(`/api/Startup/Delete-role/${roleId}`);
    return response;
};

// API: Cập nhật ten thành viên trong startup
export const updateMemberTitle = async (data) => {
    const response = await axiosClient.put('/api/Startup/update-member-title', data);
    return response;
};

// API: them thanh vien startup
export const createInvite = async (data) => {
    const response = await axiosClient.post('/api/Startup/create-invite', data);
    return response;
};

// API: Lấy startupId theo accountId
export const getStartupIdByAccountId = async (accountId) => {
    const response = await axiosClient.get(`/api/Startup/startupid/${accountId}`);
    return response;
};

// // API: Tìm kiếm và lọc thành viên
// export const searchAndFilterMembers = async (startupId, roleId = null, search = null) => {
//     const response = await axiosClient.get('/api/Startup/search-members', {
//         params: { startupId, roleId, search }
//     });
//     return response;
// };

// API: Rời khỏi startup
export const outStartup = async (accountId) => {
    const response = await axiosClient.post('/api/Startup/out-startup', null, {
        params: { accountId }
    });
    return response;
};

// API: Xóa thành viên khỏi chatroom
export const kickChatRoomMembers = async (data) => {
    const response = await axiosClient.delete('/api/Startup/kick-chatroom-members', {
        data
    });
    return response;
};

// API: Tìm kiếm tin nhắn trong chatroom
export const searchMessagesInRoom = async (chatRoomId, searchKey, pageNumber = 1, pageSize = 10) => {
    const response = await axiosClient.get('/api/Startup/room-messages-search', {
        params: { chatRoomId, searchKey, pageNumber, pageSize }
    });
    return response;
};

// API: Lấy danh sách lời mời của startup
export const getInvitesByStartup = async (startupId, pageNumber = 1, pageSize = 10) => {
    const response = await axiosClient.get(`/api/Startup/startup/${startupId}/invites`, {
        params: { pageNumber, pageSize }
    });
    return response;
};

// API: Lấy chi tiết lời mời theo ID
export const getInviteById = async (inviteId) => {
    const response = await axiosClient.get(`/api/Startup/invite/${inviteId}`);
    return response;
};

// API: Phản hồi lời mời
export const respondToInvite = async (data) => {
    const response = await axiosClient.post('/api/Startup/invite/respond', data);
    return response;
};