import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCamera, faMapMarkerAlt, faImage, faPaperclip, faEllipsisH, faFileAlt, faGlobe, faBriefcase, faHeart, faComment, faShareSquare, faSmile } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faFacebook, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faHeart as farHeart, faComment as farComment, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getAccountInfo, getFollowing, getFollowers, updateBio } from '@/apis/accountService';
import { getPostsByAccountId, createPost, likePost, unlikePost, getPostLikeCount, getPostCommentCount, isPostLiked, createPostComment, getPostCommentsByPostId } from '@/apis/postService';
import { toast } from 'react-toastify';
import { getRelativeTime } from '@/utils/dateUtils';

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
    const [showPostModal, setShowPostModal] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newBio, setNewBio] = useState('');
    const [editBio, setEditBio] = useState(false);
    // Thêm state cho bài viết
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({
        content: '',
        files: []
    });
    const [postLikes, setPostLikes] = useState({});
    const [postComments, setPostComments] = useState({});
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
    const [activeButton, setActiveButton] = useState('all'); // 'all', 'media', 'bio'
    const [previousActiveButton, setPreviousActiveButton] = useState('all');
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observer = useRef();
    const pageSize = 10;
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [commentContent, setCommentContent] = useState('');
    const [openCommentPosts, setOpenCommentPosts] = useState([]);
    const [commentContents, setCommentContents] = useState({});

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                const [accountInfo, followingData, followersData, postsData] = await Promise.all([
                    getAccountInfo(id),
                    getFollowing(id),
                    getFollowers(id),
                    getPostsByAccountId(id)
                ]);
                if (!accountInfo || !postsData) {
                    toast.error('Failed to load profile data');
                    setIsLoading(false);
                    return;
                }
                setProfileData(accountInfo);
                setFollowing(followingData || []);
                setFollowers(followersData || []);
                setPosts(postsData.items || []);
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
                if (postsData.items && Array.isArray(postsData.items)) {
                    postsData.items.forEach(async (post) => {
                        const [likeCount, comments] = await Promise.all([
                            getPostLikeCount(post.postId),
                            getPostCommentsByPostId(post.postId)
                        ]);
                        setPostLikes(prev => ({
                            ...prev,
                            [post.postId]: likeCount
                        }));
                        setPostComments(prev => ({
                            ...prev,
                            [post.postId]: comments || []
                        }));
                    });
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
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

    //     const handleCreatePost = async () => {
    //         try {
    //             const formData = new FormData();
    //             formData.append('content', newPost.content);
    //             newPost.files.forEach(file => {
    //                 formData.append('files', file);
    //             });
    //             formData.append('accountId', id);

    //             // Hiển thị thông báo đang xử lý
    //             toast.info('Đang tạo bài viết...');

    //             // Tạo post mới
    //             const result = await createPost(formData);
    //             console.log('New post created:', result);

    //             // Reset form trước khi refresh
    //             setNewPost({ content: '', files: [] });
    //             setShowPostModal(false);

    //             // Gọi API để lấy danh sách posts mới nhất
    //             const postsData = await getPostsByAccountId(id, 1, pageSize);

    //             if (postsData && Array.isArray(postsData.items)) {
    //                 console.log('Refreshed posts:', postsData.items);

    //                 // Cập nhật state với danh sách posts mới
    //                 setPosts(postsData.items);

    //                 // Lấy thông tin likes và comments cho mỗi post mới
    //                 for (const post of postsData.items) {
    //                     try {
    //                         const [likeCount, comments] = await Promise.all([
    //                             getPostLikeCount(post.postId),
    //                             getPostCommentsByPostId(post.postId)
    //                         ]);

    //                         setPostLikes(prev => ({
    //                             ...prev,
    //                             [post.postId]: likeCount
    //                         }));

    //                         setPostComments(prev => ({
    //                             ...prev,
    //                             [post.postId]: comments || []
    //                         }));
    //                     } catch (error) {
    //                         console.error('Error fetching post details:', error);
    //                     }
    //                 }
    //             }

    //             toast.success('Bài viết đã được tạo thành công');
    //         } catch (error) {
    //             toast.error('Không thể tạo bài viết');
    //             console.error('Error creating post:', error);
    //         }
    //     };



    // Hàm xử lý tạo bài viết mới
    const handleCreatePost = async () => {
        try {
            const formData = new FormData();
            formData.append('content', newPost.content);
            newPost.files.forEach(file => {
                formData.append('files', file);
            });
            formData.append('accountId', id);

            // Hiển thị thông báo đang xử lý
            toast.info('Đang tạo bài viết...');

            // Tạo post mới
            const result = await createPost(formData);

            // Reset form trước khi refresh
            setNewPost({ content: '', files: [] });
            setShowPostModal(false);

            // Gọi API để lấy danh sách posts mới nhất
            const postsData = await getPostsByAccountId(id, 1, pageSize);

            if (postsData && Array.isArray(postsData.items)) {
                console.log('Refreshed posts:', postsData.items);

                // Cập nhật state với danh sách posts mới
                setPosts(postsData.items);

                // Lấy thông tin likes và comments cho mỗi post mới
                for (const post of postsData.items) {
                    try {
                        const [likeCount, comments] = await Promise.all([
                            getPostLikeCount(post.postId),
                            getPostCommentsByPostId(post.postId)
                        ]);

                        setPostLikes(prev => ({
                            ...prev,
                            [post.postId]: likeCount
                        }));

                        setPostComments(prev => ({
                            ...prev,
                            [post.postId]: comments || []
                        }));
                    } catch (error) {
                        console.error('Error fetching post details:', error);
                    }
                }
            }

            toast.success('Bài viết đã được tạo thành công');
        } catch (error) {
            toast.error('Không thể tạo bài viết');
            console.error('Error creating post:', error);
        }
    };

    // Hàm xử lý thích/bỏ thích bài viết
    const handleLikePost = async (postId) => {
        try {
            const likeData = {
                postId,
                accountId: id
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

    // Hàm fetch posts với phân trang
    const fetchPosts = async (page) => {
        try {
            const response = await getPostsByAccountId(id, page, pageSize);
            if (response && response.items) {
                if (page === 1) {
                    setPosts(response.items);
                } else {
                    setPosts(prevPosts => [...prevPosts, ...response.items]);
                }
                setHasMore(response.items.length === pageSize);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            setHasMore(false);
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
            toast.error('Vui lòng nhập nội dung bình luận');
            return;
        }

        try {
            // Lấy accountId từ profileData
            const accountId = profileData.accountId;

            // Log để debug
            // console.log('Creating comment for post ID:', postId);

            const commentData = {
                postId: postId,
                accountId: accountId,
                content: content
            };

            // console.log('Sending comment data:', commentData);

            // Gửi request tạo comment
            await createPostComment(commentData);

            // Lấy lại danh sách comments mới
            const updatedComments = await getPostCommentsByPostId(postId);
            // console.log('Updated comments for post ID:', postId, updatedComments);

            // Cập nhật state với danh sách comments mới
            setPostComments(prev => ({
                ...prev,
                [postId]: updatedComments || []
            }));

            // Reset input
            setCommentContent('');

            toast.success('Bình luận đã được thêm thành công');
        } catch (error) {
            toast.error('Không thể thêm bình luận');
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

    // Sau khi fetch posts (trong useEffect hoặc fetchPosts)
    useEffect(() => {
        if (posts && posts.length > 0) {
            posts.forEach(async (post) => {
                const likeCount = await getPostLikeCount(post.postId);
                setPostLikes(prev => ({
                    ...prev,
                    [post.postId]: likeCount
                }));
            });
        }
    }, [posts]);

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
                {/* Edit Cover Button */}
                <button className="absolute bottom-4 right-8 bg-white px-4 py-2 rounded-lg text-gray-800 font-medium shadow flex items-center gap-2 hover:bg-gray-100 z-10">
                    <FontAwesomeIcon icon={faCamera} /> Edit cover
                </button>
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
                                                <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
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

                        {showPostModal && (
                            <Modal onClose={() => setShowPostModal(false)}>
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
                                <div className="p-6">
                                    <textarea
                                        className="w-full border-none outline-none resize-none text-lg"
                                        rows={4}
                                        placeholder="Bạn muốn nói về chủ đề gì?"
                                        value={newPost.content}
                                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
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
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
                                        onClick={handleCreatePost}
                                    >
                                        Post
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
                                                            {new Date(post.createAt).toLocaleDateString('vi-VN')}
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <button className="text-gray-600 hover:text-blue-600 transition-all">
                                                        <FontAwesomeIcon icon={faEllipsisH} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-gray-800">{post.content}</p>
                                                {post.postMedia && post.postMedia.length > 0 && (
                                                    <div className={`mt-3 grid ${post.postMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                                                        {post.postMedia
                                                            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                                                            .map((media) => (
                                                                <div
                                                                    key={`media-${post.postId}-${media.postMediaId}`}
                                                                    className="w-full h-96"
                                                                >
                                                                    {media.mediaUrl ? (
                                                                        <img
                                                                            src={media.mediaUrl}
                                                                            alt={`Post media ${media.displayOrder || 0}`}
                                                                            className="w-full h-full object-cover rounded-lg"
                                                                            onError={(e) => {
                                                                                e.target.onerror = null;
                                                                                e.target.src = "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg";
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <img
                                                                            src="https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg"
                                                                            alt="Post image"
                                                                            className="w-full h-full object-cover rounded-lg"
                                                                        />
                                                                    )}
                                                                </div>
                                                            ))}
                                                    </div>
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
                                                        className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                        onClick={() => toggleCommentSection(post.postId)}
                                                    >
                                                        <FontAwesomeIcon icon={farComment} className="mr-1" />
                                                        {postComments[post.postId]?.length || 0} Comment
                                                    </button>
                                                    <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
                                                        <FontAwesomeIcon icon={farShareSquare} className="mr-1" />
                                                        Share
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comment Section */}
                                        {openCommentPosts.includes(post.postId) && (
                                            <div className="px-6 pb-4">
                                                {/* Comment Input */}
                                                <div className="flex items-start gap-3 mb-4">
                                                    <img
                                                        src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        alt="Avatar"
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            value={commentContents[post.postId] || ''}
                                                            onChange={(e) => updateCommentContent(post.postId, e.target.value)}
                                                            placeholder="Thêm bình luận..."
                                                            className="w-full p-2 pl-4 pr-20 border rounded-full focus:outline-none focus:border-blue-500 bg-gray-100"
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
                                                            <button type="button" className="text-xl text-gray-500 hover:text-blue-500">
                                                                <FontAwesomeIcon icon={faSmile} />
                                                            </button>
                                                            <button type="button" className="text-xl text-gray-500 hover:text-blue-500">
                                                                <FontAwesomeIcon icon={faImage} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCreateComment(post.postId, commentContents[post.postId])}
                                                        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700"
                                                    >
                                                        Gửi
                                                    </button>
                                                </div>

                                                {/* Comments List */}
                                                <div className="max-h-96 overflow-y-auto mb-2">
                                                    {postComments[post.postId]?.filter(comment => comment !== null).map((comment, index) => (
                                                        <div key={`${post.postId}-${comment.commentId || index}`} className="flex gap-3 mb-5 group">
                                                            <img
                                                                src={comment?.account?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                alt="Avatar"
                                                                className="w-10 h-10 rounded-full mt-1"
                                                            />
                                                            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-semibold text-gray-900">{comment?.account?.firstName} {comment?.account?.lastName}</span>
                                                                </div>
                                                                <div className="text-gray-800 mb-2">{comment.content}</div>
                                                                <div className="flex gap-4 text-xs text-gray-500">
                                                                    <span>{getRelativeTime(comment.commentAt)}</span>
                                                                    <button className="hover:underline">Thích</button>
                                                                    <button className="hover:underline">Trả lời</button>
                                                                </div>
                                                            </div>
                                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 p-2">
                                                                <FontAwesomeIcon icon={faEllipsisH} />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Empty state for comments */}
                                                    {(!postComments[post.postId] || postComments[post.postId].length === 0) && (
                                                        <div className="text-center py-4 text-gray-500">
                                                            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <p className="text-gray-500 text-lg">Chưa có bài viết nào</p>
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
        </div>
    );
};

export default PublicProfile;






















