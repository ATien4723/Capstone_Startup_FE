import axiosClient from '@/config/axiosClient';

// API: Lấy dữ liệu dashboard admin
export const getAdminDashboard = async () => {
    try {
        const response = await axiosClient.get('api/Admin/admin-dashboard');
        return response;
    } catch (error) {
        console.error('Lỗi khi gọi API admin dashboard:', error);
        throw error;
    }
};

// API: Tạo tài khoản admin
export const createAdmin = async (adminData) => {
    try {
        const response = await axiosClient.post('api/Account/create-admin', adminData);
        return response;
    } catch (error) {
        console.error('Lỗi khi tạo tài khoản admin:', error);
        throw error;
    }
};

