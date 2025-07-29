import axiosClient from '@/config/axiosClient';

export const sendCallSignal = async (targetId, signalData) => {
    try {
        const response = await axiosClient.post('/api/video-call/signal', {
            targetId,
            signal: signalData
        });
        return response.data;
    } catch (error) {
        console.error('Error sending call signal:', error);
        throw error;
    }
};

export const answerCallSignal = async (callerId, signalData) => {
    try {
        const response = await axiosClient.post('/api/video-call/answer', {
            callerId,
            signal: signalData
        });
        return response.data;
    } catch (error) {
        console.error('Error sending answer signal:', error);
        throw error;
    }
};

export const rejectCallSignal = async (callerId) => {
    try {
        const response = await axiosClient.post('/api/video-call/reject', {
            callerId
        });
        return response.data;
    } catch (error) {
        console.error('Error rejecting call:', error);
        throw error;
    }
};

export const endCallSignal = async (callId) => {
    try {
        const response = await axiosClient.post('/api/video-call/end', {
            callId
        });
        return response.data;
    } catch (error) {
        console.error('Error ending call:', error);
        throw error;
    }
};

export const getOnlineUsers = async () => {
    try {
        const response = await axiosClient.get('/api/video-call/online-users');
        return response.data;
    } catch (error) {
        console.error('Error getting online users:', error);
        throw error;
    }
}; 