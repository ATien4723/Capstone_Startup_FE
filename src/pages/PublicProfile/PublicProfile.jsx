import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faCamera, faMapMarkerAlt,
    faImage, faPaperclip, faEllipsisH, faFileAlt, faGlobe, faBriefcase,
    faHeart, faComment, faShareSquare, faSmile, faTrash,
    faUserPlus, faUserCheck, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faFacebook, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faHeart as farHeart, faComment as farComment, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getUserId } from "@/apis/authService";
import { getAccountInfo, getFollowing, getFollowers, updateBio, followUser, unfollowUser, checkIsFollowing } from '@/apis/accountService';
import {
    getPostsByAccountId,
    createPost,
    likePost,
    unlikePost,
    getPostLikeCount,
    getPostCommentCount,
    isPostLiked,
    updatePost,
    deletePost,
    hidePost
}
    from '@/apis/postService';
import { toast } from 'react-toastify';
import PostMediaGrid from '@/components/PostMedia/PostMediaGrid';
import CommentSection from '@/components/CommentSection/CommentSection';
import { formatPostTime } from '@/utils/dateUtils';

// Modal component
const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg w-full max-w-lg shadow-lg relative p-6">
            <button
                className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
                onClick={onClose}
            >
                &times;
            </button>
            {children}
        </div>
    </div>
);

