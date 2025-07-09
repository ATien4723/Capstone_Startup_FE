import axiosClient from '@/config/axiosClient';

// API: Lấy ra thống kê dữ liệu dashboard của startup
export const getStartupDartboard = async (startupId) => {
    try {
        const response = await axiosClient.get(`/api/DartBoard/startup/${startupId}/dartboard`);
        return response;
    } catch (error) {
        console.error('Lỗi khi gọi API dashboard:', error);
        throw error;
    }
}; 