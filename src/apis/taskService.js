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
export const changeTaskColumn = async (data) => {
    const response = await axiosClient.put('/api/Task/Change-task-column', data);
    return response;
};

// Gán label cho task
export const assignLabelToTask = async (data) => {
    const response = await axiosClient.post('/api/Task/startup-task/assign-label', data);
    return response;
};

// Cập nhật thông tin task
export const updateTask = async (data) => {
    const response = await axiosClient.put('/api/Task/update-task', data);
    return response;
};

// Thêm comment vào task
export const addCommentToTask = async (data) => {
    const response = await axiosClient.post('/api/Task/comment-task', data);
    return response;
};

// Gán task cho người dùng
export const assignTask = async (data) => {
    const response = await axiosClient.post('/api/Task/assign-task', data);
    return response;
};

// Lấy danh sách task theo milestone với phân trang và lọc
export const getTasksByMilestone = async (milestoneId, pageNumber = 1, pageSize = 10, search = null, columnStatusId = null) => {
    const response = await axiosClient.get('/api/Task/tasks-list-by-milestone', {
        params: {
            milestoneId,
            pageNumber,
            pageSize,
            search,
            columnStatusId
        }
    });
    return response;
};

// Hủy gán người dùng khỏi task
export const unassignAccountFromTask = async (taskId, accountId) => {
    const response = await axiosClient.delete('/api/Task/unassign-task', {
        params: { taskId, accountId }
    });
    return response;
};

// Lấy tất cả comment của task
export const getCommentsByTaskId = async (taskId) => {
    const response = await axiosClient.get('/api/Task/get-all-task-comment', {
        params: { taskId }
    });
    return response;
};
