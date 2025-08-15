import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faCamera, faMapMarkerAlt,
    faImage, faPaperclip, faEllipsisH, faFileAlt, faGlobe, faBriefcase,
    faHeart, faComment, faShareSquare, faSmile, faTrash,
    faUserPlus, faUserCheck, faEyeSlash, faSearch, faBan, faUnlock, faEllipsisV
} from '@fortawesome/free-solid-svg-icons';
import useMessage from '@/hooks/useMessage';
import { faLinkedin, faFacebook, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faHeart as farHeart, faComment as farComment, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import PostMediaGrid from '@/components/PostMedia/PostMediaGrid';
import CommentSection from '@/components/CommentSection/CommentSection';
import { formatPostTime } from '@/utils/dateUtils';
import PostDropdownMenu from '@/components/Dropdown/PostDropdownMenu';
import { useProfileData, usePostsData, usePostActions, useUIStates, useInfiniteScroll, useCheckIsFollowing } from '@/hooks/useProfileHooks';
import LikesModal, { LikeCounter } from '@/components/Common/LikesModal';
import { blockAccount, unblockAccount, CheckIsBlocked } from '@/apis/accountService';
import { getUserId } from '@/apis/authService';
import { toast } from 'react-toastify';

import SharePostModal from '@/components/Common/SharePostModal';
import SharedPost from '@/components/PostMedia/SharedPost';
import { getPostsByAccountId } from '@/apis/postService';

// Modal component
const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-modal-fade-in">
        <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl relative animate-slide-in-up transform transition-all duration-300">
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

// Profile Actions Dropdown Component
const ProfileActionsDropdown = ({ currentUserId, profileId, isBlocked, onToggleBlock, onSearchPosts }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleClickOutside = (e) => {
        if (!e.target.closest('.profile-dropdown')) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    if (currentUserId === profileId) return null;

    return (
        <div className="profile-dropdown relative">
            <button
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                onClick={toggleDropdown}
            >
                <FontAwesomeIcon icon={faEllipsisV} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                    <div className="py-1">
                        <button
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                                onSearchPosts();
                                setIsOpen(false);
                            }}
                        >
                            <FontAwesomeIcon icon={faSearch} className="mr-2" />
                            Search posts
                        </button>

                        <button
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                                onToggleBlock();
                                setIsOpen(false);
                            }}
                        >
                            <FontAwesomeIcon icon={isBlocked ? faUnlock : faBan} className="mr-2" />
                            {isBlocked ? 'Unblock user' : 'Block user'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PublicProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    // Thêm state để theo dõi các bài đăng đã mở rộng nội dung
    const [expandedPosts, setExpandedPosts] = useState({});

    // Lấy ID người dùng hiện tại
    const currentUserIdForChat = getUserId();

    // Hook để sử dụng chức năng nhắn tin
    const { ensureChatRoom } = useMessage(currentUserIdForChat);

    // Hàm xử lý khi bấm nút nhắn tin
    const handleStartChat = async () => {
        try {
            const result = await ensureChatRoom(id);
            // console.log("Kết quả tạo phòng chat:", result);

            if (result) {
                localStorage.setItem('selectedChatRoomId', result);
                navigate('/messages');
            } else {
                toast.error('Không thể tạo phòng chat. Vui lòng thử lại sau!');
            }
        } catch (error) {
            console.error('Lỗi khi tạo phòng chat:', error);
            toast.error('Không thể tạo phòng chat. Vui lòng thử lại sau!');
        }
    };

    // Hàm để toggle hiển thị nội dung đầy đủ/rút gọn
    const togglePostContent = (postId) => {
        setExpandedPosts(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // Hook quản lý profile
    const {
        profileData, following, followers, isLoading, followLoading,
        currentUserData, currentUserId, formData, setFormData,
        handleFollowToggle, handleUpdateBio, handleUpdateCover, handleUpdateAvatar
    } = useProfileData(id);

    // State for block functionality
    const [isBlocked, setIsBlocked] = useState(false);
    const [isBlockLoading, setIsBlockLoading] = useState(false);

    // Check if user is blocked
    useEffect(() => {
        const checkBlockStatus = async () => {
            if (currentUserId && id && currentUserId !== id) {
                try {
                    const response = await CheckIsBlocked(currentUserId, id);
                    const isUserBlocked = !!response;
                    setIsBlocked(isUserBlocked);

                    // Nếu đã block user này, chuyển hướng về trang chủ
                    if (isUserBlocked) {
                        toast.info('You cant view this profile', {
                            toastId: 'blocked-user-access'
                        });
                        navigate('/home'); // Chuyển về trang chủ
                        return;
                    }
                } catch (error) {
                    console.error('Error checking block status:', error);
                    setIsBlocked(false);
                }
            }
        };

        checkBlockStatus();
    }, [currentUserId, id, navigate]);

    // Handle block/unblock
    const handleToggleBlock = async () => {
        if (isBlockLoading) return;

        setIsBlockLoading(true);
        try {
            if (isBlocked) {
                await unblockAccount(currentUserId, id);
                setIsBlocked(false);
                toast.success(`Đã bỏ chặn ${profileData?.firstName || 'người dùng'} thành công`);
            } else {
                await blockAccount(currentUserId, id);
                setIsBlocked(true);
                toast.success(`Đã chặn ${profileData?.firstName || 'người dùng'} thành công. Đang chuyển về trang chủ...`);

                // Chuyển hướng về trang chủ sau khi block
                setTimeout(() => {
                    navigate('/');
                }, 100);
            }
        } catch (error) {
            console.error('Error toggling block status:', error);
            toast.error('Không thể cập nhật trạng thái chặn');
        } finally {
            setIsBlockLoading(false);
        }
    };

    // Sử dụng hook kiểm tra trạng thái follow
    const [followStatusChanged, setFollowStatusChanged] = useState(0);
    const { isFollowing, isLoading: isCheckingFollow } = useCheckIsFollowing(currentUserId, id, followStatusChanged);

    // Hook quản lý UI
    const {
        activeButton, previousActiveButton, editBio, setEditBio,
        handleTabChange, handleCloseBioModal
    } = useUIStates();

    // Hook quản lý posts
    const {
        posts, setPosts, postLikes, userLikedPosts, postCommentCounts, openCommentPosts, refreshCommentTrigger,
        pageNumber, hasMore, isLoading: isLoadingPosts, isLoadingMore, observer,
        loadMorePosts, handleLikePost, toggleCommentSection, handleCommentCountChange, fetchPosts
    } = usePostsData(id, currentUserId);

    // State cho modal hiển thị danh sách người đã thích
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);

    // State cho About me expand/collapse
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);
    const [postToShare, setPostToShare] = useState(null);

    // State cho chức năng tìm kiếm bài viết
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchPagination, setSearchPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
    });

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

    // Hàm xử lý tìm kiếm bài viết của user này
    const handleSearchPosts = async (query = searchQuery, page = 1) => {
        if (!query.trim()) {
            toast.warning('Please enter a search term');
            return;
        }

        setIsSearching(true);
        try {
            // Lấy tất cả bài viết của user này với số lượng lớn để tìm kiếm
            const response = await getPostsByAccountId(id, 1, 1000); // Lấy tối đa 1000 bài viết

            if (response && response.items) {
                // Tìm kiếm client-side trong bài viết của user
                const allUserPosts = response.items;
                const filteredPosts = allUserPosts.filter(post => {
                    const searchLower = query.toLowerCase();
                    return (
                        (post.content && post.content.toLowerCase().includes(searchLower)) ||
                        (post.title && post.title.toLowerCase().includes(searchLower))
                    );
                });

                // Thực hiện phân trang client-side
                const totalItems = filteredPosts.length;
                const totalPages = Math.ceil(totalItems / searchPagination.pageSize);
                const startIndex = (page - 1) * searchPagination.pageSize;
                const endIndex = startIndex + searchPagination.pageSize;
                const paginatedResults = filteredPosts.slice(startIndex, endIndex);

                setSearchResults(paginatedResults);
                setSearchPagination({
                    currentPage: page,
                    pageSize: searchPagination.pageSize,
                    totalItems: totalItems,
                    totalPages: totalPages
                });

                if (filteredPosts.length === 0) {
                    toast.info('No posts found matching your search');
                }
            } else {
                setSearchResults([]);
                setSearchPagination({
                    currentPage: 1,
                    pageSize: searchPagination.pageSize,
                    totalItems: 0,
                    totalPages: 0
                });
                toast.info('No posts found');
            }
        } catch (error) {
            console.error('Error searching posts:', error);
            toast.error('Failed to search posts');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Hàm mở modal tìm kiếm
    const handleOpenSearchModal = () => {
        setShowSearchModal(true);
        setSearchQuery('');
        setSearchResults([]);
        setSearchPagination({
            currentPage: 1,
            pageSize: 10,
            totalItems: 0,
            totalPages: 0
        });
    };

    // Hàm đóng modal tìm kiếm
    const handleCloseSearchModal = () => {
        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Hook quản lý các action với post
    const postActions = usePostActions(id, fetchPosts);

    // destructuring các biến cần thiết từ postActions
    const {
        showPostModal, setShowPostModal, newPost, setNewPost, postError, setPostError, isCreatingPost,
        editingPost, setEditingPost, editedPostContent, setEditedPostContent,
        showDeleteConfirmModal, setShowDeleteConfirmModal, postToDelete, setPostToDelete, openDropdownPostId,
        handleCreatePost, handleFileUpload, toggleDropdown, confirmDeletePost,
        handleDeletePost, handleUpdatePost, handleHidePost
    } = postActions;

    // Infinite scroll
    const { lastElementRef } = useInfiniteScroll(loadMorePosts, hasMore, isLoadingMore);

    const fileInputRef = useRef(null);
    const avatarInputRef = useRef(null);

    // Hàm mới để xử lý toggle và cập nhật trạng thái follow
    const handleFollowToggleWithRefresh = async () => {
        await handleFollowToggle();
        setFollowStatusChanged(prev => prev + 1);
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
                    src={profileData.backgroundUrl || "aaaa"}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                {/* Gradient shadow bottom */}
                {/* <div className="absolute left-0 right-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div> */}

                {/* Buttons container */}
                <div className="absolute bottom-4 right-8 flex gap-3 z-10">
                    {/* Profile Actions Dropdown - only show when viewing other's profile */}
                    {currentUserId != id && (
                        <ProfileActionsDropdown
                            currentUserId={currentUserId}
                            profileId={id}
                            isBlocked={isBlocked}
                            onToggleBlock={handleToggleBlock}
                            onSearchPosts={handleOpenSearchModal}
                        />
                    )}

                    {/* Follow Button - Hiển thị khi xem profile người khác */}
                    {currentUserId != id && (
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 transition-colors ${isFollowing
                                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                onClick={handleFollowToggleWithRefresh}
                                disabled={followLoading || isCheckingFollow}
                            >
                                <FontAwesomeIcon icon={isFollowing ? faUserCheck : faUserPlus} />
                                {followLoading || isCheckingFollow ? 'Processing...' : isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 transition-colors bg-green-600 text-white hover:bg-green-700"
                                onClick={handleStartChat}
                            >
                                <FontAwesomeIcon icon={faComment} />
                                <span>Message</span>
                            </button>
                        </div>
                    )}

                    {/* Edit Cover Button - Chỉ hiển thị khi xem profile của chính mình */}
                    {currentUserId === id && (
                        <>
                            <button
                                className="bg-white px-4 py-2 rounded-lg text-gray-800 font-medium shadow flex items-center gap-2 hover:bg-gray-100"
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            >
                                <FontAwesomeIcon icon={faCamera} /> Edit cover
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        await handleUpdateCover(file);
                                    }
                                }}
                            />
                        </>
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
                                                className="w-40 h-40 rounded-full border-4 border-white bg-gray-200 object-cover shadow cursor-pointer"
                                                onClick={() => {
                                                    if (currentUserId === id && avatarInputRef.current) avatarInputRef.current.click();
                                                }}
                                            />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                ref={avatarInputRef}
                                                style={{ display: 'none' }}
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        await handleUpdateAvatar(file);
                                                    }
                                                }}
                                            />
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
                                        onClick={() => handleTabChange('all')}
                                    >
                                        All Post
                                    </button>
                                    {/* <button
                                        className={`px-6 py-2 font-semibold rounded-full shadow-sm focus:outline-none ${activeButton === 'media'
                                            ? 'bg-blue-600 text-white'
                                            : 'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                                            }`}
                                        onClick={() => handleTabChange('media')}
                                    >
                                        Media
                                    </button> */}
                                    {currentUserId === id && (
                                        <button
                                            className={`px-6 py-2 font-semibold rounded-full shadow-sm focus:outline-none ${activeButton === 'bio'
                                                ? 'bg-blue-600 text-white'
                                                : 'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                                                }`}
                                            onClick={() => handleTabChange('bio')}
                                        >
                                            Update Bio
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 mb-4">
                                    <div className="text-center">
                                        <h6 className="font-semibold">Posts</h6>
                                        <span>{profileData.postCount || 0}</span>
                                    </div>
                                    <div className="text-center">
                                        <Link to="/network/following" className="block">
                                            <div className="font-semibold hover:text-blue-600">Follow</div>
                                            <div className=" hover:text-blue-600">{following?.length || 0}</div>
                                        </Link>
                                    </div>
                                    <div className="text-center">
                                        <Link to="/network/followers" className="block">
                                            <div className="font-semibold hover:text-blue-600">Followers</div>
                                            <div className=" text-lg hover:text-blue-600">{followers?.length || 0}</div>
                                        </Link>
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
                                    {profileData.introTitle && (
                                        <div className="text-gray-600">
                                            {(() => {
                                                const maxLength = 100; // Giới hạn ký tự
                                                const text = profileData.introTitle;

                                                if (text.length <= maxLength) {
                                                    return <p className="break-words whitespace-pre-wrap">{text}</p>;
                                                }

                                                return (
                                                    <div>
                                                        <p className="break-words whitespace-pre-wrap">
                                                            {isAboutExpanded ? text : `${text.substring(0, maxLength)}...`}
                                                        </p>
                                                        <button
                                                            onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 transition-colors"
                                                        >
                                                            {isAboutExpanded ? 'See less' : 'See more'}
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                                {/* Update Bio Button and Modal */}
                                {currentUserId === id && editBio && (
                                    <Modal onClose={handleCloseBioModal}>
                                        <h2 className="text-xl font-bold mb-4">Update Bio</h2>
                                        <textarea value={formData.introTitle} onChange={e => setFormData(f => ({ ...f, introTitle: e.target.value }))} placeholder="Intro Title" className="input mb-2 w-full border p-2 rounded resize-y" rows={3} />
                                        <input value={formData.position} onChange={e => setFormData(f => ({ ...f, position: e.target.value }))} placeholder="Position" className="input mb-2 w-full border p-2 rounded resize-y" rows={2} />
                                        <textarea value={formData.workplace} onChange={e => setFormData(f => ({ ...f, workplace: e.target.value }))} placeholder="Workplace" className="input mb-2 w-full border p-2 rounded resize-y" rows={2} />
                                        <input value={formData.facebookUrl} onChange={e => setFormData(f => ({ ...f, facebookUrl: e.target.value }))} placeholder="Facebook URL" className="input mb-2 w-full border p-2 rounded" />
                                        <input value={formData.linkedinUrl} onChange={e => setFormData(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="LinkedIn URL" className="input mb-2 w-full border p-2 rounded" />
                                        <input value={formData.githubUrl} onChange={e => setFormData(f => ({ ...f, githubUrl: e.target.value }))} placeholder="GitHub URL" className="input mb-2 w-full border p-2 rounded" />
                                        <input value={formData.portfolioUrl} onChange={e => setFormData(f => ({ ...f, portfolioUrl: e.target.value }))} placeholder="Portfolio URL" className="input mb-2 w-full border p-2 rounded" />
                                        <input value={formData.country} onChange={e => setFormData(f => ({ ...f, country: e.target.value }))} placeholder="Country" className="input mb-2 w-full border p-2 rounded resize-y" rows={2} />
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                                                onClick={async () => {
                                                    await handleUpdateBio();
                                                    handleCloseBioModal();
                                                }}
                                            >
                                                Save Bio
                                            </button>
                                            <button
                                                className="px-4 py-2"
                                                onClick={handleCloseBioModal}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </Modal>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Posts */}
                    <div className="lg:col-span-2">
                        {/* Posts Filter */}

                        {/* Create Post Card */}
                        {currentUserId === id && (
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
                                                    <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                        onClick={() => setShowPostModal(true)}
                                                    >
                                                        <FontAwesomeIcon icon={faImage} className="mr-1" /> Photo/Video
                                                    </button>
                                                    <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                        onClick={() => setShowPostModal(true)}>
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
                        )}

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

                        {/* Modal hiển thị danh sách người đã thích */}
                        <LikesModal
                            postId={currentPostId}
                            isOpen={showLikesModal}
                            onClose={() => setShowLikesModal(false)}
                        />

                        {/* Modal chia sẻ bài viết */}
                        <SharePostModal
                            isOpen={showShareModal}
                            onClose={() => setShowShareModal(false)}
                            post={postToShare}
                            profileData={currentUserData}
                            onShareSuccess={fetchPosts}
                        />

                        {showPostModal && (
                            <Modal onClose={() => {
                                setShowPostModal(false);
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
                                        <div className="text-xs text-gray-500">Posting publicly</div>
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
                                                    Cannot post
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
                                        placeholder="What would you like to talk about?"
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
                                            {newPost.files.map((file, index) => {
                                                const isVideo = file.type && file.type.startsWith('video/');
                                                return (
                                                    <div key={index} className="relative group animate-scale-in">
                                                        {isVideo ? (
                                                            <video
                                                                src={URL.createObjectURL(file)}
                                                                controls
                                                                className="w-20 h-20 object-cover rounded"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                alt={`Upload ${index + 1}`}
                                                                className="w-20 h-20 object-cover rounded"
                                                            />
                                                        )}
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
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mt-4">
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,video/*"
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
                                        {isCreatingPost ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </Modal>
                        )}

                        {/* Search Posts Modal */}
                        {showSearchModal && (
                            <Modal onClose={handleCloseSearchModal}>
                                <div className="p-6">
                                    <h2 className="text-xl font-bold mb-4">Search Posts</h2>

                                    {/* Search Input */}
                                    <div className="mb-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter search keywords..."
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearchPosts()}
                                            />
                                            <button
                                                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${isSearching
                                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                                onClick={() => handleSearchPosts()}
                                                disabled={isSearching}
                                            >
                                                {isSearching && (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                )}
                                                <FontAwesomeIcon icon={faSearch} />
                                                {isSearching ? 'Searching...' : 'Search'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Search Results */}
                                    <div className="max-h-96 overflow-y-auto">
                                        {searchResults.length > 0 ? (
                                            <div className="space-y-4">
                                                {searchResults.map((post) => (
                                                    <div key={post.postId} className="border border-gray-200 rounded-lg p-4">
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <img
                                                                src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                alt="Profile"
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                            <div className="flex-1">
                                                                <h6 className="font-semibold">{profileData?.firstName} {profileData?.lastName}</h6>
                                                                <small className="text-gray-600">
                                                                    {post.createAt ? formatPostTime(post.createAt) : "Unknown date"}
                                                                </small>
                                                            </div>
                                                        </div>

                                                        {post.title && <h5 className="font-bold mb-2">{post.title}</h5>}
                                                        <p className="text-gray-800 mb-3 line-clamp-3">{post.content}</p>

                                                        {post.postMedia && post.postMedia.length > 0 && (
                                                            <PostMediaGrid media={post.postMedia} />
                                                        )}

                                                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                                            <span>{post.likeCount || 0} likes</span>
                                                            <span>{post.commentCount || 0} comments</span>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Pagination for search results */}
                                                {searchPagination.totalPages > 1 && (
                                                    <div className="flex justify-center items-center gap-2 mt-4">
                                                        <button
                                                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                                                            disabled={searchPagination.currentPage === 1 || isSearching}
                                                            onClick={() => handleSearchPosts(searchQuery, searchPagination.currentPage - 1)}
                                                        >
                                                            Previous
                                                        </button>
                                                        <span className="text-sm text-gray-600">
                                                            Page {searchPagination.currentPage} of {searchPagination.totalPages}
                                                        </span>
                                                        <button
                                                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                                                            disabled={searchPagination.currentPage === searchPagination.totalPages || isSearching}
                                                            onClick={() => handleSearchPosts(searchQuery, searchPagination.currentPage + 1)}
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                {isSearching ? 'Searching...' : 'No posts found. Try different keywords.'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Info */}
                                    {searchResults.length > 0 && (
                                        <div className="mt-4 text-sm text-gray-600 text-center">
                                            Found {searchPagination.totalItems} posts
                                        </div>
                                    )}
                                </div>
                            </Modal>
                        )}

                        {/* Posts List */}
                        <div className="space-y-6">
                            {posts && posts.length > 0 ? (
                                posts.map((post, index) => (
                                    <div
                                        key={`post-${post.postId}-${index}`}
                                        ref={index === posts.length - 1 ? lastElementRef : null}
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
                                                <PostDropdownMenu
                                                    post={post}
                                                    currentUserId={currentUserId}
                                                    isOpen={openDropdownPostId === post.postId}
                                                    onToggle={(isOpen) => toggleDropdown(post.postId, isOpen)}
                                                    onEdit={(post) => {
                                                        console.log('🔄 Starting edit for post:', post);
                                                        setEditingPost(post);
                                                        setEditedPostContent(post.content || ''); // Khởi tạo với nội dung hiện tại
                                                        console.log('🔄 Initialized editedPostContent with:', post.content);
                                                    }}
                                                    onDelete={confirmDeletePost}
                                                    onHide={handleHidePost}
                                                    onShare={handleSharePost}
                                                />
                                            </div>
                                            <div>
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
                                                            {expandedPosts[post.postId] ? 'Thu gọn' : 'Xem thêm'}
                                                        </button>
                                                    )}

                                                    {/* Hiển thị bài viết được chia sẻ nếu có */}
                                                    {post.postShareId && (
                                                        <SharedPost postShareId={post.postShareId} />
                                                    )}

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
                                    </div>
                                ))
                            ) : isLoadingPosts ? (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-500 text-lg">Loading posts...</p>
                                </div>
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
                                    <p className="text-gray-500 mb-4">
                                        {id === currentUserId ?
                                            "Share your experience now" :
                                            `${profileData?.firstName || 'This user'} hasn't posted anything yet`}
                                    </p>
                                    {id === currentUserId && (
                                        <button
                                            onClick={() => setShowPostModal(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                                        >
                                            <FontAwesomeIcon icon={faEdit} className="mr-2" />
                                            Create new post
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
                            <div className="text-xs text-gray-500">Edit post</div>
                        </div>
                    </div>
                    <div className="p-6">
                        <textarea
                            className="w-full border border-gray-300 outline-none resize-none text-lg p-3 rounded-lg"
                            rows={4}
                            placeholder="Post content..."
                            value={editedPostContent || editingPost.content}
                            onChange={(e) => setEditedPostContent(e.target.value)}
                        />
                        {editingPost.postMedia && editingPost.postMedia.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Attached media:</h3>
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
                            Cancel
                        </button>
                        <button
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                            onClick={() => {
                                handleUpdatePost(editingPost.postId, editedPostContent || editingPost.content);
                                setEditingPost(null);
                                setEditedPostContent('');
                            }}
                        >
                            Update
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default PublicProfile;









