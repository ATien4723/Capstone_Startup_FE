import React, { createContext, useState, useCallback } from 'react';

export const LikeContext = createContext();

export const LikeProvider = ({ children }) => {
    const [likeTrigger, setLikeTrigger] = useState(0);

    // Hàm gọi khi có thay đổi like/unlike
    const triggerLike = useCallback(() => {
        setLikeTrigger(prev => prev + 1);
    }, []);

    return (
        <LikeContext.Provider value={{ likeTrigger, triggerLike }}>
            {children}
        </LikeContext.Provider>
    );
}; 