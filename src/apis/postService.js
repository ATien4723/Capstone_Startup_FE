import axiosClient from '@/config/axiosClient';
import { getUserId } from '@/apis/authService';

// Get posts by account ID
export const getPostsByAccountId = async (accountId, pageNumber = 1, pageSize = 10) => {
    try {
        const currentAccountId = await getUserId() || 0;
        const response = await axiosClient.get(
            `api/post/GetPostsByAccountId?accountId=${accountId}&currentAccountId=${currentAccountId}&pageNumber=${pageNumber}&pageSize=${pageSize}`
        );
        return response;
    } catch (error) {
        throw error;
    }
};

//New Feed
export const getNewFeed = async (userId, page = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/post/NewFeed?userId=${userId}&page=${page}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi gọi API New Feed:', error);
        throw error;
    }
};

// Get post comments by post ID
export const getPostCommentsByPostId = async (postId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/post/GetPostCommentsByPostId?postId=${postId}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
        console.log('Kết quả API bình luận:', response);
        return response;
    } catch (error) {
        console.error('Lỗi khi gọi API lấy bình luận:', error);
        throw error;
    }
};

// Get post likes by post ID
export const getPostLikesByPostId = async (postId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/post/GetPostLikeByPostId?postId=${postId}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người thích bài viết:', error);
        throw error;
    }
};

