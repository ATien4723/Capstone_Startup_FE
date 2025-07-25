import axiosClient from '@/config/axiosClient';

// Đảm bảo tạo phòng chat giữa hai người dùng hoặc người dùng và startup
export const ensureRoom = async (accountId, targetAccountId, targetStartupId) => {
    try {
        let url = `api/UserChat/ensure-room?AccountId=${accountId}&TargetAccountId=${targetAccountId}`;
        if (targetStartupId !== undefined && targetStartupId !== null) {
            url += `&TargetStartupId=${targetStartupId}`;
        }

        const response = await axiosClient.post(url);
        return response;
    } catch (error) {
        console.error('Lỗi khi tạo/lấy phòng chat:', error);
        throw error;
    }
};


// Lấy danh sách tin nhắn trong một phòng chat
export const getMessages = async (chatRoomId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/UserChat/messages/${chatRoomId}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy tin nhắn:', error);
        throw error;
    }
};

// Gửi tin nhắn mới
export const sendMessage = async (messageData) => {
    const response = await axiosClient.post('api/UserChat/message', messageData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response;
};

// Lấy danh sách phòng chat của một tài khoản
export const getChatRoomsByAccount = async (accountId) => {
    try {
        const response = await axiosClient.get(`api/UserChat/list-chatroom-by/${accountId}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách phòng chat:', error);
        throw error;
    }
}; 