import axiosClient from '@/config/axiosClient';
import { getUserId } from '@/apis/authService';

// Get posts by account ID
export const getPostsByAccountId = async (accountId, pageNumber = 1, pageSize = 10) => {
    try {
        // Lấy ID của người dùng hiện tại
        const currentAccountId = await getUserId() || 0;

        const response = await axiosClient.get(
            `GetPostsByAccountId?accountId=${accountId}&currentAccountId=${currentAccountId}&pageNumber=${pageNumber}&pageSize=${pageSize}`
        );
        return response;
    } catch (error) {
        throw error;
    }
};

//New Feed
export const getNewFeed = async (userId, page = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`NewFeed?userId=${userId}&page=${page}&pageSize=${pageSize}`);
        console.log('Kết quả API New Feed:', response);
        return response;
    } catch (error) {
        console.error('Lỗi khi gọi API New Feed:', error);
        throw error;
    }
};

// Get post comments by post ID
export const getPostCommentsByPostId = async (postId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`GetPostCommentsByPostId?postId=${postId}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
        console.log('Kết quả API bình luận:', response);
        return response;
    } catch (error) {
        console.error('Lỗi khi gọi API lấy bình luận:', error);
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
        // Xây dựng URL với các tham số
        let url = `CreatePostComment?AccountId=${commentData.accountId}&PostId=${commentData.postId}&Content=${encodeURIComponent(commentData.content)}`;

        // Thêm ParentCommentId nếu có
        if (commentData.parentCommentId) {
            url += `&ParentCommentId=${commentData.parentCommentId}`;
        }

        const response = await axiosClient.post(url);
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
        const response = await axiosClient.get(`${likeData.postId}/liked?postId=${likeData.postId}&accountId=${likeData.accountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Cập nhật bình luận
export const updatePostComment = async (commentData) => {
    try {
        const response = await axiosClient.put(
            `UpdatePostComment?CommentId=${commentData.commentId}&Content=${encodeURIComponent(commentData.content)}`
        );
        return response;
    } catch (error) {
        throw error;
    }
};

// Xóa bình luận
export const deletePostComment = async (commentId) => {
    try {
        const response = await axiosClient.delete(`DeletePostComment?commentId=${commentId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Lấy bình luận con
export const getPostChildComments = async (parentCommentId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(
            `GetPostChidComments?parrentCommentId=${parentCommentId}&pageNumber=${pageNumber}&pageSize=${pageSize}`
        );
        return response;
    } catch (error) {
        throw error;
    }
};

// Thích bình luận
export const likeComment = async (commentId, accountId) => {
    try {
        const response = await axiosClient.post(`LikeComment?commentId=${commentId}&accountId=${accountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Bỏ thích bình luận
export const unlikeComment = async (commentId, accountId) => {
    try {
        const response = await axiosClient.post(`UnlikeComment?commentId=${commentId}&accountId=${accountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Kiểm tra xem người dùng đã thích bình luận chưa
// export const isCommentLiked = async (commentId, accountId) => {
//     try {
//         const response = await axiosClient.get(`IsCommentLiked?commentId=${commentId}&accountId=${accountId}`);
//         return response;
//     } catch (error) {
//         throw error;
//     }
// };

// Lấy số lượng like của bình luận
export const getCommentLikeCount = async (commentId) => {
    try {
        const response = await axiosClient.get(`GetCommentLikeCount?commentId=${commentId}`);
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

// Cập nhật bài viết
export const updatePost = async (postId, updatePostDTO) => {
    try {
        const response = await axiosClient.put(`update-post/${postId}`, updatePostDTO);
        return response.data;
    } catch (error) {
        console.error('Error updating post:', error);
        throw error;
    }
};

// Xóa bài viết
export const deletePost = async (postId) => {
    try {
        const response = await axiosClient.delete(`delete-post${postId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};

// Ẩn bài viết
// export const hidePost = async (accountId, postId) => {
//     try {
//         const hidePostDTO = {
//             accountId: accountId,
//             postId: postId
//         };

//         const response = await axiosClient.post('hide', hidePostDTO);
//         return response;
//     } catch (error) {
//         console.error('Error hiding post:', error);
//         throw error;
//     }
// };


export const hidePost = async (accountId, postId) => {
    try {
        const response = await axiosClient.post('/hide', {
            accountId: accountId,
            postId: postId
        });
        return response.data;
    } catch (error) {
        console.error('Error hiding post:', error);
        throw error;
    }
};
