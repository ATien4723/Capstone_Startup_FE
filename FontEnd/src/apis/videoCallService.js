import axiosClient from '@/config/axiosClient';

export const startCallApi = async (chatRoomId, accountId, connectionId) => {
    try {
        const response = await axiosClient.post('/api/UserChat/start-call', {
            chatRoomId,
            accountId,
            connectionId
        });
        return response;
    } catch (error) {
        console.error('Error starting call:', error);
        throw error;
    }
};

export const endCallApi = async (callSessionId, roomToken) => {
    try {
        const response = await axiosClient.post('/api/UserChat/end-call', {
            callSessionId,
            roomToken
        });
        return response;
    } catch (error) {
        console.error('Error ending call:', error);
        throw error;
    }
};

export const acceptCallApi = async (callSessionId, roomToken, connectionId) => {
    try {
        const response = await axiosClient.post('/api/UserChat/accept-call', {
            callSessionId,
            roomToken,
            connectionId
        });
        return response;
    } catch (error) {
        console.error('Error accepting call:', error);
        throw error;
    }
};

export const rejectCallApi = async (callSessionId, roomToken) => {
    try {
        const response = await axiosClient.post('/api/UserChat/reject-call', {
            callSessionId,
            roomToken
        });
        return response;
    } catch (error) {
        console.error('Error rejecting call:', error);
        throw error;
    }
};

export const getCallHistoryApi = async (chatRoomId) => {
    try {
        const response = await axiosClient.get(`/api/UserChat/history-call?chatRoomId=${chatRoomId}`);
        return response;
    } catch (error) {
        console.error('Error getting call history:', error);
        throw error;
    }
};

// // API để gửi tín hiệu WebRTC giữa người dùng
// export const sendWebRTCSignal = async (callSessionId, signal, targetAccountId) => {
//     try {
//         const response = await axiosClient.post('/api/UserChat/send-signal', {
//             callSessionId,
//             signal: JSON.stringify(signal),
//             targetAccountId
//         });
//         return response.data;
//     } catch (error) {
//         console.error('Error sending WebRTC signal:', error);
//         throw error;
//     }
// };

// // API để lấy tín hiệu WebRTC từ đối phương
// export const getWebRTCSignals = async (callSessionId, lastSignalId = 0) => {
//     try {
//         const response = await axiosClient.get(`/api/UserChat/get-signals?callSessionId=${callSessionId}&lastSignalId=${lastSignalId}`);
//         return response.data;
//     } catch (error) {
//         console.error('Error getting WebRTC signals:', error);
//         throw error;
//     }
// }; 