import axiosClient from './axiosClient';

// Get posts by account ID
export const getPostsByAccountId = async (accountId) => {
    try {
        const response = await axiosClient.get(`GetPostsByAccountId?accountId=${accountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get post comments by post ID
export const getPostCommentsByPostId = async (postId) => {
    try {
        const response = await axiosClient.get(`GetPostCommentsByPostId?postId=${postId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get post likes by post ID
export const getPostLikesByPostId = async (postId) => {
    try {
        const response = await axiosClient.get(`GetPostLikeByPostId?postId=${postId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Create post comment
export const createPostComment = async (commentData) => {
    try {
        const response = await axiosClient.post('CreatePostComment', commentData);
        return response;
    } catch (error) {
        throw error;
    }
};

// Create post
export const createPost = async (postData) => {
    try {
        const response = await axiosClient.post('CreatePost', postData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
};

// Like post
export const likePost = async (likeData) => {
    try {
        const response = await axiosClient.post('like', likeData);
        return response;
    } catch (error) {
        throw error;
    }
};

// Unlike post
export const unlikePost = async (likeData) => {
    try {
        const response = await axiosClient.post('unlike', likeData);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get post like count
export const getPostLikeCount = async (postId) => {
    try {
        const response = await axiosClient.get(`${postId}/like-count`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get post comment count
export const getPostCommentCount = async (postId) => {
    try {
        const response = await axiosClient.get(`${postId}/comment-count`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Check if post is liked
export const isPostLiked = async (likeData) => {
    try {
        const response = await axiosClient.get(`${likeData.postId}/liked`, {
            data: likeData
        });
        return response;
    } catch (error) {
        throw error;
    }
}; 