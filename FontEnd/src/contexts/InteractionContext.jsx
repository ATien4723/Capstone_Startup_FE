import React, { createContext, useState, useCallback } from 'react';

export const InteractionContext = createContext();

export const InteractionProvider = ({ children }) => {
    const [likeTrigger, setLikeTrigger] = useState(0);
    const [commentTrigger, setCommentTrigger] = useState(0);

    // Hàm gọi khi có thay đổi like/unlike
    const triggerLike = useCallback(() => {
        setLikeTrigger(prev => prev + 1);
    }, []);

    // Hàm gọi khi có thay đổi comment
    const triggerComment = useCallback(() => {
        setCommentTrigger(prev => prev + 1);
    }, []);

    return (
        <InteractionContext.Provider value={{
            likeTrigger,
            triggerLike,
            commentTrigger,
            triggerComment
        }}>
            {children}
        </InteractionContext.Provider>
    );
}; 