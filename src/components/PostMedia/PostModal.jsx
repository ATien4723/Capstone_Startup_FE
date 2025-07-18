import React, { useEffect, useState, useContext } from 'react';
import { getPostById, getPostLikeCount, getPostCommentCount, isPostLiked, likePost, unlikePost } from '@/apis/postService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faComment, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import PostMediaGrid from './PostMediaGrid';
import CommentSection from '@/components/CommentSection/CommentSection';
import { getUserId } from '@/apis/authService';
import { InteractionContext } from '@/contexts/InteractionContext.jsx';
import { formatPostTime } from '@/utils/dateUtils';

const PostModal = ({ postId, onClose }) => {
    const [post, setPost] = useState(null);
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const currentUserId = getUserId();
    const { triggerLike, triggerComment } = useContext(InteractionContext);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const postRes = await getPostById(postId);
                setPost(postRes);
                const likeRes = await getPostLikeCount(postId);
                setLikeCount(likeRes);
                const commentRes = await getPostCommentCount(postId);
                setCommentCount(commentRes);
                const liked = await isPostLiked({ postId, accountId: currentUserId });
                setIsLiked(!!liked);
            } catch (err) {
                setPost(null);
            } finally {
                setLoading(false);
            }
        };
        if (postId) fetchData();
    }, [postId, currentUserId]);

    const handleLike = async () => {
        try {
            if (isLiked) {
                await unlikePost({ postId, accountId: currentUserId });
                setIsLiked(false);
                setLikeCount((prev) => prev - 1);
            } else {
                await likePost({ postId, accountId: currentUserId });
                setIsLiked(true);
                setLikeCount((prev) => prev + 1);
            }
            triggerLike();
        } catch (err) { }
    };

    const handleCommentCountChange = (newCount) => {
        setCommentCount(newCount);
        triggerComment();
    };

    if (!postId || !post) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg w-full max-w-xl shadow-lg relative p-6 max-h-[90vh] overflow-auto">
                <button className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700" onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div>
                        <div className="flex gap-3 items-center mb-3">
                            <img
                                src={post.avatarURL || post.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <div className="font-semibold text-black">{post.name || post.fullName || post.firstName || 'Unknown User'}</div>
                                <div className="text-xs text-gray-500">{formatPostTime(post.createdAt || post.createAt)}</div>
                            </div>
                        </div>
                        {post.title && <div className="font-bold mb-2">{post.title}</div>}
                        <div className="mb-3 text-gray-800 whitespace-pre-wrap break-words">{post.content}</div>
                        {post.postMedia && post.postMedia.length > 0 && (
                            <PostMediaGrid media={post.postMedia} />
                        )}
                        <div className="flex justify-between items-center mt-3 mb-2 px-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <button className="flex items-center gap-1" onClick={handleLike}>
                                    <FontAwesomeIcon icon={isLiked ? faHeart : farHeart} className={isLiked ? 'text-red-500' : ''} />
                                    <span>{likeCount}</span>
                                </button>
                            </div>
                            <div className="text-sm text-gray-600">
                                <button onClick={() => setShowComments((v) => !v)}>
                                    <FontAwesomeIcon icon={faComment} className="mr-1" />
                                    {commentCount} bình luận
                                </button>
                            </div>
                        </div>
                        {showComments && (
                            <div className="px-2 pb-2">
                                <CommentSection
                                    postId={postId}
                                    isOpen={true}
                                    onToggle={() => setShowComments(false)}
                                    commentCount={commentCount}
                                    currentUserAvatar={post.avatarUrl}
                                    refreshTrigger={0}
                                    onCommentCountChange={handleCommentCountChange}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostModal; 