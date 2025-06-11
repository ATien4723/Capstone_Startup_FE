import axiosClient from '@/config/axiosClient';

// API: Tạo startup
export const createStartup = async (formData) => {
    // formData là FormData object chứa các trường của CreateStartupRequest
    const response = await axiosClient.post('/api/startup/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// API: Lấy tất cả startup
export const getAllStartups = async () => {
    const response = await axiosClient.get('/api/startup/all');
    return response.data;
};

// API: Kiểm tra membership
export const checkMembership = async (accountID) => {
    const response = await axiosClient.get('/api/startup/check-membership', {
        params: { accountID },
    });
    return response;
}; 