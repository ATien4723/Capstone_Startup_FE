import { useState, useEffect, useRef, useCallback } from 'react';
import { getAccountInfo, getFollowing, getFollowers, checkIsFollowing, followUser, unfollowUser, updateBio, updateProfile, recommendAccounts } from '@/apis/accountService';
import { getUserId } from "@/apis/authService";
import {
    getPostsByAccountId,
    getPostLikeCount,
    getPostCommentCount,
    isPostLiked,
    likePost,
    unlikePost,
    createPost,
    updatePost,
    deletePost,
    hidePost
} from '@/apis/postService';
import { toast } from 'react-toastify';

// Hook lấy thông tin profile
export const useProfileData = (profileId) => {
    const [profileData, setProfileData] = useState(null);
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [currentUserData, setCurrentUserData] = useState(null);
    const currentUserId = getUserId();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        gender: '',
        dob: '',
        address: '',
        phoneNumber: '',
        avatarUrl: '',
        introTitle: '',
        position: '',
        workplace: '',
        facebookUrl: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        country: '',
    });

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                const [accountInfo, followingData, followersData, currentUserInfo] = await Promise.all([
                    getAccountInfo(profileId),
                    getFollowing(profileId),
                    getFollowers(profileId),
                    getAccountInfo(currentUserId)
                ]);

                if (!accountInfo || !currentUserInfo) {
                    toast.error('Failed to load profile data');
                    setIsLoading(false);
                    return;
                }

                setProfileData(accountInfo);
                setCurrentUserData(currentUserInfo);
                setFollowing(followingData || []);
                setFollowers(followersData || []);

                // Cập nhật formData từ dữ liệu profile
                setFormData({
                    firstName: accountInfo?.firstName || '',
                    lastName: accountInfo?.lastName || '',
                    gender: accountInfo?.gender || '',
                    dob: accountInfo?.dob || '',
                    address: accountInfo?.address || '',
                    phoneNumber: accountInfo?.phoneNumber || '',
                    avatarUrl: accountInfo?.avatarUrl || '',
                    introTitle: accountInfo?.introTitle || '',
                    position: accountInfo?.position || '',
                    workplace: accountInfo?.workplace || '',
                    facebookUrl: accountInfo?.facebookUrl || '',
                    linkedinUrl: accountInfo?.linkedinUrl || '',
                    githubUrl: accountInfo?.githubUrl || '',
                    portfolioUrl: accountInfo?.portfolioUrl || '',
                    country: accountInfo?.country || '',
                });

                // Kiểm tra trạng thái follow nếu không phải profile của chính mình
                if (currentUserId !== profileId) {
                    const status = await checkIsFollowing(currentUserId, profileId);
                    setIsFollowing(status?.isFollowing ?? false);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
                toast.error('Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        if (profileId) {
            fetchProfileData();
        }
    }, [profileId, currentUserId]);

    // Hàm xử lý follow/unfollow
    const handleFollowToggle = async () => {
        if (followLoading) return;

        try {
            setFollowLoading(true);

            if (currentUserId === profileId) {
                toast.warning("Bạn không thể theo dõi chính mình");
                return;
            }

            if (isFollowing) {
                // Gọi API unfollow
                await unfollowUser(currentUserId, profileId);
                setIsFollowing(false);
                toast.success(`Đã hủy theo dõi ${profileData.firstName} ${profileData.lastName}`);

                // Refetch lại danh sách followers từ server
                const updatedFollowers = await getFollowers(profileId);
                setFollowers(updatedFollowers || []);
            } else {
                // Gọi API follow
                await followUser(currentUserId, profileId);
                setIsFollowing(true);
                toast.success(`Đã theo dõi ${profileData.firstName} ${profileData.lastName}`);

                // Refetch lại danh sách followers từ server
                const updatedFollowers = await getFollowers(profileId);
                setFollowers(updatedFollowers || []);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            toast.error('Không thể thực hiện thao tác. Vui lòng thử lại sau.');
        } finally {
            setFollowLoading(false);
        }
    };

    // Hàm cập nhật bio
    const handleUpdateBio = async () => {
        try {
            const bioFields = {
                introTitle: formData.introTitle,
                position: formData.position,
                workplace: formData.workplace,
                facebookUrl: formData.facebookUrl,
                linkedinUrl: formData.linkedinUrl,
                githubUrl: formData.githubUrl,
                portfolioUrl: formData.portfolioUrl,
                country: formData.country
            };

            const updatedProfile = await updateBio(profileId, bioFields);
            setProfileData(updatedProfile);
            toast.success('Bio updated successfully');
            return true;
        } catch (error) {
            toast.error('Failed to update bio');
            return false;
        }
    };

    // Hàm cập nhật cover image (backgroundUrl)
    const handleUpdateCover = async (file) => {
        try {
            const formData = new FormData();
            formData.append('backgroundUrl', file);
            const updatedProfile = await updateProfile(profileId, formData);
            setProfileData(updatedProfile);
            toast.success('Cập nhật cover thành công');
            return true;
        } catch (error) {
            toast.error('Cập nhật cover thất bại');
            return false;
        }
    };

    return {
        profileData,
        following,
        followers,
        isLoading,
        isFollowing,
        followLoading,
        currentUserData,
        currentUserId,
        formData,
        setFormData,
        handleFollowToggle,
        handleUpdateBio,
        handleUpdateCover
    };
};

