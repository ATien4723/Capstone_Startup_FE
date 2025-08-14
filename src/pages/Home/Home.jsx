import { useProfileData } from '@/hooks/useProfileHooks';
import { useNewsFeedData } from '@/hooks/useNewsFeedData';
import { usePostActions, useInfiniteScroll, useRecommendAccounts } from '@/hooks/useProfileHooks';
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEllipsisH, faImage, faPaperclip, faSmile, faPlus, faMapMarkerAlt, faEdit, faTrash, faShareSquare, faComment, faHeart, faEyeSlash,
    faBriefcase, faLocationDot, faClock, faUserPlus, faUserCheck, faCircle, faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { faComment as farComment, faHeart as farHeart, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getUserId, getUserInfoFromToken } from '@/apis/authService';
import PostMediaGrid from '@/components/PostMedia/PostMediaGrid';
import CommentSection from '@/components/CommentSection/CommentSection';
import { getRelativeTime, formatPostTime, formatDuration } from '@/utils/dateUtils';
import PostDropdownMenu from '@/components/Dropdown/PostDropdownMenu';
import { getPostLikesByPostId } from '@/apis/postService';
import LikesModal, { LikeCounter } from '@/components/Common/LikesModal';
import SharePostModal from '@/components/Common/SharePostModal';
import SharedPost from '@/components/PostMedia/SharedPost';
import { InteractionContext } from '@/contexts/InteractionContext.jsx';
import useFollow from '@/hooks/useFollow';
import useMessage from '@/hooks/useMessage';
import { getTopCVSubmittedInternshipPosts } from '@/apis/cvService';

