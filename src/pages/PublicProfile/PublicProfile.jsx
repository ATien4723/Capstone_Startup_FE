import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faCamera, faMapMarkerAlt,
    faImage, faPaperclip, faEllipsisH, faFileAlt, faGlobe, faBriefcase,
    faHeart, faComment, faShareSquare, faSmile, faTrash,
    faUserPlus, faUserCheck, faEyeSlash, faSearch, faBan, faUnlock, faEllipsisV
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faFacebook, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faHeart as farHeart, faComment as farComment, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import PostMediaGrid from '@/components/PostMedia/PostMediaGrid';
import CommentSection from '@/components/CommentSection/CommentSection';
import { formatPostTime } from '@/utils/dateUtils';
import PostDropdownMenu from '@/components/Dropdown/PostDropdownMenu';
import { useProfileData, usePostsData, usePostActions, useUIStates, useInfiniteScroll, useCheckIsFollowing } from '@/hooks/useProfileHooks';
import LikesModal, { LikeCounter } from '@/components/Common/LikesModal';
import { blockAccount, unblockAccount, getBlockedAccounts } from '@/apis/accountService';
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

// Profile Actions Dropdown Component
const ProfileActionsDropdown = ({ currentUserId, profileId, isBlocked, onToggleBlock }) => {
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
                                // Handle search posts
                                toast.info('Search functionality coming soon');
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
                    const blockedList = await getBlockedAccounts(currentUserId);
                    // Cấu trúc mới: [{blockedAccountId, blockedFullName, blockedAvatar}]
                    const isUserBlocked = blockedList?.some(blocked => blocked.blockedAccountId === parseInt(id));
                    setIsBlocked(!!isUserBlocked);
                } catch (error) {
                    console.error('Error checking block status:', error);
                }
            }
        };

        checkBlockStatus();
    }, [currentUserId, id]);

    // Handle block/unblock
    const handleToggleBlock = async () => {
        if (isBlockLoading) return;

        setIsBlockLoading(true);
        try {
            if (isBlocked) {
                await unblockAccount(currentUserId, id);
                setIsBlocked(false);
                toast.success(`Unblocked ${profileData?.firstName || 'user'} successfully`);
            } else {
                await blockAccount(currentUserId, id);
                setIsBlocked(true);
                toast.success(`Blocked ${profileData?.firstName || 'user'} successfully`);
            }
        } catch (error) {
            console.error('Error toggling block status:', error);
            toast.error('Failed to update block status');
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

    // Hàm để lấy và hiển thị danh sách người đã thích bài viết
    const handleShowLikes = (postId) => {
        setCurrentPostId(postId);
        setShowLikesModal(true);
    };

    // Hook quản lý các action với post
    const postActions = usePostActions(id, fetchPosts);

    // destructuring các biến cần thiết từ postActions
    const {
        showPostModal, setShowPostModal, newPost, setNewPost, postError, isCreatingPost,
        editingPost, setEditingPost, editedPostContent, setEditedPostContent,
        showDeleteConfirmModal, setShowDeleteConfirmModal, postToDelete, openDropdownPostId,
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
                        />
                    )}

                    {/* Follow Button - Hiển thị khi xem profile người khác */}
                    {currentUserId != id && (
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
                                    <button
                                        className={`px-6 py-2 font-semibold rounded-full shadow-sm focus:outline-none ${activeButton === 'media'
                                            ? 'bg-blue-600 text-white'
                                            : 'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                                            }`}
                                        onClick={() => handleTabChange('media')}
                                    >
                                        Media
                                    </button>
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
                                {currentUserId === id && editBio && (
                                    <Modal onClose={handleCloseBioModal}>
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
                                                    <div key={index} className="relative">
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
                                        {isCreatingPost ? 'Posting...' : 'Post'}
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
                                                    onEdit={setEditingPost}
                                                    onDelete={confirmDeletePost}
                                                    onHide={handleHidePost}
                                                    onShare={(post) => console.log('Share post:', post)}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-gray-800 ml-5">{post.content}</p>
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









