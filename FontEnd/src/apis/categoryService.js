import axiosClient from '@/config/axiosClient';

// Lấy tất cả danh mục
export const getAllCategories = async () => {
    try {
        const response = await axiosClient.get('api/Category');
        return response;
    } catch (error) {
        throw error;
    }
};

// Lấy danh mục theo id
export const getCategoryById = async (id) => {
    try {
        const response = await axiosClient.get(`api/Category/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Tạo mới danh mục
export const createCategory = async (data) => {
    try {
        const response = await axiosClient.post('api/Category', data);
        return response;
    } catch (error) {
        throw error;
    }
};

// Cập nhật danh mục
export const updateCategory = async (id, data) => {
    try {
        const response = await axiosClient.put(`api/Category/${id}`, data);
        return response;
    } catch (error) {
        throw error;
    }
};

// Xóa danh mục
export const deleteCategory = async (id) => {
    try {
        const response = await axiosClient.delete(`api/Category/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};