// Modal component
const Modal = ({ children, onClose }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-modal-fade-in"
        onClick={(e) => {
            // Đóng modal khi click vào backdrop
            if (e.target === e.currentTarget) {
                onClose();
            }
        }}
    >
        <div
            className="bg-white rounded-xl w-full max-w-lg shadow-2xl relative animate-slide-in-up transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()} // Ngăn đóng modal khi click vào nội dung
        >
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
    const navigate = useNavigate();
    const currentUserId = getUserId();
    // Thêm state để theo dõi các bài đăng đã mở rộng nội dung
    const [expandedPosts, setExpandedPosts] = useState({});

    // Hàm để toggle hiển thị nội dung đầy đủ/rút gọn
    const togglePostContent = (postId) => {
        setExpandedPosts(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // Sử dụng hook useMessage để lấy danh sách phòng chat
    const {
        chatRooms,
        loading: loadingChatRooms,
        fetchChatRooms
    } = useMessage(currentUserId);

    // Gọi API lấy danh sách phòng chat khi component mount
    useEffect(() => {
        if (currentUserId) {
            fetchChatRooms(false);
        }
    }, [currentUserId, fetchChatRooms]);

    // Hàm chuyển đến trang tin nhắn với phòng chat đã chọn
    const goToChat = (chatRoomId) => {
        // Lưu chatRoomId vào localStorage để Messages.jsx có thể sử dụng sau khi chuyển trang
        localStorage.setItem('selectedChatRoomId', chatRoomId);
        // Chuyển trực tiếp đến URL của phòng chat
        navigate(`/messages/u/${chatRoomId}`);
    };

    const {
        profileData, following, followers, isLoading: isLoadingProfile
    } = useProfileData(currentUserId);

    // Hook cho Suggestions Card
    const {
        data: suggestedConnections,
        isLoading: isLoadingSuggestions,
        error: suggestionsError,
        refetch: refetchSuggestions
    } = useRecommendAccounts(currentUserId, 1, 5);

    // Hook cho Follow/Unfollow
    const {
        handleFollow,
        handleUnfollow,
        isFollowing,
        processingId,
        followingIds
    } = useFollow(currentUserId);



    // Hàm xử lý khi bấm nút follow
    const handleConnectUser = async (userId) => {
        if (isFollowing(userId)) {
            await handleUnfollow(userId);
        } else {
            await handleFollow(userId);
        }
        // Cập nhật lại danh sách gợi ý sau khi follow/unfollow
        refetchSuggestions();
    };



    const {
        posts, postLikes, userLikedPosts, postCommentCounts, openCommentPosts, refreshCommentTrigger,
        isLoading: isLoadingPosts, isLoadingMore,
        loadMorePosts, handleLikePost, toggleCommentSection, handleCommentCountChange,
        hasMore, fetchPosts
    } = useNewsFeedData(currentUserId);

    // State cho modal hiển thị danh sách người đã thích và chia sẻ bài viết
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [postToShare, setPostToShare] = useState(null);

    // Hàm để lấy và hiển thị danh sách người đã thích bài viết
    const handleShowLikes = (postId) => {
        setCurrentPostId(postId);
        setShowLikesModal(true);
    };

    // Hàm để mở modal chia sẻ bài viết
    const handleSharePost = (post) => {
        setPostToShare(post);
        setShowShareModal(true);
    };

    const postActions = usePostActions(currentUserId, fetchPosts);
    const {
        showPostModal, setShowPostModal, newPost, setNewPost, postError, isCreatingPost,
        editingPost, setEditingPost, editedPostContent, setEditedPostContent,
        showDeleteConfirmModal, setShowDeleteConfirmModal, postToDelete, openDropdownPostId,
        handleCreatePost, handleFileUpload, toggleDropdown, confirmDeletePost,
        handleDeletePost, handleUpdatePost, handleHidePost
    } = postActions;

    // const { lastElementRef } = useInfiniteScroll(loadMorePosts, true, isLoadingMore);

    const userInfo = getUserInfoFromToken();

    const { lastElementRef } = useInfiniteScroll(loadMorePosts, hasMore, isLoadingMore);

    // Đóng dropdown khi click ra ngoài
    // (giữ lại nếu còn dùng openDropdownPostId)
    // ...

    // Thêm hàm để đóng dropdown khi click ra ngoài
    //  useEffect(() => {
    //     const handleClickOutside = (event) => {
    //         if (openDropdownPostId && !event.target.closest('.post-menu-container')) {
    //             setOpenDropdownPostId(null);
    //         }
    //     };
    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutside);
    //     };
    // }, [openDropdownPostId]);

    const { likeTrigger, commentTrigger } = useContext(InteractionContext);
    useEffect(() => {
        fetchPosts(1);
    }, [likeTrigger, commentTrigger]);

    // Chuyển đến trang chi tiết bài đăng
    const goToPostDetail = (postId, type, startupId) => {
        if (type === 'Internship') {
            navigate(`/internship/${postId}`);
        } else if (type === 'StartupPost') {
            navigate(`/startup-detail/${startupId}`);
        } else {
            navigate(`/post/${postId}`);
        }
    };

    // Hiển thị icon dựa trên type của bài đăng
    const getPostTypeIcon = (type) => {
        switch (type) {
            case 'Internship':
                return <FontAwesomeIcon icon={faBriefcase} className="text-blue-500 mr-2" />;
            default:
                return null;
        }
    };

    // State cho trending internship posts
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [isLoadingTrending, setIsLoadingTrending] = useState(true);
    const [trendingError, setTrendingError] = useState(null);

    // Lấy danh sách top internship posts khi component mount
    useEffect(() => {
        const fetchTrendingPosts = async () => {
            try {
                setIsLoadingTrending(true);
                const response = await getTopCVSubmittedInternshipPosts(3);
                setTrendingPosts(response || []);
                setTrendingError(null);
            } catch (err) {
                console.error('Lỗi khi lấy danh sách top internship posts:', err);
                setTrendingError('Không thể tải dữ liệu trending');
            } finally {
                setIsLoadingTrending(false);
            }
        };

        fetchTrendingPosts();
    }, []);

    // Render UI
    if (isLoadingProfile) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <div className="ml-4 text-lg">Loading personal information...</div>
            </div>
        );
    }

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
                                {/* <p className="text-gray-600 text-sm">{profileData?.position || "No position"}</p> */}
                                <p className="text-gray-600 mb-3">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> {profileData?.position || "No location"}
                                </p>
                                <div className="grid grid-cols-3 mt-3">
                                    <div className="text-center">
                                        <div className="font-bold text-lg">{profileData?.postCount || 0}</div>
                                        <div className="text-gray-600">Posts</div>
                                    </div>
                                    <div className="text-center">
                                        <Link to="/network/following" className="block">
                                            <div className="font-bold text-lg hover:text-blue-600">{following?.length || 0}</div>
                                            <div className="text-gray-600 hover:text-blue-600">Follow</div>
                                        </Link>
                                    </div>
                                    <div className="text-center">
                                        <Link to="/network/followers" className="block">
                                            <div className="font-bold text-lg hover:text-blue-600">{followers?.length || 0}</div>
                                            <div className="text-gray-600 hover:text-blue-600">Followers</div>
                                        </Link>
                                    </div>
                                </div>
                                <Link
                                    to={`/profile/${currentUserId}`}
                                    className="inline-block mt-4 px-12 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                                >
                                    View Profile
                                </Link>

                                {/* About Me Section */}
                                {/* <div className="mt-4 text-left">
                                    <div className="flex justify-between items-center mb-3">
                                        <h6 className="font-semibold">About Me</h6>
                                    </div>
                                    <p className="text-gray-600">{profileData?.introTitle || "No introduction yet."}</p>
                                </div>
                            </div>
                        </div> */}

                                <div className="mt-6 text-left bg-gray-50 rounded-lg p-4">
                                    <h6 className="font-semibold text-gray-800 mb-2 flex items-center">
                                        <FontAwesomeIcon icon={faEdit} className="mr-2 text-blue-500" />
                                        About Me
                                    </h6>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {profileData?.introTitle || "Share something about yourself..."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Suggestions Card */}
                        <div className="bg-white rounded-xl shadow-md">
                            <div className="bg-gradient-to-r rounded-t-lg from-green-500 to-teal-500 p-4">
                                <h5 className="font-bold text-white flex items-center">
                                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                    People You May Know
                                </h5>
                            </div>
                            <div className="p-4">
                                {isLoadingSuggestions ? (
                                    <div className="flex justify-center py-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : suggestionsError ? (
                                    <div className="text-center py-3 text-sm text-red-500">Unable to load suggestions</div>
                                ) : suggestedConnections && suggestedConnections.length > 0 ? (
                                    suggestedConnections.slice(0, 5).map((suggestion) => (
                                        <div
                                            key={suggestion.accountId}
                                            className="flex items-center mb-3 p-2 hover:bg-gray-50 rounded-md transition-all"
                                        >
                                            <img
                                                src={suggestion.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                alt={suggestion.fullName}
                                                className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                                }}
                                            />
                                            <div className="ml-3 flex-grow">
                                                <div className="font-bold text-base">
                                                    <Link to={`/profile/${suggestion.accountId}`}>
                                                        {suggestion.fullName}
                                                    </Link>
                                                </div>
                                                <div className="text-gray-600 text-sm">{suggestion.position || "User"}</div>
                                            </div>
                                            <button
                                                className={`transition-all p-1.5 rounded-full flex items-center justify-center ${isFollowing(suggestion.accountId)
                                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                    }`}
                                                onClick={() => handleConnectUser(suggestion.accountId)}
                                                disabled={processingId === suggestion.accountId}
                                            >
                                                {processingId === suggestion.accountId ? (
                                                    <div className="w-4 h-4 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
                                                ) : isFollowing(suggestion.accountId) ? (
                                                    <FontAwesomeIcon icon={faUserCheck} />
                                                ) : (
                                                    <FontAwesomeIcon icon={faUserPlus} />
                                                )}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-3 text-sm text-gray-500">No suggested connections</div>
                                )}

                                <Link to="/network" className="block text-center mt-3 text-blue-600 text-sm hover:underline">
                                    See more
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
                                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                                    />
                                    <div className="flex-grow">
                                        <button
                                            className="block w-full text-left px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-all duration-300 hover:shadow-md"
                                            onClick={() => setShowPostModal(true)}
                                        >
                                            What would you like to talk about?
                                        </button>
                                        <div className="flex justify-between items-center mt-4">
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
                                                className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out transform"
                                                onClick={() => setShowPostModal(true)}
                                            >
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
                                            Delete post
                                        </button>
                                    </div>
                                </div>
                            </Modal>
                        )}

                        {/* Modal hiển thị danh sách người đã thích */}
                        <LikesModal
                            postId={currentPostId}
                            isOpen={showLikesModal}
                            onClose={() => setShowLikesModal(false)}
                        />

                        {/* Modal chia sẻ bài viết */}
                        <SharePostModal
                            isOpen={showShareModal}
                            onClose={() => {
                                setShowShareModal(false);
                                setPostToShare(null);
                            }}
                            post={postToShare}
                            profileData={profileData}
                            // onShareSuccess={fetchPosts}
                            onShareSuccess={() => fetchPosts(1)}
                        />

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
                                <div className="p-6 animate-slide-in-right">
                                    <textarea
                                        className="w-full border-none outline-none resize-none text-lg focus:ring-2 focus:ring-blue-300 rounded-lg p-2 transition-all duration-200"
                                        rows={4}
                                        placeholder="What would you like to talk about?"
                                        value={newPost.content}
                                        onChange={(e) => {
                                            setNewPost(prev => ({ ...prev, content: e.target.value }));
                                            if (postError) {
                                                setPostError('');
                                            }
                                        }}
                                    />
                                    {postError && (
                                        <div className="mt-2 text-red-500 text-sm bg-red-50 p-2 rounded-md">
                                            {postError}
                                        </div>
                                    )}
                                    {newPost.files.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2 animate-fade-in-up">
                                            {newPost.files.map((file, index) => (
                                                <div key={index} className="relative group animate-scale-in" >
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Upload ${index + 1}`}
                                                        className="w-20 h-20 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200"
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
                                            <FontAwesomeIcon icon={faImage} className="text-blue-500 size-8" />
                                        </label>
                                        <FontAwesomeIcon icon={faSmile} className="text-yellow-500 size-8" />
                                    </div>
                                </div>
                                <div className="flex justify-end p-4 border-t">
                                    <button
                                        className={`bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold ${isCreatingPost ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={handleCreatePost}
                                        disabled={isCreatingPost}
                                    >
                                        {isCreatingPost ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </Modal>
                        )}

                        {/* Modal chỉnh sửa bài viết */}
                        {editingPost && (
                            <Modal onClose={() => {
                                setEditingPost(null);
                                setEditedPostContent(undefined);
                            }}>
                                <div className="flex items-center gap-3 p-6 border-b">
                                    <img
                                        src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt="Avatar"
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <div className="font-semibold">{profileData?.firstName} {profileData?.lastName}</div>
                                        <div className="text-xs text-gray-500">Edit post</div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <textarea
                                        className="w-full border border-gray-300 outline-none resize-none text-lg p-3 rounded-lg"
                                        rows={4}
                                        placeholder="Post content..."
                                        value={editedPostContent === undefined ? editingPost.content : editedPostContent}
                                        onChange={(e) => setEditedPostContent(e.target.value)}
                                    />
                                    {editingPost.postMedia && editingPost.postMedia.length > 0 && (
                                        <div className="mt-4">
                                            <h3 className="text-sm font-medium text-gray-600 mb-2">Attached images/videos:</h3>
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
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
                                        onClick={() => {
                                            handleUpdatePost(editingPost.postId, editedPostContent === undefined ? editingPost.content : editedPostContent);
                                            setEditingPost(null);
                                        }}
                                    >
                                        Save changes
                                    </button>
                                </div>
                            </Modal>
                        )}

                        {/* Danh sách bài viết */}
                        <div className="space-y-6">
                            {isLoadingPosts ? (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-500 text-lg">Loading posts...</p>
                                </div>
                            ) : posts && posts.length > 0 ? (
                                posts.map((post, index) => (
                                    <div
                                        key={`post-${post.postId}-${index}`}
                                        ref={index === posts.length - 1 ? lastElementRef : null}
                                        className="bg-white rounded-lg shadow-md"
                                    >
                                        {post.type === 'Internship' ? (
                                            <div
                                                className="p-5 cursor-pointer border-2 border-blue-200 hover:border-blue-400 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                                                onClick={() => goToPostDetail(post.postId, post.type, post.startupId)}
                                            >
                                                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg font-medium text-sm">
                                                    Jobs
                                                </div>
                                                <div className="flex items-center mb-4">
                                                    <Link to={post.type === 'StartupPost' ? `/startup-detail/${post.startupId}` : `/profile/${post.accountID || post.userId}`}>
                                                        <img
                                                            src={post.avatarURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                            alt={post.name || post.fullName || post.firstName || "Unknown User"}
                                                            className="h-12 w-12 rounded-full object-cover mr-3 border-2 border-gray-100"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                                            }}
                                                        />
                                                    </Link>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <Link to={post.type === 'StartupPost' ? `/startup-detail/${post.startupId}` : `/profile/${post.accountID || post.userId}`}>
                                                                    <h5 className="font-medium">{post.name || post.fullName || post.firstName || "Unknown User"}</h5>
                                                                </Link>
                                                                <div className="text-xs text-gray-500 mt-2">
                                                                    {post.createdAt ? formatPostTime(post.createdAt) : (post.createAt ? formatPostTime(post.createAt) : "Unknown date")}
                                                                </div>
                                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                                                    <FontAwesomeIcon icon={faBriefcase} className="mr-1" />
                                                                    Pro
                                                                </span>

                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <h3 className="font-bold text-xl mb-3 text-gray-800 mt-2">{post.title || post.content.substring(0, 50)}</h3>

                                                <div className={`mb-4 ${!expandedPosts[post.postId] ? 'line-clamp-2' : ''}`}>
                                                    {post.content}
                                                </div>

                                                {post.content && post.content.length > 100 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
                                                            togglePostContent(post.postId);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 text-sm mb-4 font-medium"
                                                    >
                                                        {expandedPosts[post.postId] ? 'Collapse' : 'See more'}
                                                    </button>
                                                )}

                                                <div className="mb-4 flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg mt-4">
                                                    <div className="text-gray-600 flex items-center text-sm">
                                                        <FontAwesomeIcon icon={faLocationDot} className="mr-1.5 text-gray-500" />
                                                        {post.address}
                                                    </div>
                                                    <div className="text-gray-600 flex items-center text-sm ml-4">
                                                        <FontAwesomeIcon icon={faClock} className="mr-1.5 text-gray-500" />
                                                        {formatDuration(post.dueDate)}
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-center justify-between">
                                                    <button className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
                                                        <FontAwesomeIcon icon={faComment} className="mr-1.5" />
                                                        Why is this job right for you?
                                                    </button>
                                                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors">
                                                        Apply Now
                                                    </button>
                                                </div>

                                                {/* Hiển thị bài viết được chia sẻ nếu có */}
                                                {post.postShareId && (
                                                    <SharedPost postShareId={post.postShareId} />
                                                )}

                                                {/* Hiển thị media */}
                                                {post.postMedia && post.postMedia.length > 0 && (
                                                    <PostMediaGrid media={post.postMedia} />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-4">
                                                {/* Post header */}
                                                <div className="flex justify-between mb-3">
                                                    <div className="flex gap-3">
                                                        <Link to={post.type === 'StartupPost' ? `/startup-detail/${post.startupId}` : `/profile/${post.accountID || post.userId}`}>
                                                            <img
                                                                src={post.avatarURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                alt="Profile"
                                                                className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                                                }}
                                                            />
                                                        </Link>
                                                        <div>
                                                            <Link to={post.type === 'StartupPost' ? `/startup-detail/${post.startupId}` : `/profile/${post.accountID || post.userId}`}>
                                                                <h6 className="font-semibold mb-0 hover:underline">
                                                                    {post.name || post.fullName || post.firstName || "Unknown User"}
                                                                </h6>
                                                            </Link>
                                                            <small className="text-gray-600">
                                                                {post.createdAt ? formatPostTime(post.createdAt) : (post.createAt ? formatPostTime(post.createAt) : "Unknown date")}
                                                            </small>
                                                        </div>
                                                    </div>

                                                    <PostDropdownMenu
                                                        post={post}
                                                        currentUserIdHome={currentUserId}
                                                        isOpen={openDropdownPostId === post.postId}
                                                        onToggle={(isOpen) => toggleDropdown(post.postId, isOpen)}
                                                        onEdit={(post) => { setEditingPost(post); setEditedPostContent(undefined); }}
                                                        onDelete={confirmDeletePost}
                                                        onHide={handleHidePost}
                                                        onShare={handleSharePost}
                                                    />
                                                </div>
                                                <div>
                                                    {post.title && <h5 className="font-bold mb-2">{post.title}</h5>}
                                                    <p className={`text-gray-800 whitespace-pre-wrap break-words mb-3 ${!expandedPosts[post.postId] ? 'line-clamp-2' : ''}`}>{post.content}</p>
                                                    {post.content && post.content.length > 100 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
                                                                togglePostContent(post.postId);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 text-sm mb-3 font-medium"
                                                        >
                                                            {expandedPosts[post.postId] ? 'Collapse' : 'See more'}
                                                        </button>
                                                    )}

                                                    {/* Hiển thị bài viết được chia sẻ nếu có */}
                                                    {post.postShareId && (
                                                        <SharedPost postShareId={post.postShareId} />
                                                    )}

                                                    {/* Hiển thị media */}
                                                    {post.postMedia && post.postMedia.length > 0 && (
                                                        <PostMediaGrid media={post.postMedia} />
                                                    )}
                                                </div>

                                                {/* Hiển thị số lượng like và comment ở trên */}
                                                {(postLikes[post.postId] > 0 || postCommentCounts[post.postId] > 0) && (
                                                    <div className="flex justify-between items-center mt-3 mb-2 px-3">
                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                            <LikeCounter
                                                                postId={post.postId}
                                                                count={postLikes[post.postId]}
                                                                onClick={handleShowLikes}
                                                            />
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {postCommentCounts[post.postId] > 0 && (
                                                                <span>{postCommentCounts[post.postId]} comments</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Đường kẻ phân cách */}
                                                <hr className="my-2" />

                                                <div className="flex justify-between items-center mt-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                            onClick={() => handleLikePost(post.postId)}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={userLikedPosts[post.postId] ? faHeart : farHeart}
                                                                className={`mr-1 ${userLikedPosts[post.postId] ? 'text-red-500' : ''}`}
                                                            />
                                                            Like
                                                        </button>
                                                        <button
                                                            className={`px-3 py-1 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all ${openCommentPosts.includes(post.postId) ? 'bg-blue-100' : 'bg-gray-100'}`}
                                                            onClick={() => toggleCommentSection(post.postId)}
                                                        >
                                                            <FontAwesomeIcon icon={openCommentPosts.includes(post.postId) ? faComment : farComment} className="mr-1" />
                                                            Comment
                                                        </button>
                                                        <button
                                                            className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                            onClick={() => handleSharePost(post)}
                                                        >
                                                            <FontAwesomeIcon icon={farShareSquare} className="mr-1" />
                                                            Share
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Comment Section - chỉ hiển thị nếu không phải Internship */}
                                        {post.type !== 'Internship' && (
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
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <img
                                        src="/images/no-posts.svg"
                                        alt="No posts"
                                        className="w-32 h-32 mx-auto mb-4 opacity-60"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <p className="text-gray-600 text-lg font-medium mb-2">No posts yet</p>
                                    <p className="text-gray-500 mb-4">Share your experience now</p>
                                    <button
                                        onClick={() => setShowPostModal(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                                    >
                                        <FontAwesomeIcon icon={faEdit} className="mr-2" />
                                        Create new post
                                    </button>
                                </div>
                            )}

                            {/* Loading indicator cho load more */}
                            {isLoadingMore && (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Trending */}
                    <div className="space-y-6 hidden md:block md:col-span-1">
                        {/* Trending Card */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
                                <h5 className="font-bold text-white flex items-center">
                                    <FontAwesomeIcon icon={faBriefcase} className="mr-2" />
                                    Trending Internships
                                </h5>
                            </div>
                            <div className="p-4">
                                {isLoadingTrending ? (
                                    <div className="flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : trendingError ? (
                                    <div className="text-center py-3 text-sm text-red-500">
                                        Unable to load featured posts
                                    </div>
                                ) : trendingPosts && trendingPosts.length > 0 ? (
                                    <div className="space-y-4">
                                        {trendingPosts.map((post) => (
                                            <div key={post.internshipId} onClick={() => goToPostDetail(post.internshipId, 'Internship', post.startupId)} className="cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                                                <div className="flex items-center">
                                                    <img
                                                        src={post.logo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        alt="Startup logo"
                                                        className="w-10 h-10 rounded-full object-cover mr-3"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                                        }}
                                                    />
                                                    <div>
                                                        <h6 className="font-semibold text-sm">
                                                            {post.positionTitle || "Job"}
                                                        </h6>
                                                        <div className="text-xs text-gray-500 flex items-center mt-1">
                                                            <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                                                            {post.totalCVs || 0} CVs submitted
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-3 text-sm text-gray-500">
                                        No featured internship posts
                                    </div>
                                )}
                                <Link to="/startups" className="block w-full mt-4 text-center text-blue-600 text-sm font-medium hover:underline">
                                    See more internship opportunities
                                </Link>
                            </div>
                        </div>

                        {/* Messages Card */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <i className="fa-solid fa-messages text-white"></i>
                                        <h5 className="font-bold text-white">Messages</h5>
                                    </div>
                                    {/* <Link to="/messages" className="text-blue-100 hover:text-white text-sm transition-colors">
                                        View all
                                    </Link> */}
                                </div>
                            </div>
                            <div className="p-4">
                                {loadingChatRooms ? (
                                    <div className="flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : chatRooms && chatRooms.length > 0 ? (
                                    <div className="space-y-3">
                                        {chatRooms.slice(0, 3).map((room) => (
                                            <div
                                                key={room.chatRoomId}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                                            >
                                                <div className="relative">
                                                    <img
                                                        src={room.targetAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        alt={room.name || "Chat"}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    {room.hasUnread && (
                                                        <FontAwesomeIcon
                                                            icon={faCircle}
                                                            className="absolute bottom-0 right-0 text-green-500 text-xs bg-white rounded-full p-0.5"
                                                        />
                                                    )}
                                                </div>
                                                <div
                                                    className="flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => goToChat(room.chatRoomId)}
                                                >
                                                    <h6 className="font-semibold text-sm truncate">{room.targetName || "User"}</h6>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {room.latestMessageContent && (
                                                            room.latestMessageContent.toLowerCase().endsWith('.jpg') ||
                                                            room.latestMessageContent.toLowerCase().endsWith('.jpeg') ||
                                                            room.latestMessageContent.toLowerCase().endsWith('.png') ||
                                                            room.latestMessageContent.toLowerCase().endsWith('.gif') ||
                                                            room.latestMessageContent.toLowerCase().endsWith('.webp')
                                                        ) ? '🖼️ Picture' :
                                                            room.latestMessageContent && (
                                                                room.latestMessageContent.toLowerCase().endsWith('.mp4') ||
                                                                room.latestMessageContent.toLowerCase().endsWith('.webm') ||
                                                                room.latestMessageContent.toLowerCase().endsWith('.mov') ||
                                                                room.latestMessageContent.toLowerCase().endsWith('.avi') ||
                                                                (room.latestMessageContent.includes('cloudinary.com/') && room.latestMessageContent.includes('/video/'))
                                                            ) ? '🎬 Video' : room.latestMessageContent || "No messages yet"}
                                                    </p>
                                                </div>
                                                {room.latestMessageTime && (
                                                    <div className="text-xs text-gray-500 whitespace-nowrap">
                                                        {room.latestMessageTime ? getRelativeTime(room.latestMessageTime) : ''}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-3 text-sm text-gray-500">
                                        You have no messages yet
                                    </div>
                                )}
                                <Link to="/messages" className="block w-full mt-4 text-center text-blue-600 text-sm font-medium hover:underline">
                                    All messages
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default Home;
