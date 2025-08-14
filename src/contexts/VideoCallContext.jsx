import React, { createContext, useContext } from 'react';
import { getUserId } from '@/apis/authService';
import useVideoCall from '@/hooks/useVideoCall';

const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
    const currentUserId = getUserId();

    // Sử dụng hook useVideoCall để quản lý cuộc gọi
    const videoCallData = useVideoCall(currentUserId);

    return (
        <VideoCallContext.Provider value={videoCallData}>
            {children}
        </VideoCallContext.Provider>
    );
};

// Hook để sử dụng VideoCallContext
export const useVideoCallContext = () => {
    const context = useContext(VideoCallContext);
    if (!context) {
        throw new Error('useVideoCallContext phải được sử dụng trong VideoCallProvider');
    }
    return context;
};