// Hook quản lý bài viết
export const usePostsData = (accountId, currentUserId) => {
    const [posts, setPosts] = useState([]);
    const [postLikes, setPostLikes] = useState({});
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
            const response = await getPostsByAccountId(accountId, page, pageSize);
            if (response && response.items) {
                if (page === 1) {
                    setPosts(response.items);
                } else {
                    setPosts(prevPosts => [...prevPosts, ...response.items]);
                }
                setHasMore(response.items.length === pageSize);
            } else {
                if (page === 1) {
                    setPosts([]);
                }
                setHasMore(false);
            }
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

    // Fetch posts khi component mount hoặc pageNumber thay đổi
    useEffect(() => {
        if (accountId) {
            if (pageNumber === 1) {
                fetchPosts(1);
            } else {
                fetchPosts(pageNumber);
            }
        }
    }, [pageNumber, accountId]);

    // Lấy thông tin like và comment count cho mỗi bài viết
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
    }, [posts]);

    // Hàm load more posts
    const loadMorePosts = useCallback(() => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        setPageNumber(prev => prev + 1);
    }, [isLoadingMore, hasMore]);

    // Hàm xử lý thích/bỏ thích bài viết
    const handleLikePost = async (postId) => {
        try {
            const likeData = {
                postId,
                accountId: currentUserId
            };

            // Kiểm tra trạng thái like hiện tại
            const isLiked = await isPostLiked(likeData);

            if (isLiked) {
                // Nếu đã like, thực hiện unlike
                await unlikePost(likeData);
            } else {
                // Nếu chưa like, thực hiện like
                await likePost(likeData);
            }

            // Sau khi like/unlike, cập nhật lại số lượng like từ backend
            const likeCount = await getPostLikeCount(postId);
            setPostLikes(prev => ({
                ...prev,
                [postId]: likeCount
            }));

            // Kích hoạt tải lại bình luận
            setRefreshCommentTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error updating like:', error);
            toast.error('Không thể cập nhật trạng thái thích');
        }
    };

    // Hàm này để toggle comment section
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

    // Hàm xử lý khi số lượng comment thay đổi
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