// Create post comment
export const createPostComment = async (commentData) => {
    try {
        let url = `api/post/CreatePostComment?AccountId=${commentData.accountId}&PostId=${commentData.postId}&Content=${encodeURIComponent(commentData.content)}`;
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
        const response = await axiosClient.post('api/post/CreatePost', postData, {
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
        const response = await axiosClient.get(`api/post/${postId}/like-count`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get post comment count
export const getPostCommentCount = async (postId) => {
    try {
        const response = await axiosClient.get(`api/post/${postId}/comment-count`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Check if post is liked
export const isPostLiked = async (likeData) => {
    try {
        const response = await axiosClient.get(`api/post/liked?postId=${likeData.postId}&accountId=${likeData.accountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Cập nhật bình luận
export const updatePostComment = async (commentData) => {
    try {
        const response = await axiosClient.put(
            `api/post/update-post-comment`, {
            postcommentId: commentData.postcommentId,
            content: commentData.content
        }
        );
        return response;
    } catch (error) {
        throw error;
    }
};

// Xóa bình luận
export const deletePostComment = async (commentId) => {
    try {
        const response = await axiosClient.delete(`api/post/DeletePostComment?commentId=${commentId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Lấy bình luận con
export const getPostChildComments = async (parentCommentId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(
            `api/post/GetPostChidComments?parrentCommentId=${parentCommentId}&pageNumber=${pageNumber}&pageSize=${pageSize}`
        );
        return response;
    } catch (error) {
        throw error;
    }
};

// Thích bình luận
export const likeComment = async (commentId, accountId) => {
    try {
        const response = await axiosClient.post(`api/post/LikeComment?commentId=${commentId}&accountId=${accountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Bỏ thích bình luận
export const unlikeComment = async (commentId, accountId) => {
    try {
        const response = await axiosClient.post(`api/post/UnlikeComment?commentId=${commentId}&accountId=${accountId}`);
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
        const response = await axiosClient.get(`api/post/GetCommentLikeCount?commentId=${commentId}`);
        return response;
    } catch (error) {
        throw error;
    }
};


// Like post
export const likePost = async (likeData) => {
    try {
        const response = await axiosClient.post('api/post/like', likeData);
        return response;
    } catch (error) {
        throw error;
    }
};

// Unlike post
export const unlikePost = async (likeData) => {
    try {
        const response = await axiosClient.post('api/post/unlike', likeData);
        return response;
    } catch (error) {
        throw error;
    }
};

// Cập nhật bài viết
export const updatePost = async (postId, updatePostDTO) => {
    try {
        const response = await axiosClient.put(`api/post/update-post/${postId}`, updatePostDTO);
        return response.data;
    } catch (error) {
        console.error('Error updating post:', error);
        throw error;
    }
};

// Xóa bài viết
export const deletePost = async (postId) => {
    try {
        const response = await axiosClient.delete(`api/post/delete-post${postId}`);
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
        const response = await axiosClient.post('/api/post/hide', {
            accountId: accountId,
            postId: postId
        });
        return response;
    } catch (error) {
        console.error('Error hiding post:', error);
        throw error;
    }
};

// Chia sẻ bài viết
export const sharePost = async (shareData) => {
    try {
        const response = await axiosClient.post('api/post/share', shareData);
        return response;
    } catch (error) {
        console.error('Lỗi khi chia sẻ bài viết:', error);
        throw error;
    }
};

// Lấy bài viết theo ID
export const getPostById = async (postId) => {
    try {
        const response = await axiosClient.get(`api/post/post/${postId}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy bài viết theo ID:', error);
        throw error;
    }
};

// Tìm kiếm bài viết
export const searchPosts = async (searchText, currentAccountId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/post/search-posts?searchText=${encodeURIComponent(searchText)}&currentAccountId=${currentAccountId}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi tìm kiếm bài viết:', error);
        throw error;
    }
};

// Lấy tất cả lý do báo cáo
export const getAllReportReasons = async () => {
    try {
        const response = await axiosClient.get('api/post/report-reasons');
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách lý do báo cáo:', error);
        throw error;
    }
};

// Lấy lý do báo cáo theo ID
export const getReportReasonById = async (id) => {
    try {
        const response = await axiosClient.get(`api/post/report-reasons/${id}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy lý do báo cáo theo ID:', error);
        throw error;
    }
};

// Tạo lý do báo cáo mới
export const createReportReason = async (reasonData) => {
    try {
        const response = await axiosClient.post('api/post/report-reasons', reasonData);
        return response;
    } catch (error) {
        console.error('Lỗi khi tạo lý do báo cáo mới:', error);
        throw error;
    }
};

// Cập nhật lý do báo cáo
export const updateReportReason = async (id, reasonData) => {
    try {
        const response = await axiosClient.put(`api/post/report-reasons/${id}`, reasonData);
        return response;
    } catch (error) {
        console.error('Lỗi khi cập nhật lý do báo cáo:', error);
        throw error;
    }
};

// Xóa lý do báo cáo
export const deleteReportReason = async (id) => {
    try {
        const response = await axiosClient.delete(`api/post/report-reasons/${id}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi xóa lý do báo cáo:', error);
        throw error;
    }
};

// Báo cáo bài viết
export const reportPost = async (reportData) => {
    try {
        const response = await axiosClient.post('api/post/post-reports', reportData);
        return response;
    } catch (error) {
        console.error('Lỗi khi báo cáo bài viết:', error);
        throw error;
    }
};

// Tạo bài đăng tuyển dụng thực tập
export const createInternshipPost = async (internshipData) => {
    try {
        const response = await axiosClient.post('api/post/create-internship-post', internshipData);
        return response;
    } catch (error) {
        console.error('Lỗi khi tạo bài đăng tuyển dụng:', error);
        throw error;
    }
};

// Lấy feed của startup
export const getStartupFeed = async (startupId, page = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/post/startup-feeds/${startupId}?page=${page}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy feed của startup:', error);
        throw error;
    }
};

// Lấy thống kê tương tác hàng ngày của startup
export const getStartupDailyStats = async (startupId) => {
    try {
        const response = await axiosClient.get(`api/post/startup/${startupId}/interactions/daily`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy thống kê tương tác của startup:', error);
        throw error;
    }
};

// Lấy các bài viết đã lên lịch
export const getScheduledPosts = async () => {
    try {
        const response = await axiosClient.get('api/post/scheduled');
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy các bài viết đã lên lịch:', error);
        throw error;
    }
};

// Đăng bài viết đã lên lịch
export const publishPost = async (postId) => {
    try {
        const response = await axiosClient.put(`api/post/publish/${postId}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi đăng bài viết đã lên lịch:', error);
        throw error;
    }
};

// Cập nhật trạng thái bài đăng tuyển dụng
export const updateInternshipPostStatus = async (internshipPostId) => {
    try {
        const response = await axiosClient.put(`api/post/update-internshippost-status?internshipPostId=${internshipPostId}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái bài đăng tuyển dụng:', error);
        throw error;
    }
};

// Nộp CV ứng tuyển
export const applyCv = async (cvData) => {
    try {
        const response = await axiosClient.post('api/post/apply-cv', cvData, {
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
export const getCvsByStartup = async (startupId, page = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/post/candidateCv/${startupId}?page=${page}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách CV theo startup:', error);
        throw error;
    }
};

// Lấy bài viết theo ID của startup
export const getPostsByStartupId = async (startupId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/post/GetPostsByStartupId?startupId=${startupId}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy bài viết của startup:', error);
        throw error;
    }
};

// Lấy tất cả bài đăng tuyển dụng thực tập
export const getAllInternshipPosts = async (startupId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/post/GetAllInternshipPosts?startupid=${startupId}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy tất cả bài đăng tuyển dụng:', error);
        throw error;
    }
};

// Lấy chi tiết bài đăng tuyển dụng thực tập theo ID
export const getInternshipPostDetail = async (internshipPostId) => {
    try {
        const response = await axiosClient.get(`api/post/internshippost/${internshipPostId}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết bài đăng tuyển dụng:', error);
        throw error;
    }
};

// Cập nhật  bài đăng tuyển dụng
export const updateInternshipPost = async (internshipPostId, updateData) => {
    try {
        const response = await axiosClient.put(`api/post/internshippost/${internshipPostId}`, updateData);
        return response;
    } catch (error) {
        console.error('Lỗi khi cập nhật bài đăng tuyển dụng:', error);
        throw error;
    }
};

// Tìm kiếm bài viết theo startupId
export const searchStartupPosts = async (startupId, keyword = '', pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/post/search-startup-posts?startupId=${startupId}&keyword=${encodeURIComponent(keyword)}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi tìm kiếm bài viết của startup:', error);
        throw error;
    }
};

// Tìm kiếm bài đăng tuyển dụng theo startupId
export const searchStartupInternshipPosts = async (startupId, keyword = '', pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/post/search-startup-internship-post?startupId=${startupId}&keyword=${encodeURIComponent(keyword)}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
        return response;
    } catch (error) {
        console.error('Lỗi khi tìm kiếm bài tuyển dụng của startup:', error);
        throw error;
    }
};
