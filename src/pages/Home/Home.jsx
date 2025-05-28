import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faPlus, faImage, faPaperclip, faHeart, faComment, faEye, faEnvelope, faSmile, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart, faComment as farComment, faEnvelope as farEnvelope } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getUserId, getUserInfoFromToken } from '@/apis/authService';
import { createPost, getPostsByAccountId, likePost, unlikePost, getPostLikeCount, isPostLiked, createPostComment, getPostCommentsByPostId } from '@/apis/postService';
import { getAccountInfo, getFollowing, getFollowers } from '@/apis/accountService';
import { toast } from 'react-toastify';

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

    // Thêm state cho thông tin profile
    const [profileData, setProfileData] = useState(null);
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);

    // Fetch user profile data khi component mount
    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUserId) return;

            try {
                const [accountInfo, followingData, followersData] = await Promise.all([
                    getAccountInfo(currentUserId),
                    getFollowing(currentUserId),
                    getFollowers(currentUserId)
                ]);

                setProfileData(accountInfo);
                setFollowing(followingData || []);
                setFollowers(followersData || []);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, [currentUserId]);

    // Thêm các hàm và useEffect cần thiết cho infinite scrolling

    // // Hàm fetch posts với phân trang
    // const fetchPosts = async (page) => {
    //     try {
    //         const response = await getPostsByAccountId(currentUserId, page, pageSize);
    //         if (response && response.items) {
    //             if (page === 1) {
    //                 setPosts(response.items);
    //             } else {
    //                 setPosts(prevPosts => [...prevPosts, ...response.items]);
    //             }
    //             setHasMore(response.items.length === pageSize);

    //             // Lấy thông tin likes cho mỗi post mới
    //             response.items.forEach(async (post) => {
    //                 const likeCount = await getPostLikeCount(post.postId);
    //                 setPostLikes(prev => ({
    //                     ...prev,
    //                     [post.postId]: likeCount
    //                 }));
    //             });
    //         } else {
    //             setHasMore(false);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching posts:', error);
    //         toast.error('Failed to load posts');
    //         setHasMore(false);
    //     }
    // };

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
    // useEffect(() => {
    //     if (pageNumber === 1) {
    //         setIsLoading(true);
    //         fetchPosts(1).finally(() => {
    //             setIsLoading(false);
    //         });
    //     } else {
    //         fetchPosts(pageNumber).finally(() => {
    //             setIsLoadingMore(false);
    //         });
    //     }
    // }, [pageNumber, currentUserId]);

    // Hàm xử lý tạo bài viết mới
    const handleCreatePost = async () => {
        if (!newPost.content.trim()) {
            toast.error('Please enter some content for your post');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('content', newPost.content);
            newPost.files.forEach(file => {
                formData.append('files', file);
            });
            formData.append('accountId', currentUserId);

            // Hiển thị thông báo đang xử lý
            toast.info('Creating post...');

            // Tạo post mới
            const result = await createPost(formData);

            // Reset form trước khi refresh
            setNewPost({ content: '', files: [] });
            setShowPostModal(false);

            // Gọi API để lấy danh sách posts mới nhất
            const postsData = await getPostsByAccountId(currentUserId, 1, pageSize);

            if (postsData && Array.isArray(postsData.items)) {
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
                    } catch (error) {
                        console.error('Error fetching post details:', error);
                    }
                }
            }

            toast.success('Post created successfully');
        } catch (error) {
            toast.error('Failed to create post');
            console.error('Error creating post:', error);
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
                            <Modal onClose={() => setShowPostModal(false)}>
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
                                        className="w-full border-none outline-none resize-none text-lg"
                                        rows={4}
                                        placeholder="What would you like to talk about?"
                                        value={newPost.content}
                                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                                    />
                                    {newPost.files.length > 0 && (
                                        <div className="mt-4 border rounded-lg p-3">
                                            <div className="font-semibold mb-2">Attached files:</div>
                                            <ul className="list-disc pl-5">
                                                {newPost.files.map((file, index) => (
                                                    <li key={index} className="text-sm text-gray-600">{file.name}</li>
                                                ))}
                                            </ul>
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

                        {/* PostList 
                        <div className="space-y-6">
                            {posts && posts.length > 0 ? (
                                posts.map((post, index) => (
                                    <div
                                        key={`post-${post.postId}-${index}`}
                                        ref={index === posts.length - 1 ? lastPostElementRef : null}
                                        className="bg-white rounded-lg shadow-md mb-6"
                                    >
                                        <div className="p-4">
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
                                                            {post.createAt ? new Date(post.createAt).toLocaleDateString() : "Unknown date"}
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
                                                {post.title && <h5 className="font-bold mb-2">{post.title}</h5>}
                                                <p className="text-gray-800">{post.content}</p>
                                                {post.postMedia && post.postMedia.length > 0 && (
                                                    <div className={`mt-3 grid ${post.postMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                                                        {post.postMedia.map((media) => (
                                                            <div
                                                                key={`media-${post.postId}-${media.postMediaId}`}
                                                                className="w-full h-60"
                                                            >
                                                                <img
                                                                    src={media.mediaUrl}
                                                                    alt="Post media"
                                                                    className="w-full h-full object-cover rounded-lg"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg";
                                                                    }}
                                                                />
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
                                                </div>
                                            </div>
                                        </div>

                                        {openCommentPosts.includes(post.postId) && (
                                            <div className="px-4 pb-4">
                                                <div className="flex items-start gap-3 mb-4">
                                                    <img
                                                        src={profileData?.avatarUrl || "/api/placeholder/40/40"}
                                                        alt="Avatar"
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            value={commentContents[post.postId] || ''}
                                                            onChange={(e) => setCommentContents(prev => ({
                                                                ...prev,
                                                                [post.postId]: e.target.value
                                                            }))}
                                                            placeholder="Add a comment..."
                                                            className="w-full p-2 pl-4 pr-20 border rounded-full focus:outline-none focus:border-blue-500 bg-gray-100"
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
                                                            <button type="button" className="text-xl text-gray-500 hover:text-blue-500">
                                                                <FontAwesomeIcon icon={faSmile} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                                                                onClick={() => handleCreateComment(post.postId, commentContents[post.postId] || '')}
                                                            >
                                                                Post
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 ml-12">
                                                    {postComments[post.postId] && postComments[post.postId].length > 0 ? (
                                                        postComments[post.postId].map((comment) => (
                                                            <div key={comment.commentId} className="group flex gap-3">
                                                                <img
                                                                    src={comment.avatarUrl || "/api/placeholder/32/32"}
                                                                    alt="Avatar"
                                                                    className="w-8 h-8 rounded-full"
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="bg-gray-100 p-3 rounded-lg">
                                                                        <div className="font-semibold text-sm">{comment.firstName} {comment.lastName}</div>
                                                                        <p className="text-sm text-gray-700">{comment.content}</p>
                                                                    </div>
                                                                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                                                        <span>{new Date(comment.commentAt).toLocaleDateString()}</span>
                                                                        <button className="hover:underline">Like</button>
                                                                        <button className="hover:underline">Reply</button>
                                                                    </div>
                                                                </div>
                                                                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 p-2">
                                                                    <FontAwesomeIcon icon={faEllipsisH} />
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500">
                                                            No comments yet. Be the first to comment!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <p className="text-gray-500 text-lg">No posts yet</p>
                                </div>
                            )}
                        </div> */}

                        {/* Thay thế tạm thời */}
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <p className="text-gray-500 text-lg">Danh sách bài viết đang được cập nhật</p>
                        </div>
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