const PublicProfile = () => {
    const { id } = useParams();
    const currentUserId = getUserId();
    const [showPostModal, setShowPostModal] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editBio, setEditBio] = useState(false);

    // Thêm state cho bài viết
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({
        content: '',
        files: []
    });
    const [postLikes, setPostLikes] = useState({});
    const [postCommentCounts, setPostCommentCounts] = useState({});
    const [openCommentPosts, setOpenCommentPosts] = useState([]);
    const [refreshCommentTrigger, setRefreshCommentTrigger] = useState(0);

    // Gộp formData
    const [formData, setFormData] = useState({
        // Profile fields
        firstName: '',
        lastName: '',
        gender: '',
        dob: '',
        address: '',
        phoneNumber: '',
        avatarUrl: '',
        // Bio fields
        introTitle: '',
        position: '',
        workplace: '',
        facebookUrl: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        country: '',
    });

    const [activeButton, setActiveButton] = useState('all');
    const [previousActiveButton, setPreviousActiveButton] = useState('all');
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observer = useRef();
    const pageSize = 10;

    const [openDropdownPostId, setOpenDropdownPostId] = useState({});
    const [editingPost, setEditingPost] = useState(null);
    const [editedPostContent, setEditedPostContent] = useState('');

    // Thêm state để theo dõi trạng thái follow
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // State cho xử lý lỗi trong modal
    const [postError, setPostError] = useState('');
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    //lay user trong comment
    const [currentUserData, setCurrentUserData] = useState(null);

    // Thêm state để quản lý modal xác nhận xóa
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);


    // Hàm xử lý follow/unfollow
    const handleFollowToggle = async () => {
        if (followLoading) return;

        try {
            setFollowLoading(true);

            // Lấy ID của người dùng hiện tại
            const currentUserId = await getUserId();

            if (currentUserId === id) {
                toast.warning("Bạn không thể theo dõi chính mình");
                return;
            }

            // Gọi API follow/unfollow
            if (isFollowing) {
                // Gọi API unfollow
                await unfollowUser(currentUserId, id);
                setIsFollowing(false);
                toast.success(`Đã hủy theo dõi ${profileData.firstName} ${profileData.lastName}`);

                // Cập nhật lại danh sách followers
                const updatedFollowers = followers.filter(f => f.accountId !== currentUserId);
                setFollowers(updatedFollowers);
            } else {
                // Gọi API follow
                await followUser(currentUserId, id);
                setIsFollowing(true);
                toast.success(`Đã theo dõi ${profileData.firstName} ${profileData.lastName}`);

                // Cập nhật lại danh sách followers
                const currentUserInfo = await getAccountInfo(currentUserId);
                if (currentUserInfo) {
                    setFollowers(prev => [...prev, currentUserInfo]);
                }
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            toast.error('Không thể thực hiện thao tác. Vui lòng thử lại sau.');
        } finally {
            setFollowLoading(false);
        }
    };

    // Kiểm tra trạng thái follow khi component mount
    useEffect(() => {
        const checkFollowStatus = async () => {
            try {
                // Lấy ID của người dùng hiện tại
                const currentUserId = await getUserId();

                // Nếu đang xem profile của chính mình, không cần kiểm tra
                if (currentUserId === id) return;

                // Gọi API kiểm tra trạng thái follow
                const status = await checkIsFollowing(currentUserId, id);
                setIsFollowing(status);
            } catch (error) {
                console.error('Error checking follow status:', error);
            }
        };

        if (id) {
            checkFollowStatus();
        }
    }, [id]);

    // Lấy thông tin profile và bài viết
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                // Tách biệt việc lấy thông tin profile và bài viết
                const [accountInfo, followingData, followersData, currentUserInfo] = await Promise.all([
                    getAccountInfo(id),
                    getFollowing(id),
                    getFollowers(id),
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

                // Tách riêng phần lấy bài viết
                try {
                    const postsData = await getPostsByAccountId(id);
                    // Kiểm tra nếu có dữ liệu trả về
                    if (postsData && postsData.items) {
                        setPosts(postsData.items || []);

                        // Lấy thông tin like và comment count cho mỗi bài viết
                        if (Array.isArray(postsData.items)) {
                            for (const post of postsData.items) {
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
                            }
                        }
                    } else {
                        // Không có bài viết, set mảng rỗng
                        setPosts([]);
                    }
                } catch (error) {
                    console.error('Error fetching posts:', error);
                    // Kiểm tra nếu lỗi là 404 thì không hiển thị toast lỗi
                    if (error.response && error.response.status !== 404) {
                        toast.error('Failed to load posts');
                    }
                    // Vẫn tiếp tục hiển thị profile ngay cả khi không lấy được bài viết
                    setPosts([]);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
                toast.error('Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProfileData();
        }
    }, [id]);

    // Chỉ lấy các trường bio để gửi API
    const getBioFields = (data) => {
        const { introTitle, position, workplace, facebookUrl, linkedinUrl, githubUrl, portfolioUrl, country } = data;
        return { introTitle, position, workplace, facebookUrl, linkedinUrl, githubUrl, portfolioUrl, country };
    };

    const handleUpdateBio = async () => {
        try {
            const updatedProfile = await updateBio(id, getBioFields(formData));
            setProfileData(updatedProfile);
            toast.success('Bio updated successfully');
        } catch (error) {
            toast.error('Failed to update bio');
        }
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
            formData.append('accountId', id);

            // Hiển thị thông báo đang xử lý
            toast.info('Đang tạo bài viết...');

            // Tạo post mới
            const result = await createPost(formData);

            // Reset form trước khi refresh
            setNewPost({ content: '', files: [] });
            setShowPostModal(false);
            setPostError('');

            // Gọi API để lấy danh sách posts mới nhất
            try {
                const postsData = await getPostsByAccountId(id, 1, pageSize);

                if (postsData && postsData.items) {
                    console.log('Refreshed posts:', postsData.items);

                    // Cập nhật state với danh sách posts mới
                    setPosts(postsData.items);

                    // Lấy thông tin likes và comments cho mỗi post mới
                    for (const post of postsData.items) {
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

                    // Kích hoạt tải lại bình luận
                    setRefreshCommentTrigger(prev => prev + 1);
                }
            } catch (error) {
                console.error('Error refreshing posts after creation:', error);
                // Nếu không lấy được bài viết mới, gọi tải lại
                fetchPosts(1);
            }

            toast.success('Bài viết đã được tạo thành công');
        } catch (error) {
            console.error('Error creating post:', error);

            // Xử lý lỗi từ API
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                if (status === 400 && errorData) {
                    // Hiển thị lỗi trong modal thay vì toast
                    setPostError(errorData.message || 'Bài viết vi phạm nguyên tắc cộng đồng');
                } else {
                    setPostError('Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại.');
                }
            } else {
                setPostError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
            }

            // Vẫn hiển thị toast để thông báo tổng quát
            toast.error('Không thể tạo bài viết');
        } finally {
            setIsCreatingPost(false);
        }
    };

    // Hàm xử lý hiển thị modal xác nhận xóa
    const confirmDeletePost = (postId) => {
        setPostToDelete(postId);
        setShowDeleteConfirmModal(true);
    };


    //xóa bài post
    const handleDeletePost = async (postId) => {
        try {
            const result = await deletePost(postId);
            // Cập nhật state để xóa bài viết khỏi UI
            setPosts(prevPosts => prevPosts.filter(post => post.postId !== postId));
            toast.success('Bài viết đã được xóa thành công');
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Không thể xóa bài viết. Vui lòng thử lại sau.');
        } finally {
            // Đóng modal xác nhận
            setShowDeleteConfirmModal(false);
            setPostToDelete(null);
        }
    };

    // Hàm xử lý cập nhật bài viết
    const handleUpdatePost = async (postId, content) => {
        try {
            if (!content.trim()) {
                toast.error('Nội dung bài viết không được để trống');
                return;
            }

            const updatePostDTO = {
                content: content
            };

            const result = await updatePost(postId, updatePostDTO);

            // Cập nhật bài viết trong state
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.postId === postId ? { ...post, content: content } : post
                )
            );

            toast.success('Bài viết đã được cập nhật thành công');
        } catch (error) {
            console.error('Error updating post:', error);
            toast.error('Không thể cập nhật bài viết. Vui lòng thử lại sau.');
        }
    };

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

            // Kích hoạt tải lại bình luận (vì like có thể ảnh hưởng đến hiển thị bình luận)
            setRefreshCommentTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error updating like:', error);

            // Hiển thị thông báo lỗi cụ thể nếu có
            if (error.response && error.response.data) {
                toast.error(`Không thể thích bài viết: ${error.response.data}`);
            } else {
                toast.error('Không thể cập nhật trạng thái thích');
            }
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

    // Hàm fetch posts với phân trang
    const fetchPosts = async (page) => {
        try {
            const response = await getPostsByAccountId(id, page, pageSize);
            // Kiểm tra response an toàn hơn
            if (response && response.items) {
                if (page === 1) {
                    setPosts(response.items);
                } else {
                    setPosts(prevPosts => [...prevPosts, ...response.items]);
                }
                setHasMore(response.items.length === pageSize);
            } else {
                // Nếu không có items hoặc response không hợp lệ
                if (page === 1) {
                    setPosts([]);
                }
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            // Kiểm tra nếu lỗi là 404 thì không hiển thị toast lỗi
            if (error.response && error.response.status === 404) {
                console.log('No posts found for this user');
            }
            setHasMore(false);
            // Nếu là trang đầu tiên và xảy ra lỗi, set posts là mảng rỗng
            if (page === 1) {
                setPosts([]);
            }
        } finally {
            setIsLoading(false); // Đảm bảo setIsLoading được gọi dù thành công hay thất bại
        }
    };

    // Hàm load more posts
    const loadMorePosts = useCallback(() => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        setPageNumber(prev => prev + 1);
    }, [isLoadingMore, hasMore]);

    // Observer cho infinite scroll
    const lastPostElementRef = useCallback(node => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMorePosts();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoadingMore, hasMore, loadMorePosts]);

    // Fetch posts khi component mount hoặc pageNumber thay đổi
    useEffect(() => {
        if (pageNumber === 1) {
            fetchPosts(1);
        } else {
            fetchPosts(pageNumber).finally(() => {
                setIsLoadingMore(false);
            });
        }
    }, [pageNumber, id]);

    // Hàm này để toggle comment section
    const toggleCommentSection = (postId) => {
        setOpenCommentPosts(prev => {
            const isOpen = prev.includes(postId);

            if (isOpen) {
                // Nếu đang mở, đóng lại
                return prev.filter(id => id !== postId);
            } else {
                // Nếu đang đóng, mở ra
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

        // Kích hoạt tải lại bình luận
        setRefreshCommentTrigger(prev => prev + 1);
    };

    // Cập nhật số lượng comment khi có thay đổi
    useEffect(() => {
        if (posts && posts.length > 0) {
            const updateCommentCounts = async () => {
                for (const post of posts) {
                    try {
                        const commentCount = await getPostCommentCount(post.postId);
                        setPostCommentCounts(prev => ({
                            ...prev,
                            [post.postId]: commentCount
                        }));
                    } catch (error) {
                        console.error('Error fetching comment count:', error);
                    }
                }
            };

            updateCommentCounts();
        }
    }, [posts]);


    // Hàm xử lý ẩn bài viết
    const handleHidePost = async (postId) => {
        try {
            // Lấy ID của người dùng hiện tại
            const currentUserId = await getUserId();

            if (!currentUserId) {
                toast.error('Please login to hide posts');
                return;
            }

            // Gọi API ẩn bài viết
            await hidePost(currentUserId, postId);

            // Cập nhật UI để ẩn bài viết
            setPosts(prevPosts => prevPosts.filter(post => post.postId !== postId));

            toast.success('Post hidden successfully');
        } catch (error) {
            console.error('Error hiding post:', error);
            toast.error('Failed to hide post. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Profile not found</h2>
                    <p className="text-gray-600 mt-2">The profile you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />

            {/* Cover Image Section */}
            <div className="container mb-2 mx-auto rounded-bl-lg rounded-br-lg relative h-60 bg-gray-400 rounded-b-lg mt-4">
                <img
                    src={profileData.coverImage || "aaaa"}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                {/* Gradient shadow bottom */}
                {/* <div className="absolute left-0 right-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div> */}

                {/* Buttons container */}
                <div className="absolute bottom-4 right-8 flex gap-3 z-10">
                    {/* Follow Button - Hiển thị khi xem profile người khác */}
                    {currentUserId != id && (
                        <button
                            className={`px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 transition-colors ${isFollowing
                                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                        >
                            <FontAwesomeIcon icon={isFollowing ? faUserCheck : faUserPlus} />
                            {followLoading ? 'Processing...' : isFollowing ? 'Following' : 'Follow'}
                        </button>
                    )}

                    {/* Edit Cover Button - Chỉ hiển thị khi xem profile của chính mình */}
                    {currentUserId === id && (
                        <button className="bg-white px-4 py-2 rounded-lg text-gray-800 font-medium shadow flex items-center gap-2 hover:bg-gray-100">
                            <FontAwesomeIcon icon={faCamera} /> Edit cover
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Info under cover */}
            {/* Main Content Grid */}
            <div className="container mx-auto mb-5 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="text-center p-4 relative">
                                <div className="flex justify-center">
                                    <div className="-mt-20">
                                        <div className="relative">
                                            <img
                                                src={profileData.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                alt="Avatar"
                                                className="w-40 h-40 rounded-full border-4 border-white bg-gray-200 object-cover shadow"
                                            />
                                            {/* <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full text-gray-700 shadow hover:bg-gray-100">
                                                <FontAwesomeIcon icon={faCamera} />
                                            </button> */}
                                        </div>
                                    </div>
                                </div>
                                <h4 className="font-bold text-xl">{profileData.firstName}</h4>
                                <p className="text-gray-600 mb-3">{profileData.jobTitle}</p>
                                <p className="text-gray-600 mb-3">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> {profileData.position}
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center mb-4">
                                    <button
                                        className={`px-6 py-2 font-semibold rounded-full shadow-sm focus:outline-none ${activeButton === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : 'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                                            }`}
                                        onClick={() => setActiveButton('all')}
                                    >
                                        All Post
                                    </button>
                                    <button
                                        className={`px-6 py-2 font-semibold rounded-full shadow-sm focus:outline-none ${activeButton === 'media'
                                            ? 'bg-blue-600 text-white'
                                            : 'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                                            }`}
                                        onClick={() => setActiveButton('media')}
                                    >
                                        Media
                                    </button>
                                    <button
                                        className={`px-6 py-2 font-semibold rounded-full shadow-sm focus:outline-none ${activeButton === 'bio'
                                            ? 'bg-blue-600 text-white'
                                            : 'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                                            }`}
                                        onClick={() => {
                                            setPreviousActiveButton(activeButton);
                                            setActiveButton('bio');
                                            setEditBio(true);
                                        }}
                                    >
                                        Update Bio
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 mb-4">
                                    <div className="text-center">
                                        <h6 className="font-semibold">Posts</h6>
                                        <span>{profileData.postCount || 0}</span>
                                    </div>
                                    <div className="text-center">
                                        <h6 className="font-semibold">Following</h6>
                                        <span>{following.length}</span>
                                    </div>
                                    <div className="text-center">
                                        <h6 className="font-semibold">Followers</h6>
                                        <span>{followers.length}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {profileData.facebookUrl && (
                                        <a href={profileData.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faFacebook} className="mr-2" /> Facebook
                                        </a>
                                    )}
                                    {profileData.githubUrl && (
                                        <Link to={profileData.githubUrl} target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faGithub} className="mr-2" /> Github
                                        </Link>
                                    )}
                                    {profileData.portfolioUrl && (
                                        <Link to={profileData.portfolioUrl} target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faBriefcase} className="mr-2" /> Portfolio
                                        </Link>
                                    )}
                                    {profileData.linkedinUrl && (
                                        <Link to={profileData.linkedinUrl} target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faLinkedin} className="mr-2" /> LinkedIn
                                        </Link>
                                    )}
                                </div>
                                <div className="mt-4 text-left">
                                    <div className="flex justify-between items-center mb-3">
                                        <h6 className="font-semibold">About Me</h6>
                                    </div>
                                    <p className="text-gray-600">{profileData.introTitle}</p>
                                </div>
                                {/* Update Bio Button and Modal */}
                                <div>
                                    {editBio && (
                                        <Modal onClose={() => {
                                            setEditBio(false);
                                            setActiveButton(previousActiveButton);
                                        }}>
                                            <h2 className="text-xl font-bold mb-4">Update Bio</h2>
                                            <input value={formData.introTitle} onChange={e => setFormData(f => ({ ...f, introTitle: e.target.value }))} placeholder="Intro Title" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.position} onChange={e => setFormData(f => ({ ...f, position: e.target.value }))} placeholder="Position" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.workplace} onChange={e => setFormData(f => ({ ...f, workplace: e.target.value }))} placeholder="Workplace" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.facebookUrl} onChange={e => setFormData(f => ({ ...f, facebookUrl: e.target.value }))} placeholder="Facebook URL" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.linkedinUrl} onChange={e => setFormData(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="LinkedIn URL" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.githubUrl} onChange={e => setFormData(f => ({ ...f, githubUrl: e.target.value }))} placeholder="GitHub URL" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.portfolioUrl} onChange={e => setFormData(f => ({ ...f, portfolioUrl: e.target.value }))} placeholder="Portfolio URL" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.country} onChange={e => setFormData(f => ({ ...f, country: e.target.value }))} placeholder="Country" className="input mb-2 w-full border p-2 rounded" />
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                                                    onClick={async () => {
                                                        await handleUpdateBio();
                                                        setEditBio(false);
                                                        setActiveButton(previousActiveButton);
                                                    }}
                                                >
                                                    Save Bio
                                                </button>
                                                <button
                                                    className="px-4 py-2"
                                                    onClick={() => {
                                                        setEditBio(false);
                                                        setActiveButton(previousActiveButton);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </Modal>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Posts */}
                    <div className="lg:col-span-2">
                        {/* Posts Filter */}

                        {/* Create Post Card */}
                        <div className="bg-white rounded-lg shadow-md mb-6">
                            <div className="p-4">
                                <div className="flex gap-3">
                                    <img
                                        src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt="Profile"
                                        className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                    />
                                    <div className="flex-grow">
                                        <button
                                            className="w-full p-3 border border-gray-200 rounded-lg text-left text-gray-500"
                                            onClick={() => setShowPostModal(true)}
                                        >
                                            What would you like to talk about?
                                        </button>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="space-x-2">
                                                <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                    onClick={() => setShowPostModal(true)}
                                                >
                                                    <FontAwesomeIcon icon={faImage} className="mr-1" /> Photo/Video
                                                </button>
                                                <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
                                                    <FontAwesomeIcon icon={faPaperclip} className="mr-1" /> Attachment
                                                </button>
                                            </div>
                                            <button className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all">
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal xác nhận xóa bài viết */}
                        {showDeleteConfirmModal && (
                            <Modal onClose={() => {
                                setShowDeleteConfirmModal(false);
                                setPostToDelete(null);
                            }}>
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold mb-4">Confirm post deletion</h3>
                                    <p className="mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium"
                                            onClick={() => {
                                                setShowDeleteConfirmModal(false);
                                                setPostToDelete(null);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium"
                                            onClick={() => postToDelete && handleDeletePost(postToDelete)}
                                        >
                                            Delete posts
                                        </button>
                                    </div>
                                </div>
                            </Modal>
                        )}

                        {showPostModal && (
                            <Modal onClose={() => {
                                setShowPostModal(false);
                                setPostError(''); // Reset lỗi khi đóng modal
                                setNewPost({ content: '', files: [] }); // Reset form
                            }}>
                                <div className="flex items-center gap-3 p-6 border-b">
                                    <img
                                        src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt="Avatar"
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <div className="font-semibold">{profileData?.firstName} {profileData?.lastName}</div>
                                        <div className="text-xs text-gray-500">Đăng bài ở chế độ Bất cứ ai</div>
                                    </div>
                                </div>

                                {/* Error Display */}
                                {postError && (
                                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">
                                                    Không thể đăng bài
                                                </h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    {postError}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6">
                                    <textarea
                                        className="w-full border-none outline-none resize-none text-lg"
                                        rows={4}
                                        placeholder="Bạn muốn nói về chủ đề gì?"
                                        value={newPost.content}
                                        onChange={(e) => {
                                            setNewPost(prev => ({ ...prev, content: e.target.value }));
                                            // Clear error khi user bắt đầu chỉnh sửa
                                            if (postError) {
                                                setPostError('');
                                            }
                                        }}
                                    />
                                    {newPost.files.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {newPost.files.map((file, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Upload ${index + 1}`}
                                                        className="w-20 h-20 object-cover rounded"
                                                    />
                                                    <button
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                                        onClick={() => setNewPost(prev => ({
                                                            ...prev,
                                                            files: prev.files.filter((_, i) => i !== index)
                                                        }))}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mt-4">
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleFileUpload}
                                            />
                                            <FontAwesomeIcon icon={faImage} className="text-blue-500" />
                                        </label>
                                        <FontAwesomeIcon icon={faSmile} className="text-yellow-500" />
                                    </div>
                                </div>
                                <div className="flex justify-end p-4 border-t">
                                    <button
                                        className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 ${isCreatingPost
                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                        onClick={handleCreatePost}
                                        disabled={isCreatingPost}
                                    >
                                        {isCreatingPost && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        )}
                                        {isCreatingPost ? 'Đang đăng...' : 'Post'}
                                    </button>
                                </div>
                            </Modal>
                        )}

                        {/* Posts List */}
                        <div className="space-y-6">
                            {posts && posts.length > 0 ? (
                                posts.map((post, index) => (
                                    <div
                                        key={`post-${post.postId}-${index}`}
                                        ref={index === posts.length - 1 ? lastPostElementRef : null}
                                        className="bg-white rounded-lg shadow-md"
                                    >
                                        <div className="p-4">
                                            <div className="flex justify-between mb-3">
                                                <div className="flex gap-3">
                                                    <img
                                                        src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        alt="Profile"
                                                        className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                                    />
                                                    <div>
                                                        <h6 className="font-semibold mb-0">{profileData?.firstName} {profileData?.lastName}</h6>
                                                        <small className="text-gray-600">
                                                            {post.createAt ? formatPostTime(post.createAt) : (post.createAt ? formatPostTime(post.createAt) : "Unknown date")}
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="relative group">
                                                    <button
                                                        onClick={() =>
                                                            setOpenDropdownPostId(openDropdownPostId === post.postId ? null : post.postId)
                                                        }
                                                        className="text-gray-600 hover:text-gray-900" >
                                                        <FontAwesomeIcon icon={faEllipsisH} />
                                                    </button>

                                                    {/* Menu xổ xuống khi click vào nút ellipsis */}
                                                    {openDropdownPostId === post.postId && (
                                                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg overflow-hidden z-50">
                                                            {post.accountId == currentUserId && (
                                                                <div className="py-1">
                                                                    <button
                                                                        onClick={() => setEditingPost(post)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                                    >
                                                                        <FontAwesomeIcon icon={faEdit} className="text-blue-500" />
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => confirmDeletePost(post.postId)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                                                                        Delete
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleHidePost(post.postId)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                                    >
                                                                        <FontAwesomeIcon icon={faEyeSlash} className="text-gray-500" />
                                                                        Hide post
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div className="py-1">
                                                                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                                                    <FontAwesomeIcon icon={faShareSquare} className="text-green-500" />
                                                                    Share                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-gray-800">{post.content}</p>
                                                {post.postMedia && post.postMedia.length > 0 && (
                                                    <PostMediaGrid media={post.postMedia} />
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                        onClick={() => handleLikePost(post.postId)}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={postLikes[post.postId] ? faHeart : farHeart}
                                                            className={`mr-1 ${postLikes[post.postId] ? 'text-red-500' : ''}`}
                                                        />
                                                        {postLikes[post.postId] || 0} Like
                                                    </button>
                                                    <button
                                                        className={`px-3 py-1 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all ${openCommentPosts.includes(post.postId) ? 'bg-blue-100' : 'bg-gray-100'}`}
                                                        onClick={() => toggleCommentSection(post.postId)}
                                                    >
                                                        <FontAwesomeIcon icon={openCommentPosts.includes(post.postId) ? faComment : farComment} className="mr-1" />
                                                        {postCommentCounts[post.postId] || 0} Comment
                                                    </button>
                                                    <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
                                                        <FontAwesomeIcon icon={farShareSquare} className="mr-1" />
                                                        Share
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comment Section - Thay thế bằng component CommentSection */}
                                        <div className="px-6 pb-4">
                                            <CommentSection
                                                postId={post.postId}
                                                isOpen={openCommentPosts.includes(post.postId)}
                                                onToggle={() => toggleCommentSection(post.postId)}
                                                commentCount={postCommentCounts[post.postId] || 0}
                                                currentUserAvatar={currentUserData?.avatarUrl}
                                                refreshTrigger={refreshCommentTrigger}
                                                onCommentCountChange={(newCount) => handleCommentCountChange(post.postId, newCount)}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : isLoading ? (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-500 text-lg">Đang tải bài viết...</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <img
                                        src="/images/no-posts.svg"
                                        alt="Không có bài viết"
                                        className="w-32 h-32 mx-auto mb-4 opacity-60"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <p className="text-gray-600 text-lg font-medium mb-2">Chưa có bài viết nào</p>
                                    <p className="text-gray-500 mb-4">
                                        {id === currentUserId ?
                                            "Hãy chia sẻ trải nghiệm của bạn ngay bây giờ" :
                                            `${profileData?.firstName || 'Người dùng này'} chưa đăng bài viết nào`}
                                    </p>
                                    {id === currentUserId && (
                                        <button
                                            onClick={() => setShowPostModal(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                                        >
                                            <FontAwesomeIcon icon={faEdit} className="mr-2" />
                                            Tạo bài viết mới
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Loading indicator */}
                            {isLoadingMore && (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Thêm debug để hiển thị trạng thái */}
            {/* <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg z-50 max-w-md max-h-60 overflow-auto">
                <h3 className="font-bold">Debug:</h3>
                <div>Open Comment Posts: {JSON.stringify(openCommentPosts)}</div>
                <div>Post Comments: {JSON.stringify(postComments)}</div>
            </div> */}

            {editingPost && (
                <Modal onClose={() => {
                    setEditingPost(null);
                    setEditedPostContent('');
                }}>
                    <div className="flex items-center gap-3 p-6 border-b">
                        <img
                            src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt="Avatar"
                            className="w-12 h-12 rounded-full"
                        />
                        <div>
                            <div className="font-semibold">{profileData?.firstName} {profileData?.lastName}</div>
                            <div className="text-xs text-gray-500">Chỉnh sửa bài viết</div>
                        </div>
                    </div>

                    <div className="p-6">
                        <textarea
                            className="w-full border border-gray-300 outline-none resize-none text-lg p-3 rounded-lg"
                            rows={4}
                            placeholder="Nội dung bài viết..."
                            value={editedPostContent || editingPost.content}
                            onChange={(e) => setEditedPostContent(e.target.value)}
                        />
                        {editingPost.postMedia && editingPost.postMedia.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Ảnh/Video đã đính kèm:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {editingPost.postMedia.map((media, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={media.url}
                                                alt={`Media ${index + 1}`}
                                                className="w-20 h-20 object-cover rounded"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end p-4 border-t">
                        <button
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold mr-2"
                            onClick={() => {
                                setEditingPost(null);
                                setEditedPostContent('');
                            }}
                        >
                            Hủy
                        </button>
                        <button
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                            onClick={() => {
                                handleUpdatePost(editingPost.postId, editedPostContent || editingPost.content);
                                setEditingPost(null);
                                setEditedPostContent('');
                            }}
                        >
                            Cập nhật
                        </button>
                    </div>
                </Modal>
            )}
        </div >
    );
};


export default PublicProfile;