// Hook quản lý tạo, sửa, xóa bài viết
export const usePostActions = (accountId, refreshPosts) => {
    const [showPostModal, setShowPostModal] = useState(false);
    const [newPost, setNewPost] = useState({ content: '', files: [] });
    const [postError, setPostError] = useState('');
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [editedPostContent, setEditedPostContent] = useState('');
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [openDropdownPostId, setOpenDropdownPostId] = useState(null);

    // Hàm toggle dropdown
    const toggleDropdown = (postId, isOpen) => {
        setOpenDropdownPostId(isOpen ? postId : null);
    };

    // Hàm xử lý tạo bài viết mới
    const handleCreatePost = async () => {
        try {
            setIsCreatingPost(true);
            setPostError(''); // Reset lỗi trước đó

            const formData = new FormData();
            formData.append('content', newPost.content);
            newPost.files.forEach(file => {
                formData.append('MediaFiles', file);
            });
            formData.append('accountId', accountId);

            // Hiển thị thông báo đang xử lý
            toast.info('Đang tạo bài viết...');

            // Tạo post mới
            await createPost(formData);

            // Reset form
            setNewPost({ content: '', files: [] });
            setShowPostModal(false);
            setPostError('');

            // Refresh posts
            refreshPosts(1);

            toast.success('Bài viết đã được tạo thành công');
            return true;
        } catch (error) {
            console.error('Error creating post:', error);

            // Xử lý lỗi từ API
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                if (status === 400 && errorData) {
                    setPostError(errorData.message || 'Bài viết vi phạm nguyên tắc cộng đồng');
                } else {
                    setPostError('Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại.');
                }
            } else {
                setPostError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
            }

            toast.error('Không thể tạo bài viết');
            return false;
        } finally {
            setIsCreatingPost(false);
        }
    };

    // Hàm xử lý upload file
    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        setNewPost(prev => ({
            ...prev,
            files: [...prev.files, ...files]
        }));
    };

    // Hàm xử lý hiển thị modal xóa
    const confirmDeletePost = (postId) => {
        setPostToDelete(postId);
        setShowDeleteConfirmModal(true);
    };

    // Hàm xóa bài viết
    const handleDeletePost = async () => {
        if (!postToDelete) return false;

        try {
            await deletePost(postToDelete);
            toast.success('Bài viết đã được xóa thành công');

            // Refresh posts sau khi xóa
            refreshPosts(1);

            return true;
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Không thể xóa bài viết. Vui lòng thử lại sau.');
            return false;
        } finally {
            setShowDeleteConfirmModal(false);
            setPostToDelete(null);
        }
    };

    // Hàm cập nhật bài viết
    const handleUpdatePost = async () => {
        if (!editingPost) return false;

        try {
            const content = editedPostContent || editingPost.content;

            if (!content.trim()) {
                toast.error('Nội dung bài viết không được để trống');
                return false;
            }

            const updatePostDTO = { content };
            await updatePost(editingPost.postId, updatePostDTO);

            // Refresh posts sau khi cập nhật
            refreshPosts(1);

            toast.success('Bài viết đã được cập nhật thành công');
            return true;
        } catch (error) {
            console.error('Error updating post:', error);
            toast.error('Không thể cập nhật bài viết. Vui lòng thử lại sau.');
            return false;
        } finally {
            setEditingPost(null);
            setEditedPostContent('');
        }
    };

    // Hàm ẩn bài viết
    const handleHidePost = async (postId) => {
        try {
            await hidePost(accountId, postId);

            // Refresh posts sau khi ẩn
            refreshPosts(1);

            toast.success('Post hidden successfully');
            return true;
        } catch (error) {
            console.error('Error hiding post:', error);
            toast.error('Failed to hide post. Please try again.');
            return false;
        }
    };

    return {
        showPostModal,
        setShowPostModal,
        newPost,
        setNewPost,
        postError,
        isCreatingPost,
        editingPost,
        setEditingPost,
        editedPostContent,
        setEditedPostContent,
        showDeleteConfirmModal,
        setShowDeleteConfirmModal,
        postToDelete,
        openDropdownPostId,
        handleCreatePost,
        handleFileUpload,
        toggleDropdown,
        confirmDeletePost,
        handleDeletePost,
        handleUpdatePost,
        handleHidePost
    };
};

// Hook quản lý trạng thái UI
export const useUIStates = () => {
    const [activeButton, setActiveButton] = useState('all');
    const [previousActiveButton, setPreviousActiveButton] = useState('all');
    const [editBio, setEditBio] = useState(false);

    // Hàm chuyển đổi tab
    const handleTabChange = (tab) => {
        if (tab === 'bio') {
            setPreviousActiveButton(activeButton);
            setEditBio(true);
        }
        setActiveButton(tab);
    };

    // Hàm đóng modal bio và quay lại tab trước đó
    const handleCloseBioModal = () => {
        setEditBio(false);
        setActiveButton(previousActiveButton);
    };

    return {
        activeButton,
        previousActiveButton,
        editBio,
        setEditBio,
        handleTabChange,
        handleCloseBioModal
    };
};

// Hook quản lý infinite scroll
export const useInfiniteScroll = (loadMoreCallback, hasMore, isLoading) => {
    const observer = useRef();

    const lastElementRef = useCallback(node => {
        if (isLoading) return;

        if (observer.current) {
            observer.current.disconnect();
        }

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreCallback();
            }
        });

        if (node) {
            observer.current.observe(node);
        }
    }, [isLoading, hasMore, loadMoreCallback]);

    return { lastElementRef };
};

// Hook kiểm tra trạng thái follow giữa 2 user
export const useCheckIsFollowing = (currentUserId, profileId, trigger = 0) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            if (!currentUserId || !profileId || currentUserId === profileId) {
                setIsFollowing(false);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const status = await checkIsFollowing(currentUserId, profileId);
                setIsFollowing(status?.isFollowing ?? false);
            } catch (error) {
                setIsFollowing(false);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStatus();
    }, [currentUserId, profileId, trigger]);

    return { isFollowing, isLoading };
};

// Hook lấy danh sách tài khoản gợi ý kết nối
export const useRecommendAccounts = (currentUserId, pageNumber = 1, pageSize = 10) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await recommendAccounts(currentUserId, pageNumber, pageSize);
            setData(res.items || res.data || []);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUserId) {
            fetchData();
        }
    }, [currentUserId, pageNumber, pageSize]);

    return { data, isLoading, error, refetch: fetchData };
}; 