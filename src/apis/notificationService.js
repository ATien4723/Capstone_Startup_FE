import axiosClient from './axiosClient';

// Lấy danh sách thông báo theo trang
export const getNotifications = async (accountId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/Notification/Notification/${accountId}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

// Lấy số lượng thông báo chưa đọc
export const getUnreadNotificationCount = async (accountId) => {
    try {
        const response = await axiosClient.get(`api/Notification/unread-count/${accountId}`);
        return response.unreadCount;
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        return 0;
    }
};

// Đánh dấu thông báo đã đọc
export const markNotificationAsRead = async (notificationId, accountId) => {
    try {
        const response = await axiosClient.put(`api/Notification/mark-as-read${notificationId}?accountId=${accountId}`);
        return response;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// Tạo thông báo mới (thường chỉ được gọi từ server, nhưng có thể cần cho testing)
export const createNotification = async (userId, message) => {
    try {
        const response = await axiosClient.post(`api/Notification/CreateNotification`, {
            userId,
            message
        });
        return response;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export default {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    createNotification
}; 