import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEllipsisH, faImage, faPaperclip, faSmile, faPlus, faMapMarkerAlt, faEdit, faTrash, faShareSquare, faComment, faHeart, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { faComment as farComment, faHeart as farHeart, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getUserId, getUserInfoFromToken } from '@/apis/authService';
import {
    createPost,
    getPostsByAccountId,
    likePost,
    unlikePost,
    getPostLikeCount,
    isPostLiked,
    createPostComment,
    getPostCommentsByPostId,
    getPostCommentCount,
    updatePost,
    deletePost,
    hidePost
} from '@/apis/postService';
import { getAccountInfo, getFollowing, getFollowers } from '@/apis/accountService';
import { toast } from 'react-toastify';
import PostMediaGrid from '@/components/PostMedia/PostMediaGrid';
import CommentSection from '@/components/CommentSection/CommentSection';

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

const Home = () => {
    const [showPostModal, setShowPostModal] = useState(false);
    const [newPost, setNewPost] = useState({
        content: '',
        files: []
    });
    const [posts, setPosts] = useState([]);
    const [postLikes, setPostLikes] = useState({});
    const [postComments, setPostComments] = useState({});
    const [openCommentPosts, setOpenCommentPosts] = useState([]);
    const [commentContents, setCommentContents] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const pageSize = 10;
    const observer = useRef();
    const currentUserId = getUserId();
    const userInfo = getUserInfoFromToken();
    const [postCommentCounts, setPostCommentCounts] = useState({});
    // Thêm state cho thông tin profile
    const [profileData, setProfileData] = useState(null);
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);

    // Thêm các state mới
    const [openPostMenus, setOpenPostMenus] = useState([]);
    const [editingPost, setEditingPost] = useState(null);
    const [editedPostContent, setEditedPostContent] = useState('');
    const [refreshCommentTrigger, setRefreshCommentTrigger] = useState(0);

    // Thêm state để hiển thị lỗi khi tạo bài viết
    const [postError, setPostError] = useState('');
    const [isCreatingPost, setIsCreatingPost] = useState(false);

    // Thêm state để quản lý dropdown menu
    const [openDropdownPostId, setOpenDropdownPostId] = useState(null);

    // Thêm hàm để đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdownPostId && !event.target.closest('.post-menu-container')) {
                setOpenDropdownPostId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDropdownPostId]);

    // Thêm useEffect để fetch dữ liệu profile và bài viết
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                // Tách biệt việc lấy thông tin profile và bài viết
                const [accountInfo, followingData, followersData] = await Promise.all([
                    getAccountInfo(currentUserId),
                    getFollowing(currentUserId),
                    getFollowers(currentUserId)
                ]);

                if (!accountInfo) {
                    toast.error('Failed to load profile data');
                    setIsLoading(false);
                    return;
                }

                setProfileData(accountInfo);
                setFollowing(followingData || []);
                setFollowers(followersData || []);

                // Tách riêng phần lấy bài viết
                try {
                    const postsData = await getPostsByAccountId(currentUserId);
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

        if (currentUserId) {
            fetchProfileData();
        }
    }, [currentUserId]);

    // Thêm các hàm và useEffect cần thiết cho infinite scrolling

    // Hàm fetch posts với phân trang
    const fetchPosts = async (page) => {
        try {
            const response = await getPostsByAccountId(currentUserId, page, pageSize);
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

    //Fetch posts khi component mount hoặc pageNumber thay đổi
    useEffect(() => {
        if (pageNumber === 1) {
            setIsLoading(true);
            fetchPosts(1).finally(() => {
                setIsLoading(false);
            });
        } else {
            fetchPosts(pageNumber).finally(() => {
                setIsLoadingMore(false);
            });
        }
    }, [pageNumber, currentUserId]);

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
            formData.append('accountId', currentUserId);

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
                const postsData = await getPostsByAccountId(currentUserId, 1, pageSize);

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

    // Hàm xử lý thích/bỏ thích bài viết
    const handleLikePost = async (postId) => {
        if (!currentUserId) {
            toast.error('Please login to like posts');
            return;
        }

        try {
            const likeData = {
                postId,
                accountId: currentUserId
            };

            const isLiked = await isPostLiked(likeData);
            if (isLiked) {
                await unlikePost(likeData);
            } else {
                await likePost(likeData);
            }
            // Sau khi like/unlike, cập nhật lại số lượng like từ backend
            const likeCount = await getPostLikeCount(postId);
            setPostLikes(prev => ({
                ...prev,
                [postId]: likeCount
            }));
        } catch (error) {
            toast.error('Failed to update like');
            console.error('Error updating like:', error);
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

    // Hàm lấy comments của một bài viết
    const fetchPostComments = async (postId) => {
        try {
            const comments = await getPostCommentsByPostId(postId);
            setPostComments(prev => ({
                ...prev,
                [postId]: comments
            }));
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    // Hàm xử lý tạo comment
    const handleCreateComment = async (postId, content) => {
        if (!content.trim()) {
            toast.error('Please enter a comment');
            return;
        }

        if (!currentUserId) {
            toast.error('Please login to comment');
            return;
        }

        try {
            const commentData = {
                postId: postId,
                accountId: currentUserId,
                content: content
            };

            // Gửi request tạo comment
            await createPostComment(commentData);

            // Lấy lại danh sách comments mới
            const updatedComments = await getPostCommentsByPostId(postId);

            // Cập nhật state với danh sách comments mới
            setPostComments(prev => ({
                ...prev,
                [postId]: updatedComments || []
            }));

            // Reset input
            setCommentContents(prev => ({
                ...prev,
                [postId]: ''
            }));

            toast.success('Comment added successfully');
        } catch (error) {
            toast.error('Failed to add comment');
            console.error('Error creating comment:', error);
        }
    };

    // Hàm này để toggle comment section
    const toggleCommentSection = (postId) => {
        setOpenCommentPosts(prev => {
            if (prev.includes(postId)) {
                return prev.filter(id => id !== postId);
            } else {
                // Nếu chưa có trong danh sách, thêm vào và fetch comments
                fetchPostComments(postId);
                return [...prev, postId];
            }
        });
    };

    // Hàm này để cập nhật nội dung comment cho từng bài viết
    const updateCommentContent = (postId, content) => {
        setCommentContents(prev => ({
            ...prev,
            [postId]: content
        }));
    };

    // Hàm toggle menu của bài post
    const togglePostMenu = (postId) => {
        setOpenPostMenus(prev => {
            if (prev.includes(postId)) {
                return prev.filter(id => id !== postId);
            } else {
                return [...prev, postId];
            }
        });
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

    // Hàm xử lý xóa bài viết
    const handleDeletePost = async (postId) => {
        try {
            if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
                return;
            }

            const result = await deletePost(postId);
            // Cập nhật state để xóa bài viết khỏi UI
            setPosts(prevPosts => prevPosts.filter(post => post.postId !== postId));
            toast.success('Bài viết đã được xóa thành công');
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Không thể xóa bài viết. Vui lòng thử lại sau.');
        }
    };

    // Hàm xử lý cập nhật số lượng comment
    const handleCommentCountChange = (postId, newCount) => {
        setPostCommentCounts(prev => ({
            ...prev,
            [postId]: newCount
        }));
    };

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

    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />
            <div className="container mx-auto pt-20 px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left Column - Profile Card (Cập nhật để giống PublicProfile) */}
                    <div className="space-y-6 hidden md:block md:col-span-1">
                        {/* Profile Card */}
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="h-20 bg-gradient-to-br from-blue-900 to-blue-700 rounded-t-lg"></div>
                            <div className="text-center pt-0 px-4 pb-4">
                                <img
                                    src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                    alt={profileData?.firstName || "User"}
                                    className="w-24 h-24 rounded-full mx-auto border-4 border-white -mt-12 object-cover"
                                />
                                <h5 className="font-bold mt-3">{profileData?.firstName} {profileData?.lastName}</h5>
                                <p className="text-gray-600 text-sm">{profileData?.position || "No position"}</p>
                                <p className="text-gray-600 mb-3">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> {profileData?.address || "No location"}
                                </p>
                                <div className="grid grid-cols-3 mt-3">
                                    <div className="text-center">
                                        <div className="font-bold text-lg">{profileData?.postCount || 0}</div>
                                        <div className="text-gray-600">Posts</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg">{following?.length || 0}</div>
                                        <div className="text-gray-600">Following</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg">{followers?.length || 0}</div>
                                        <div className="text-gray-600">Followers</div>
                                    </div>
                                </div>
                                <Link
                                    to={`/profile/${currentUserId}`}
                                    className="block w-full mt-3 py-1 border border-gray-400 text-gray-700 rounded-full text-sm hover:bg-gray-100 transition-all"
                                >
                                    View Public Profile
                                </Link>

                                {/* About Me Section */}
                                <div className="mt-4 text-left">
                                    <div className="flex justify-between items-center mb-3">
                                        <h6 className="font-semibold">About Me</h6>
                                    </div>
                                    <p className="text-gray-600">{profileData?.introTitle || "No introduction yet."}</p>
                                </div>
                            </div>
                        </div>

                        {/* Suggestions Card */}
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold">Suggestions</span>
                                    <FontAwesomeIcon icon={faEllipsisH} className="text-gray-600" />
                                </div>
                                {[
                                    { name: 'Jessica William', role: 'Graphic Designer' },
                                    { name: 'John Doe', role: 'PHP Developer' },
                                    { name: 'Poonam', role: 'Wordpress Developer' },
                                    { name: 'Bill Gates', role: 'C & C++ Developer' },
                                    { name: 'Jessica William', role: 'Graphic Designer' },
                                    { name: 'John Doe', role: 'PHP Developer' },
                                ].map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center mb-3 p-2 hover:bg-gray-50 rounded-md transition-all"
                                    >
                                        <img
                                            src="/api/placeholder/40/40"
                                            alt={suggestion.name}
                                            className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                        />
                                        <div className="ml-3 flex-grow">
                                            <div className="font-bold text-base">{suggestion.name}</div>
                                            <div className="text-gray-600 text-sm">{suggestion.role}</div>
                                        </div>
                                        <button className="text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faPlus} />
                                        </button>
                                    </div>
                                ))}
                                <Link to="#" className="block text-center mt-3 text-blue-600 text-sm hover:underline">
                                    View More
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column - Posts */}
                    <div className="md:col-span-2">
                        {/* Post Buttons */}
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
                                                <button
                                                    className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                    onClick={() => setShowPostModal(true)}
                                                >
                                                    <FontAwesomeIcon icon={faImage} className="mr-1" /> Photo/Video
                                                </button>
                                                <button
                                                    className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                    onClick={() => setShowPostModal(true)}
                                                >
                                                    <FontAwesomeIcon icon={faPaperclip} className="mr-1" /> Attachment
                                                </button>
                                            </div>
                                            <button
                                                className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all"
                                                onClick={() => setShowPostModal(true)}
                                            >
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Post Modal */}
                        {showPostModal && (
                            <Modal onClose={() => {
                                setShowPostModal(false);
                                setPostError(''); // Reset lỗi khi đóng modal
                                setNewPost({ content: '', files: [] }); // Reset form
                            }}>
                                <div className="flex items-center gap-3 p-6 border-b">
                                    <img
                                        src={profileData?.avatarUrl || "/api/placeholder/40/40"}
                                        alt="Avatar"
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <div className="font-semibold">{profileData?.firstName} {profileData?.lastName}</div>
                                        <div className="text-xs text-gray-500">Posting publicly</div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <textarea
                                        className={`w-full border-none outline-none resize-none text-lg ${postError ? 'border-red-500' : ''}`}
                                        rows={4}
                                        placeholder="What would you like to talk about?"
                                        value={newPost.content}
                                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                                    />
                                    {postError && (
                                        <div className="mt-2 text-red-500 text-sm bg-red-50 p-2 rounded-md">
                                            {postError}
                                        </div>
                                    )}
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
                                        className={`bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold ${isCreatingPost ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={handleCreatePost}
                                        disabled={isCreatingPost}
                                    >
                                        {isCreatingPost ? 'Đang đăng...' : 'Post'}
                                    </button>
                                </div>
                            </Modal>
                        )}

                        {/* Modal chỉnh sửa bài viết */}
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
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium mr-2"
                                        onClick={() => {
                                            setEditingPost(null);
                                            setEditedPostContent('');
                                        }}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
                                        onClick={() => {
                                            handleUpdatePost(editingPost.postId, editedPostContent || editingPost.content);
                                            setEditingPost(null);
                                        }}
                                    >
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </Modal>
                        )}

                        {/* PostList */}
                        <div className="space-y-6">
                            {posts && posts.length > 0 ? (
                                posts.map((post, index) => (
                                    <div
                                        key={`post-${post.postId}-${index}`}
                                        ref={index === posts.length - 1 ? lastPostElementRef : null}
                                        className="bg-white rounded-lg shadow-md"
                                    >
                                        <div className="p-4">
                                            {/* Post header */}
                                            <div className="flex justify-between mb-3">
                                                <div className="flex gap-3">
                                                    <img
                                                        src={post.account?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        alt="Profile"
                                                        className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                                        }}
                                                    />
                                                    <div>
                                                        <h6 className="font-semibold mb-0">
                                                            {post.account?.firstName} {post.account?.lastName || "Unknown User"}
                                                        </h6>
                                                        <small className="text-gray-600">
                                                            {post.createAt ? new Date(post.createAt).toLocaleDateString('vi-VN') : "Unknown date"}
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="relative post-menu-container">
                                                    <button
                                                        onClick={() => setOpenDropdownPostId(openDropdownPostId === post.postId ? null : post.postId)}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
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
                                                                        Chỉnh sửa
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePost(post.postId)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                                                                        Xóa
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleHidePost(post.postId)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                                    >
                                                                        <FontAwesomeIcon icon={faEyeSlash} className="text-gray-500" />
                                                                        Ẩn bài viết
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div className="py-1">
                                                                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                                                    <FontAwesomeIcon icon={faShareSquare} className="text-green-500" />
                                                                    Chia sẻ
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                {post.title && <h5 className="font-bold mb-2">{post.title}</h5>}
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

                                        {/* Comment Section */}
                                        <div className="px-6 pb-4">
                                            <CommentSection
                                                postId={post.postId}
                                                isOpen={openCommentPosts.includes(post.postId)}
                                                onToggle={() => toggleCommentSection(post.postId)}
                                                commentCount={postCommentCounts[post.postId] || 0}
                                                currentUserAvatar={profileData?.avatarUrl}
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
                                    <p className="text-gray-500 mb-4">Hãy chia sẻ trải nghiệm của bạn ngay bây giờ</p>
                                    <button
                                        onClick={() => setShowPostModal(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                                    >
                                        <FontAwesomeIcon icon={faEdit} className="mr-2" />
                                        Tạo bài viết mới
                                    </button>
                                </div>
                            )}

                            {/* Loading indicator */}
                            {isLoadingMore && (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>

                        {/* Thay thế tạm thời */}
                        {/* <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <p className="text-gray-500 text-lg">Danh sách bài viết đang được cập nhật</p>
                        </div> */}
                        {/* Loading indicator */}
                        {isLoadingMore && (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Trending */}
                    <div className="space-y-6 hidden md:block md:col-span-1">
                        {/* Trending Card */}
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="p-4 border-b">
                                <h5 className="font-bold">Trending</h5>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">#technology</div>
                                        <h6 className="font-semibold text-sm">The Future of AI in Healthcare</h6>
                                        <div className="text-xs text-gray-500">1.2k posts</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">#business</div>
                                        <h6 className="font-semibold text-sm">Remote Work Trends in 2023</h6>
                                        <div className="text-xs text-gray-500">856 posts</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">#design</div>
                                        <h6 className="font-semibold text-sm">UI/UX Design Principles</h6>
                                        <div className="text-xs text-gray-500">543 posts</div>
                                    </div>
                                </div>
                                <button className="w-full mt-4 text-blue-600 text-sm font-medium">
                                    Show more
                                </button>
                            </div>
                        </div>

                        {/* Messages Card */}
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="p-4 border-b">
                                <h5 className="font-bold">Messages</h5>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src="/api/placeholder/40/40"
                                            alt="Avatar"
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <h6 className="font-semibold text-sm">Sarah Johnson</h6>
                                            <p className="text-xs text-gray-500 truncate">Hey, how's your project going?</p>
                                        </div>
                                        <div className="text-xs text-gray-500">2m</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src="/api/placeholder/40/40"
                                            alt="Avatar"
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <h6 className="font-semibold text-sm">Michael Chen</h6>
                                            <p className="text-xs text-gray-500 truncate">Let's meet tomorrow to discuss...</p>
                                        </div>
                                        <div className="text-xs text-gray-500">1h</div>
                                    </div>
                                </div>
                                <button className="w-full mt-4 text-blue-600 text-sm font-medium">
                                    View all messages
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
