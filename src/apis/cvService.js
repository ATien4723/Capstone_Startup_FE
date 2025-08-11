import axiosClient from '@/config/axiosClient';

// Nộp CV ứng tuyển
export const applyCv = async (cvData) => {
    try {
        const formData = new FormData();

        // Thêm các trường dữ liệu vào FormData
        formData.append('Account_ID', cvData.accountId);
        formData.append('Internship_ID', cvData.internshipId);
        formData.append('PositionId', cvData.positionId || 0);

        // Thêm file CV
        if (cvData.cvFile) {
            formData.append('CVFile', cvData.cvFile);
        }

        const response = await axiosClient.post('api/CV/apply-cv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        console.error('Lỗi khi nộp CV ứng tuyển:', error);
        throw error;
    }
};

// Lấy danh sách CV theo startup
export const getCvsByStartup = async (startupId, positionId = 0, page = 1, pageSize = 5) => {
    try {
        const response = await axiosClient.get(`api/CV/candidateCv/${startupId}?postionId=${positionId}&page=${page}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách CV theo startup:', error);
        throw error;
    }
};

// Phản hồi CV ứng tuyển (chấp nhận hoặc từ chối)
export const responseCandidateCV = async (candidateCVId, status) => {
    try {
        const response = await axiosClient.put(`api/CV/response-candidateCV/${candidateCVId}?status=${status}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi phản hồi CV ứng tuyển:', error);
        throw error;
    }
};

// Kiểm tra xem account đã nộp CV vào bài internship post chưa
export const checkSubmittedCV = async (accountId, internshipId) => {
    try {
        const response = await axiosClient.get(`api/CV/submitted?accountId=${accountId}&internshipId=${internshipId}`);
        return response;
    } catch (error) {
        console.error('Error checking CV submission status:', error);
        throw error;
    }
};

// Lấy ra top internship post được nộp CV nhiều nhất
export const getTopCVSubmittedInternshipPosts = async (top = 5) => {
    try {
        const response = await axiosClient.get(`api/CV/top-internship-post-cv-submitted?top=${top}`);
        return response;
    } catch (error) {
        console.error('Error fetching top internship posts:', error);
        throw error;
    }
}; 