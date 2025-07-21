import axiosClient from '@/config/axiosClient';

// Phân tích swot
export const analyzeSwot = async (data) => {
    const response = await axiosClient.post('/api/Swot/analyze-swot', data);
    return response;
};
