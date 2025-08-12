import axiosClient from '@/config/axiosClient';

// API: Cập nhật quyền
export const updatePermission = async (data) => {
    const response = await axiosClient.put('/api/Permission/update-permission', data);
    return response;
};

// API: Lấy quyền theo roleId
export const getPermissionByRoleId = async (roleId) => {
    const response = await axiosClient.get(`/api/Permission/by-role/${roleId}`);
    return response;
};

// API: Kiểm tra quyền đăng bài
export const checkCanPost = async (accountId) => {
    const response = await axiosClient.get('/api/Permission/can-post', {
        params: { accountId }
    });
    return response;
};

// API: Kiểm tra quyền quản lý thành viên
export const checkCanManageMember = async (accountId) => {
    const response = await axiosClient.get('/api/Permission/can-manage-member', {
        params: { accountId }
    });
    return response;
};

export const canManageStartupChat = async (accountId) => {
    const response = await axiosClient.get('/api/Permission/can-manage-Startup-chat', {
        params: { accountId }
    });
    return response;
};