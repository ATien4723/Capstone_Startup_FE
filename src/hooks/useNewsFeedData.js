import { useState, useEffect, useRef, useCallback } from 'react';
import { getNewFeed, getPostLikeCount, getPostCommentCount, isPostLiked, likePost, unlikePost } from '@/apis/postService';
import { toast } from 'react-toastify';

export const useNewsFeedData = (currentUserId) => {
    const [posts, setPosts] = useState([]);
    const [postLikes, setPostLikes] = useState({});
    const [userLikedPosts, setUserLikedPosts] = useState({});
    const [postCommentCounts, setPostCommentCounts] = useState({});
    const [openCommentPosts, setOpenCommentPosts] = useState([]);
    const [refreshCommentTrigger, setRefreshCommentTrigger] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observer = useRef();
    const pageSize = 10;

    // Hàm fetch posts với phân trang
    const fetchPosts = async (page) => {
        try {
            const response = await getNewFeed(currentUserId, page, pageSize);
            let items = [];
            if (Array.isArray(response)) {
                items = response;
            } else if (response && Array.isArray(response.items)) {
                items = response.items;
            }
            if (page === 1) {
                setPosts(items);
            } else {
                setPosts(prevPosts => [...prevPosts, ...items]);
            }
            setHasMore(items.length === pageSize);
        } catch (error) {
            console.error('Error fetching posts:', error);
            if (error.response && error.response.status === 404) {
                console.log('No posts found for this user');
            }
            setHasMore(false);
            if (page === 1) {
                setPosts([]);
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (currentUserId) {
            if (pageNumber === 1) {
                fetchPosts(1);
            } else {
                fetchPosts(pageNumber);
            }
        }
    }, [pageNumber, currentUserId]);

    useEffect(() => {
        const fetchPostDetails = async () => {
            if (posts && posts.length > 0) {
                for (const post of posts) {
                    try {
                        const likeCount = await getPostLikeCount(post.postId);
                        setPostLikes(prev => ({
                            ...prev,
                            [post.postId]: likeCount
                        }));

                        const likeData = {
                            postId: post.postId,
                            accountId: currentUserId
                        };
                        const isLiked = await isPostLiked(likeData);
                        setUserLikedPosts(prev => ({
                            ...prev,
                            [post.postId]: !!isLiked
                        }));

                        const commentCount = await getPostCommentCount(post.postId);
                        setPostCommentCounts(prev => ({
                            ...prev,
                            [post.postId]: commentCount
                        }));
                    } catch (error) {
                        console.error('Error fetching post details:', error);
                    }
                }
            }
        };
        fetchPostDetails();
    }, [posts, currentUserId]);

    const loadMorePosts = useCallback(() => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        setPageNumber(prev => prev + 1);
    }, [isLoadingMore, hasMore]);

    const handleLikePost = async (postId) => {
        try {
            const likeData = {
                postId,
                accountId: currentUserId
            };
            const isLiked = await isPostLiked(likeData);
            if (isLiked) {
                await unlikePost(likeData);
                setUserLikedPosts(prev => ({ ...prev, [postId]: false }));
            } else {
                await likePost(likeData);
                setUserLikedPosts(prev => ({ ...prev, [postId]: true }));
            }
            const likeCount = await getPostLikeCount(postId);
            setPostLikes(prev => ({
                ...prev,
                [postId]: likeCount
            }));
            setRefreshCommentTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error updating like:', error);
            toast.error('Không thể cập nhật trạng thái thích');
        }
    };

    const toggleCommentSection = (postId) => {
        setOpenCommentPosts(prev => {
            const isOpen = prev.includes(postId);
            if (isOpen) {
                return prev.filter(id => id !== postId);
            } else {
                return [...prev, postId];
            }
        });
    };

    const handleCommentCountChange = (postId, newCount) => {
        setPostCommentCounts(prev => ({
            ...prev,
            [postId]: newCount
        }));
        setRefreshCommentTrigger(prev => prev + 1);
    };

    return {
        posts,
        setPosts,
        postLikes,
        userLikedPosts,
        postCommentCounts,
        openCommentPosts,
        refreshCommentTrigger,
        pageNumber,
        hasMore,
        isLoading,
        isLoadingMore,
        observer,
        loadMorePosts,
        handleLikePost,
        toggleCommentSection,
        handleCommentCountChange,
        fetchPosts
    };
}; 