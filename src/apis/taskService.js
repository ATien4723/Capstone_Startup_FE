import axiosClient from '@/config/axiosClient';

// Tạo milestone mới
export const createMilestone = async (data) => {
    const response = await axiosClient.post('/api/Task/CreateMilestone', data);
    return response;
};

// Thêm thành viên vào milestone
export const addMembersToMilestone = async (data) => {
    const response = await axiosClient.post('/api/Task/add-milestone-members', data);
    return response;
};

// Tạo cột mới cho milestone
export const createColumn = async (data) => {
    const response = await axiosClient.post('/api/Task/create-column', data);
    return response;
};

// Lấy tất cả các cột theo milestoneId
export const getColumnsByMilestone = async (milestoneId) => {
    const response = await axiosClient.get('/api/Task/get-all-columns', {
        params: { milestoneId }
    });
    return response;
};

// Tạo task mới
export const createTask = async (data) => {
    const response = await axiosClient.post('/api/Task/create-task', data);
    return response;
};

// Lấy board (các cột và task) theo milestoneId
export const getTaskBoard = async (milestoneId) => {
    const response = await axiosClient.get('/api/Task/get-task-board', {
        params: { milestoneId }
    });
    return response;
};

// Lấy tất cả milestone theo startupId
export const getAllMilestones = async (startupId) => {
    const response = await axiosClient.get('/api/Task/get-all-milestone', {
        params: { startupId }
    });
    return response;
};

// Đổi cột (status) cho task
export const updateTaskColumn = async (data) => {
    const response = await axiosClient.put('/api/Task/Change-task-column', data);
    return response;
};
