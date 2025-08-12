import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHeart, faEllipsisV, faReply, faTrash, faPencilAlt, faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart, faComment as farComment } from '@fortawesome/free-regular-svg-icons';
import { toast } from 'react-toastify';
import { getRelativeTime } from '@/utils/dateUtils';
import { getUserId } from "@/apis/authService";
import {
    createPostComment,
    getPostCommentsByPostId,
    getPostChildComments,
    updatePostComment,
    deletePostComment,
    likeComment,
    unlikeComment,
    getCommentLikeCount
} from '@/apis/postService';

const CommentSection = ({
    postId,
    isOpen,
    onToggle,
    commentCount,
    currentUserAvatar,
    refreshTrigger = 0,
    onCommentCountChange
}) => {
    const [comments, setComments] = useState([]);
    const [commentContent, setCommentContent] = useState('');
    const [editingComment, setEditingComment] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [replyingToComment, setReplyingToComment] = useState(null);
    const [commentLikes, setCommentLikes] = useState({});
    const [showChildComments, setShowChildComments] = useState({});
    const [childComments, setChildComments] = useState({});
    const [childCommentContents, setChildCommentContents] = useState({});
    const [replyingToChildComment, setReplyingToChildComment] = useState(null);
    const [commentReplyCounts, setCommentReplyCounts] = useState({});
    const [childReplyCounts, setChildReplyCounts] = useState({});
    const [showChildReplies, setShowChildReplies] = useState({});
    const [childReplies, setChildReplies] = useState({});
    // Thêm state để theo dõi bình luận đang được chỉnh sửa và phân biệt loại bình luận
    const [editingParentId, setEditingParentId] = useState(null);

    // Lấy danh sách bình luận khi component được mở hoặc refreshTrigger thay đổi
    useEffect(() => {
        // console.log(`[DEBUG] CommentSection useEffect - postId: ${postId}, isOpen: ${isOpen}, refreshTrigger: ${refreshTrigger}`);

        if (isOpen) {
            // console.log(`[DEBUG] CommentSection - Fetching comments for post ${postId}`);
            fetchComments();
        } else {
            // console.log(`[DEBUG] CommentSection - Not fetching comments because isOpen is false`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, postId, refreshTrigger]);

    // Lấy danh sách bình luận
    const fetchComments = async () => {
        try {
            console.log(`Fetching comments for post ${postId}`);
            const commentsData = await getPostCommentsByPostId(postId);
            console.log("Comments data received:", commentsData);

            // Kiểm tra cấu trúc dữ liệu trả về
            let commentsList = [];
            if (Array.isArray(commentsData)) {
                commentsList = commentsData;
            } else if (commentsData && Array.isArray(commentsData.items)) {
                commentsList = commentsData.items;
            }

            // Lọc ra các bình luận gốc (không có parentCommentId)
            const rootComments = commentsList.filter(comment => !comment.parentCommentId);
            console.log("Root comments:", rootComments);

            setComments(rootComments);

            // Lấy thông tin người dùng và số lượng phản hồi cho mỗi bình luận
            await Promise.all(rootComments.map(async (comment) => {
                if (comment && comment.postcommentId) {
                    // Lấy số lượng like cho bình luận
                    // const likeCount = await getCommentLikeCount(comment.postcommentId);
                    // setCommentLikes(prev => ({
                    //     ...prev,
                    //     [comment.postcommentId]: likeCount
                    // }));

                    // Lấy số lượng phản hồi
                    await fetchCommentReplyCount(comment.postcommentId);
                }
            }));
        } catch (error) {
            console.error('Lỗi khi lấy bình luận:', error);
            console.error('Chi tiết lỗi:', error.response || error.message);
            toast.error('Unable to fetch comments');
        }
    };

    // Lấy số lượng phản hồi cho một bình luận
    const fetchCommentReplyCount = async (commentId) => {
        try {
            const replies = await getPostChildComments(commentId);

            let replyCount = 0;
            if (Array.isArray(replies)) {
                replyCount = replies.length;
            } else if (replies && Array.isArray(replies.items)) {
                replyCount = replies.items.length;
            }

            setCommentReplyCounts(prev => ({
                ...prev,
                [commentId]: replyCount
            }));

            return replyCount;
        } catch (error) {
            console.error('Lỗi khi lấy số lượng phản hồi:', error);
            return 0;
        }
    };

    // Lấy bình luận con
    const fetchChildComments = async (parentCommentId) => {
        try {
            const childCommentsData = await getPostChildComments(parentCommentId);

            let comments = [];
            if (Array.isArray(childCommentsData)) {
                comments = childCommentsData;
            } else if (childCommentsData && Array.isArray(childCommentsData.items)) {
                comments = childCommentsData.items;
            }

            // Cập nhật state
            setChildComments(prev => ({
                ...prev,
                [parentCommentId]: comments
            }));

            // Lấy thông tin người dùng và số lượng phản hồi cho mỗi bình luận con
            if (comments && comments.length > 0) {
                await Promise.all(comments.map(async (comment) => {
                    if (comment && comment.postcommentId) {
                        // Lấy số lượng like cho bình luận con
                        // const likeCount = await getCommentLikeCount(comment.postcommentId);
                        // setCommentLikes(prev => ({
                        //     ...prev,
                        //     [comment.postcommentId]: likeCount
                        // }));

                        // Lấy số lượng phản hồi cho bình luận con
                        await fetchChildReplyCount(comment.postcommentId);
                    }
                }));
            }
        } catch (error) {
            console.error('Lỗi khi lấy bình luận con:', error);
            toast.error('Unable to fetch child comments');
        }
    };

    // Lấy số lượng phản hồi cho bình luận con
    const fetchChildReplyCount = async (childCommentId) => {
        try {
            const replies = await getPostChildComments(childCommentId);

            let replyCount = 0;
            if (Array.isArray(replies)) {
                replyCount = replies.length;
            } else if (replies && Array.isArray(replies.items)) {
                replyCount = replies.items.length;
            }

            setChildReplyCounts(prev => ({
                ...prev,
                [childCommentId]: replyCount
            }));

            return replyCount;
        } catch (error) {
            console.error('Lỗi khi lấy số lượng phản hồi cho bình luận con:', error);
            return 0;
        }
    };

    // Tạo bình luận mới
    const handleCreateComment = async () => {
        if (!commentContent.trim()) {
            toast.error('Please enter a comment');
            return;
        }

        try {
            const id = await getUserId();

            const commentData = {
                postId: postId,
                accountId: id,
                content: commentContent,
                parentCommentId: null
            };

            await createPostComment(commentData);
            toast.success('Comment added successfully');

            // Làm mới danh sách bình luận
            await fetchComments();

            // Xóa nội dung input
            setCommentContent('');

            // Cập nhật số lượng bình luận và thông báo lên component cha
            if (onCommentCountChange) {
                // Tính toán số lượng bình luận mới (số lượng hiện tại + 1)
                const newCommentCount = (commentCount || 0) + 1;
                onCommentCountChange(newCommentCount);
            }
        } catch (error) {
            toast.error('Unable to add comment');
            console.error('Lỗi khi tạo bình luận:', error);
        }
    };

    // Trả lời bình luận
    const handleReplyComment = async (commentId) => {
        const replyContent = childCommentContents[`${postId}-${commentId}`];

        if (!replyContent || !replyContent.trim()) {
            toast.error('Please enter a reply');
            return;
        }

        try {
            const id = await getUserId();

            const commentData = {
                postId: postId,
                accountId: id,
                content: replyContent,
                parentCommentId: commentId
            };

            await createPostComment(commentData);
            toast.success('Reply added successfully');

            // Làm mới danh sách bình luận con
            await fetchChildComments(commentId);

            // Cập nhật số lượng phản hồi
            await fetchCommentReplyCount(commentId);

            // Đóng form trả lời và xóa nội dung
            setReplyingToComment(null);
            setChildCommentContents(prev => ({
                ...prev,
                [`${postId}-${commentId}`]: ''
            }));
        } catch (error) {
            toast.error('Unable to reply to comment');
            console.error('Lỗi khi trả lời bình luận:', error);
        }
    };

    // Cập nhật bình luận
    const handleUpdateComment = async (postcommentId) => {
        if (!editContent.trim()) {
            toast.error('Comment content cannot be empty');
            return;
        }

        try {
            await updatePostComment({ postcommentId: postcommentId, content: editContent });
            toast.success('Comment updated successfully');

            // Kiểm tra nếu là bình luận con
            if (editingParentId) {
                // Cập nhật lại danh sách bình luận con
                await fetchChildComments(editingParentId);
                setEditingParentId(null);
            } else if (childReplies[postcommentId]) {
                // Nếu là phản hồi của bình luận con
                await fetchChildReplies(postcommentId);
            } else {
                // Nếu là bình luận chính
                await fetchComments();
            }

            // Đóng form chỉnh sửa
            setEditingComment(null);
            setEditContent('');
        } catch (error) {
            toast.error('Unable to update comment');
            console.error('Lỗi khi cập nhật bình luận:', error);
        }
    };

    // Xóa bình luận
    const handleDeleteComment = async (commentId) => {
        try {
            await deletePostComment(commentId);
            toast.success('Comment deleted successfully');

            // Làm mới danh sách bình luận
            await fetchComments();
        } catch (error) {
            toast.error('Unable to delete comment');
            console.error('Lỗi khi xóa bình luận:', error);
        }
    };

    // Like/Unlike bình luận
    const handleLikeComment = async (commentId) => {
        try {
            const id = await getUserId();

            // Kiểm tra xem đã like chưa
            const isLiked = commentLikes[commentId] > 0;

            if (isLiked) {
                await unlikeComment(commentId, id);
                setCommentLikes(prev => ({
                    ...prev,
                    [commentId]: Math.max(0, (prev[commentId] || 0) - 1)
                }));
            } else {
                await likeComment(commentId, id);
                setCommentLikes(prev => ({
                    ...prev,
                    [commentId]: (prev[commentId] || 0) + 1
                }));
            }
        } catch (error) {
            toast.error('Unable to perform action');
            console.error('Lỗi khi like/unlike bình luận:', error);
        }
    };

    // Toggle hiển thị bình luận con
    const toggleChildComments = async (commentId) => {
        const isShowing = showChildComments[commentId];

        setShowChildComments(prev => ({
            ...prev,
            [commentId]: !isShowing
        }));

        if (!isShowing && !childComments[commentId]) {
            await fetchChildComments(commentId);
        }
    };

    // Hàm xử lý trả lời bình luận con
    const handleReplyToChildComment = async (childCommentId) => {
        const replyContent = childCommentContents[`${postId}-${childCommentId}`];

        if (!replyContent || !replyContent.trim()) {
            toast.error('Please enter a reply');
            return;
        }

        try {
            const id = await getUserId();
            console.log(`Đang trả lời bình luận con: postId=${postId}, childCommentId=${childCommentId}`);

            const commentData = {
                postId: postId,
                accountId: id,
                content: replyContent,
                parentCommentId: childCommentId // Sử dụng childCommentId làm parentCommentId để trả lời trực tiếp bình luận con
            };

            console.log('Dữ liệu gửi đi:', commentData);

            await createPostComment(commentData);
            toast.success('Reply added successfully');

            // Cập nhật lại danh sách phản hồi của bình luận con
            if (showChildReplies[childCommentId]) {
                fetchChildReplies(childCommentId);
            }

            // Cập nhật lại số lượng phản hồi cho bình luận con
            await fetchChildReplyCount(childCommentId);

            // Đóng form trả lời và xóa nội dung
            setReplyingToChildComment(null);
            setChildCommentContents(prev => ({
                ...prev,
                [`${postId}-${childCommentId}`]: ''
            }));
        } catch (error) {
            toast.error('Unable to reply to comment');
            console.error('Error replying to child comment:', error);
        }
    };

    // Thêm hàm mới để trả lời bình luận con nhưng gắn vào bình luận cha
    const handleReplyToChildWithParent = async (childComment, content) => {
        if (!content || !content.trim()) {
            toast.error('Comment content cannot be empty');
            return;
        }

        try {
            const id = await getUserId();
            // Lấy parentCommentId từ bình luận con
            const parentCommentId = childComment.parentCommentId;

            if (!parentCommentId) {
                toast.error('Không tìm thấy bình luận cha');
                return;
            }

            console.log(`Đang trả lời bình luận con: postId=${postId}, childCommentId=${childComment.postcommentId}`);
            console.log(`Sẽ gắn vào bình luận cha: parentCommentId=${parentCommentId}`);

            const commentData = {
                postId: postId,
                accountId: id,
                content: content,
                // Sử dụng parentCommentId của childComment làm parentCommentId
                parentCommentId: parentCommentId
            };

            console.log('Dữ liệu gửi đi (gắn vào bình luận cha):', commentData);

            await createPostComment(commentData);
            toast.success('Reply added successfully');

            // Cập nhật lại danh sách bình luận con của bình luận cha
            fetchChildComments(parentCommentId);

            // Cập nhật lại số lượng phản hồi cho bình luận cha
            await fetchCommentReplyCount(parentCommentId);

            // Đóng form trả lời và xóa nội dung
            setReplyingToChildComment(null);
            setChildCommentContents(prev => ({
                ...prev,
                [`${postId}-${childComment.postcommentId}`]: ''
            }));
        } catch (error) {
            toast.error('Unable to reply to comment');
            console.error('Error replying to child comment with parent:', error);
        }
    };

    // Hàm toggle hiển thị phản hồi của bình luận con
    const toggleChildReplies = async (childCommentId) => {
        setShowChildReplies(prev => {
            const newState = { ...prev };
            newState[childCommentId] = !newState[childCommentId];

            // Nếu mở ra, fetch phản hồi của bình luận con
            if (newState[childCommentId]) {
                fetchChildReplies(childCommentId);
            }
            // Không xóa dữ liệu khi ẩn phản hồi, chỉ ẩn hiển thị

            return newState;
        });
    };

    // Hàm lấy phản hồi của bình luận con
    const fetchChildReplies = async (childCommentId) => {
        try {
            console.log('Đang lấy phản hồi cho bình luận con ID:', childCommentId);
            const response = await getPostChildComments(childCommentId);

            // Xác định dữ liệu phản hồi
            let replies = [];
            if (Array.isArray(response)) {
                replies = response;
            } else if (response && Array.isArray(response.items)) {
                replies = response.items;
            }

            console.log('Phản hồi của bình luận con:', replies);

            // Cập nhật số lượng phản hồi
            setChildReplyCounts(prev => ({
                ...prev,
                [childCommentId]: replies.length
            }));

            setChildReplies(prev => ({
                ...prev,
                [childCommentId]: replies
            }));
        } catch (error) {
            console.error('Error fetching child replies:', error);
            setChildReplies(prev => ({
                ...prev,
                [childCommentId]: []
            }));
        }
    };

    // Component hiển thị số lượng phản hồi của bình luận con
    const GetChildReplyCount = ({ childCommentId }) => {
        const count = childReplyCounts[childCommentId] || 0;

        // Chỉ hiển thị nút khi có phản hồi
        if (count === 0) return null;

        return (
            <button
                className="hover:underline flex items-center gap-1"
                onClick={() => toggleChildReplies(childCommentId)}
            >
                {showChildReplies[childCommentId] ? 'Hide replies' : 'View replies'}
                <span className="ml-1 text-gray-500 font-normal">
                    ({count})
                </span>
            </button>
        );
    };

    // Hàm hiển thị form chỉnh sửa bình luận
    const renderEditForm = (commentId, content, parentId = null) => {
        return (
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={() => handleUpdateComment(commentId)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm"
                    >
                        Save
                    </button>
                    <button
                        onClick={() => {
                            setEditingComment(null);
                            setEditingParentId(null);
                            setEditContent('');
                        }}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={isOpen ? "block" : "hidden"}>
            {/* Debug info */}
            {/* <div className="text-xs text-gray-400 mb-2">
                Bài viết ID: {postId}, isOpen: {isOpen ? "true" : "false"}, comments: {comments.length}
            </div> */}

            {/* Comment Input */}
            <div className="flex items-start gap-3 mb-4">
                <img
                    src={currentUserAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-2 pl-4 pr-12 border text-black rounded-full focus:outline-none focus:border-blue-500 bg-gray-100"
                    />
                    <button
                        onClick={handleCreateComment}
                        disabled={!commentContent.trim()}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${commentContent.trim() ? 'text-blue-500' : 'text-gray-400'
                            } transition-colors duration-200`}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            </div>

            {/* Comments List */}
            <div className="max-h-96 overflow-y-auto mb-2">
                {Array.isArray(comments) && comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.postcommentId} className="flex gap-3 mb-5 group">
                            <img
                                src={comment?.accountInfor?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                alt="Avatar"
                                className="w-10 h-10 rounded-full mt-1"
                            />
                            <div className="flex-1">
                                {editingComment === comment.postcommentId ? (
                                    renderEditForm(comment.postcommentId, comment.content)
                                ) : (
                                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">
                                                {comment?.accountInfor?.fullName}
                                            </span>
                                        </div>
                                        <div className="text-gray-800 mb-2">{comment.content}</div>
                                        <div className="flex gap-4 text-xs text-gray-500">
                                            <span>{getRelativeTime(comment.commentAt)}</span>
                                            {/* <button
                                                className="hover:underline flex items-center gap-1"
                                                onClick={() => handleLikeComment(comment.postcommentId)}
                                            >
                                                <FontAwesomeIcon
                                                    icon={commentLikes[comment.postcommentId] ? faHeart : farHeart}
                                                    className={commentLikes[comment.postcommentId] ? 'text-red-500' : ''}
                                                />
                                                {commentLikes[comment.postcommentId] || 0}
                                            </button> */}
                                            <button
                                                className="hover:underline"
                                                onClick={() => {
                                                    setReplyingToComment(replyingToComment === comment.postcommentId ? null : comment.postcommentId);
                                                    setChildCommentContents(prev => ({
                                                        ...prev,
                                                        [`${postId}-${comment.postcommentId}`]: prev[`${postId}-${comment.postcommentId}`] || ''
                                                    }));
                                                }}
                                            >
                                                Reply
                                            </button>
                                            {/* Hiển thị nút xem phản hồi nếu có */}
                                            {commentReplyCounts[comment.postcommentId] > 0 && (
                                                <button
                                                    className="hover:underline"
                                                    onClick={() => toggleChildComments(comment.postcommentId)}
                                                >
                                                    {showChildComments[comment.postcommentId]
                                                        ? 'Hide replies'
                                                        : `View ${commentReplyCounts[comment.postcommentId]} replies`}
                                                </button>
                                            )}
                                            {/* Nút chỉnh sửa và xóa */}
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="text-gray-500 hover:text-blue-500 mr-2"
                                                    onClick={() => {
                                                        setEditingComment(comment.postcommentId);
                                                        setEditingParentId(null);
                                                        setEditContent(comment.content);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faPencilAlt} />
                                                </button>
                                                {/* <button
                                                    className="text-gray-500 hover:text-red-500"
                                                    onClick={() => handleDeleteComment(comment.postcommentId)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button> */}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Form trả lời bình luận */}
                                {replyingToComment === comment.postcommentId && (
                                    <div className="mt-2 flex gap-2">
                                        <img
                                            src={currentUserAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                            alt="Avatar"
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={childCommentContents[`${postId}-${comment.postcommentId}`] || ''}
                                                onChange={(e) =>
                                                    setChildCommentContents(prev => ({
                                                        ...prev,
                                                        [`${postId}-${comment.postcommentId}`]: e.target.value
                                                    }))
                                                }
                                                placeholder="Write a reply..."
                                                className="w-full p-2 pl-3 pr-12 border rounded-full text-sm focus:outline-none focus:border-blue-500 bg-gray-100"
                                            />
                                            <button
                                                onClick={() => handleReplyComment(comment.postcommentId)}
                                                disabled={!(childCommentContents[`${postId}-${comment.postcommentId}`] || '').trim()}
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${(childCommentContents[`${postId}-${comment.postcommentId}`] || '').trim()
                                                    ? 'text-blue-500'
                                                    : 'text-gray-400'
                                                    } transition-colors duration-200`}
                                            >
                                                <FontAwesomeIcon icon={faPaperPlane} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Hiển thị bình luận con */}
                                {showChildComments[comment.postcommentId] && childComments[comment.postcommentId] && (
                                    <div className="mt-3 pl-3 border-l-2 border-gray-200">
                                        {childComments[comment.postcommentId].map((childComment) => (
                                            <div key={childComment.postcommentId} className="flex gap-2 mb-3 group">
                                                <img
                                                    src={childComment?.accountInfor?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                    alt="Avatar"
                                                    className="w-8 h-8 rounded-full mt-1"
                                                />
                                                <div className="flex-1">
                                                    {editingComment === childComment.postcommentId ? (
                                                        renderEditForm(childComment.postcommentId, childComment.content, comment.postcommentId)
                                                    ) : (
                                                        <div className="bg-gray-100 rounded-2xl px-3 py-2">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-semibold text-gray-900 text-sm">
                                                                    {childComment?.accountInfor?.fullName}
                                                                </span>
                                                            </div>
                                                            <div className="text-gray-800 text-sm">{childComment.content}</div>
                                                            <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                                                <span>{getRelativeTime(childComment.commentAt)}</span>
                                                                <button
                                                                    className="hover:underline"
                                                                    onClick={() => handleLikeComment(childComment.postcommentId)}
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={commentLikes[childComment.postcommentId] ? faHeart : farHeart}
                                                                        className={`mr-1 ${commentLikes[childComment.postcommentId] ? 'text-red-500' : ''}`}
                                                                    />
                                                                    {commentLikes[childComment.postcommentId] || 0}
                                                                </button>
                                                                {/* Thêm nút trả lời bình luận con */}
                                                                <button
                                                                    className="hover:underline"
                                                                    onClick={() => {
                                                                        setReplyingToChildComment(replyingToChildComment === childComment.postcommentId ? null : childComment.postcommentId);
                                                                        setChildCommentContents(prev => ({
                                                                            ...prev,
                                                                            [`${postId}-${childComment.postcommentId}`]: prev[`${postId}-${childComment.postcommentId}`] || ''
                                                                        }));
                                                                    }}
                                                                >
                                                                    Reply
                                                                </button>
                                                                {/* Hiển thị số lượng phản hồi của bình luận con */}
                                                                <GetChildReplyCount childCommentId={childComment.postcommentId} />
                                                                {/* Nút chỉnh sửa và xóa */}
                                                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        className="text-gray-500 hover:text-blue-500 mr-2"
                                                                        onClick={() => {
                                                                            setEditingComment(childComment.postcommentId);
                                                                            setEditingParentId(comment.postcommentId);
                                                                            setEditContent(childComment.content);
                                                                        }}
                                                                    >
                                                                        <FontAwesomeIcon icon={faPencilAlt} />
                                                                    </button>
                                                                    {/* <button
                                                                        className="text-gray-500 hover:text-red-500"
                                                                        onClick={() => handleDeleteComment(childComment.postcommentId)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} />
                                                                    </button> */}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Form trả lời bình luận con - Đặt trong vòng lặp map để có thể truy cập childComment */}
                                                    {replyingToChildComment === childComment.postcommentId && (
                                                        <div className="mt-2 flex gap-2">
                                                            <img
                                                                src={currentUserAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                alt="Avatar"
                                                                className="w-8 h-8 rounded-full"
                                                            />
                                                            <div className="flex-1 relative">
                                                                <input
                                                                    type="text"
                                                                    value={childCommentContents[`${postId}-${childComment.postcommentId}`] || ''}
                                                                    onChange={(e) =>
                                                                        setChildCommentContents(prev => ({
                                                                            ...prev,
                                                                            [`${postId}-${childComment.postcommentId}`]: e.target.value
                                                                        }))
                                                                    }
                                                                    placeholder="Write a reply..."
                                                                    className="w-full p-2 pl-3 pr-16 border rounded-full text-sm focus:outline-none focus:border-blue-500 bg-gray-100"
                                                                />
                                                                <button
                                                                    onClick={() => handleReplyToChildComment(childComment.postcommentId)}
                                                                    disabled={!(childCommentContents[`${postId}-${childComment.postcommentId}`] || '').trim()}
                                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${(childCommentContents[`${postId}-${childComment.postcommentId}`] || '').trim()
                                                                        ? 'text-blue-500'
                                                                        : 'text-gray-400'
                                                                        } transition-colors duration-200`}
                                                                >
                                                                    <FontAwesomeIcon icon={faPaperPlane} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Hiển thị phản hồi của bình luận con */}
                                                    {showChildReplies[childComment.postcommentId] && (
                                                        <div className="mt-2 pl-3 border-l border-gray-200">
                                                            {childReplies[childComment.postcommentId] && childReplies[childComment.postcommentId].length > 0 ? (
                                                                childReplies[childComment.postcommentId].map((reply) => (
                                                                    <div key={reply.postcommentId} className="flex gap-2 mb-2 group">
                                                                        <img
                                                                            src={reply?.accountInfor?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                            alt="Avatar"
                                                                            className="w-6 h-6 rounded-full mt-1"
                                                                        />
                                                                        <div className="flex-1">
                                                                            {editingComment === reply.postcommentId ? (
                                                                                renderEditForm(reply.postcommentId, reply.content, childComment.postcommentId)
                                                                            ) : (
                                                                                <div className="bg-gray-100 rounded-2xl px-3 py-2">
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className="font-semibold text-gray-900 text-xs">
                                                                                            {reply?.accountInfor?.fullName}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="text-gray-800 text-xs">{reply.content}</div>
                                                                                    <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                                                                        <span>{getRelativeTime(reply.commentAt)}</span>
                                                                                        <button
                                                                                            className="hover:underline"
                                                                                            onClick={() => handleLikeComment(reply.postcommentId)}
                                                                                        >
                                                                                            <FontAwesomeIcon
                                                                                                icon={commentLikes[reply.postcommentId] ? faHeart : farHeart}
                                                                                                className={`mr-1 ${commentLikes[reply.postcommentId] ? 'text-red-500' : ''}`}
                                                                                            />
                                                                                            {commentLikes[reply.postcommentId] || 0}
                                                                                        </button>
                                                                                        {/* Thêm nút chỉnh sửa và xóa cho phản hồi của bình luận con */}
                                                                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            <button
                                                                                                className="text-gray-500 hover:text-blue-500 mr-2"
                                                                                                onClick={() => {
                                                                                                    setEditingComment(reply.postcommentId);
                                                                                                    setEditingParentId(childComment.postcommentId);
                                                                                                    setEditContent(reply.content);
                                                                                                }}
                                                                                            >
                                                                                                <FontAwesomeIcon icon={faPencilAlt} />
                                                                                            </button>
                                                                                            {/* <button
                                                                                                className="text-gray-500 hover:text-red-500"
                                                                                                onClick={() => handleDeleteComment(reply.postcommentId)}
                                                                                            >
                                                                                                <FontAwesomeIcon icon={faTrash} />
                                                                                            </button> */}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-center text-gray-500 py-1 text-xs">
                                                                    Loading replies...
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-4">
                        No comments yet. Be the first to comment!
                    </div>
                )}
            </div>

            {/* Comment Count */}
            <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-2">
                <div>
                    <FontAwesomeIcon icon={farComment} className="mr-2" />
                    {commentCount || comments.length} comments
                </div>
                <button
                    onClick={onToggle}
                    className="text-blue-500 hover:underline"
                >
                    {isOpen ? 'Hide comments' : 'View comments'}
                </button>
            </div>
        </div>
    );
};

export default CommentSection;







