import { useState, useEffect, useCallback } from 'react';
import { getStartupFeed, likePost, unlikePost, isPostLiked, getPostLikeCount, getPostCommentCount } from '@/apis/postService';
import { formatVietnameseDate } from '@/utils/dateUtils';
import { getStartupIdByAccountId, getStartupMembers } from '@/apis/startupService';
import { getUserId } from '@/apis/authService';
import { getAccountInfo } from '@/apis/accountService';

export const useStartupDetail = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [startupId, setStartupId] = useState(null);

    // State cho bài đăng từ startup feed
    const [feedPosts, setFeedPosts] = useState([]);
    const [loadingFeed, setLoadingFeed] = useState(false);
    const [isLoadingMoreFeed, setIsLoadingMoreFeed] = useState(false);
    const [hasMoreFeed, setHasMoreFeed] = useState(true);
    const [feedPageNumber, setFeedPageNumber] = useState(1);
    const pageSize = 10;

    // State cho việc xử lý like, comment, share
    const [postLikes, setPostLikes] = useState({});
    const [userLikedPosts, setUserLikedPosts] = useState({});
    const [postCommentCounts, setPostCommentCounts] = useState({});
    const [openCommentPosts, setOpenCommentPosts] = useState([]);
    const [refreshCommentTrigger, setRefreshCommentTrigger] = useState(false);
    const [profileData, setProfileData] = useState(null);

    // State cho danh sách thành viên
    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Lấy startupId từ API dựa trên accountId hiện tại
    useEffect(() => {
        const fetchStartupIdFromApi = async () => {
            try {
                const accountId = await getUserId();
                if (accountId) {
                    const response = await getStartupIdByAccountId(accountId);
                    if (response) {
                        setStartupId(response);
                        console.log('Đã lấy startupId từ API:', response);
                    } else {
                        console.log('Không tìm thấy startupId cho accountId:', accountId);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy startupId từ API:', error);
            }
        };

        fetchStartupIdFromApi();
    }, []);

    // Lấy thông tin profile người dùng
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const userId = await getUserId();
                if (userId) {
                    const userProfile = await getAccountInfo(userId);
                    if (userProfile) {
                        setProfileData(userProfile);
                        console.log('Đã lấy thông tin profile:', userProfile);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy thông tin profile:', error);
            }
        };

        fetchProfileData();
    }, []);

    // Lấy danh sách thành viên từ API
    const fetchTeamMembers = useCallback(async () => {
        if (!startupId) return;

        setLoadingMembers(true);
        try {
            const response = await getStartupMembers(startupId);
            if (response) {
                const members = Array.isArray(response) ? response : (response?.data || []);
                console.log('Đã lấy danh sách thành viên:', members);
                setTeamMembers(members);
            } else {
                console.log('Không có dữ liệu thành viên');
                setTeamMembers([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách thành viên:', error);
            setTeamMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    }, [startupId]);

    // Fetch danh sách bài đăng từ startup feed
    const fetchStartupFeed = async (page = 1) => {
        if (!startupId) return;

        try {
            const loading = page === 1 ? setLoadingFeed : setIsLoadingMoreFeed;
            loading(true);

            const response = await getStartupFeed(startupId, page, pageSize);

            if (response && response.items) {
                if (page === 1) {
                    setFeedPosts(response.items);
                } else {
                    setFeedPosts(prev => [...prev, ...response.items]);
                }

                // Kiểm tra xem còn dữ liệu để tải không
                setHasMoreFeed(response.items.length === pageSize);

                // Cập nhật thông tin like của các bài viết
                const currentUserId = await getUserId();
                for (const post of response.items) {
                    // Chỉ lấy thông tin like cho các bài viết không phải Internship
                    if (post.postId && post.type !== 'Internship') {
                        fetchPostLikes(post.postId, currentUserId);
                        fetchPostComments(post.postId);
                    }
                }
            } else {
                console.error('Cấu trúc dữ liệu không như mong đợi:', response);
                if (page === 1) {
                    setFeedPosts([]);
                }
                setHasMoreFeed(false);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách bài đăng từ startup:', error);
            if (page === 1) {
                setFeedPosts([]);
            }
            setHasMoreFeed(false);
        } finally {
            if (page === 1) {
                setLoadingFeed(false);
            } else {
                setIsLoadingMoreFeed(false);
            }
        }
    };

    // Lấy thông tin like của bài viết
    const fetchPostLikes = async (postId, currentUserId) => {
        try {
            // Lấy số lượng like
            const likeCount = await getPostLikeCount(postId);
            setPostLikes(prev => ({ ...prev, [postId]: likeCount || 0 }));

            // Kiểm tra xem người dùng hiện tại đã like bài viết chưa
            const isLiked = await isPostLiked({ postId, accountId: currentUserId });
            setUserLikedPosts(prev => ({ ...prev, [postId]: !!isLiked }));
        } catch (error) {
            console.error('Lỗi khi lấy thông tin like:', error);
        }
    };

    // Lấy số lượng comment của bài viết
    const fetchPostComments = async (postId) => {
        try {
            // Giả sử có API getPostCommentCount từ postService
            // Nếu chưa có, bạn cần thêm API này
            const commentCount = await getPostCommentCount(postId);
            setPostCommentCounts(prev => ({ ...prev, [postId]: commentCount }));
        } catch (error) {
            console.error('Lỗi khi lấy số lượng comment:', error);
        }
    };

    // Xử lý like bài viết
    const handleLikePost = async (postId) => {
        try {
            const likeData = {
                postId,
                accountId: await getUserId()
            };

            // Kiểm tra trạng thái like hiện tại
            const isLiked = await isPostLiked(likeData);

            if (isLiked) {
                // Nếu đã like, thực hiện unlike
                await unlikePost(likeData);
                setUserLikedPosts(prev => ({ ...prev, [postId]: false }));
            } else {
                // Nếu chưa like, thực hiện like
                await likePost(likeData);
                setUserLikedPosts(prev => ({ ...prev, [postId]: true }));
            }

            // Sau khi like/unlike, cập nhật lại số lượng like từ backend
            const likeCount = await getPostLikeCount(postId);
            setPostLikes(prev => ({
                ...prev,
                [postId]: likeCount
            }));

            // Kích hoạt tải lại bình luận
            setRefreshCommentTrigger(prev => !prev);
        } catch (error) {
            console.error('Error liking/unliking post:', error);
            // Lấy lại thông tin like nếu có lỗi
            const currentUserId = await getUserId();
            fetchPostLikes(postId, currentUserId);
        }
    };

    // Xử lý comment section
    const toggleCommentSection = (postId) => {
        setOpenCommentPosts(prev => {
            const isOpen = prev.includes(postId);
            if (isOpen) {
                return prev.filter(id => id !== postId);
            } else {
                setRefreshCommentTrigger(prev => !prev);
                return [...prev, postId];
            }
        });
    };

    // Cập nhật số lượng comment
    const handleCommentCountChange = (postId, count) => {
        setPostCommentCounts(prev => ({ ...prev, [postId]: count }));
    };

    // Xử lý chia sẻ bài viết
    const handleSharePost = (post) => {
        // Chức năng này sẽ được xử lý bởi SharePostModal trong component
        return post;
    };

    // Tải thêm bài đăng từ feed
    const loadMoreFeed = useCallback(() => {
        if (isLoadingMoreFeed || !hasMoreFeed) return;
        setIsLoadingMoreFeed(true);
        setFeedPageNumber(prev => prev + 1);
    }, [isLoadingMoreFeed, hasMoreFeed]);

    // Gọi API lấy feed posts khi feedPageNumber hoặc startupId thay đổi
    useEffect(() => {
        if (startupId && activeTab === 'posts') {
            if (feedPageNumber === 1) {
                fetchStartupFeed(1);
            } else {
                fetchStartupFeed(feedPageNumber);
            }
        }
    }, [feedPageNumber, startupId, activeTab]);

    // Gọi API khi tab được chọn
    useEffect(() => {
        if (activeTab === 'posts' && startupId) {
            // Reset và fetch lại dữ liệu khi chuyển tab
            setFeedPageNumber(1);
            fetchStartupFeed(1);
        } else if (activeTab === 'team' && startupId) {
            // Lấy danh sách thành viên khi chọn tab team
            fetchTeamMembers();
        }
    }, [activeTab, startupId, fetchTeamMembers]);

    // Format date using dateUtils
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return formatVietnameseDate(dateString);
        } catch (error) {
            return dateString;
        }
    };

    return {
        // States
        activeTab,
        feedPosts,
        loadingFeed,
        isLoadingMoreFeed,
        hasMoreFeed,
        teamMembers,
        loadingMembers,
        postLikes,
        userLikedPosts,
        postCommentCounts,
        openCommentPosts,
        refreshCommentTrigger,
        profileData,

        // Actions/Methods
        setActiveTab,
        loadMoreFeed,
        formatDate,
        handleLikePost,
        toggleCommentSection,
        handleCommentCountChange,
        handleSharePost,
        fetchStartupFeed,
        fetchTeamMembers
    };
};

export default useStartupDetail; 