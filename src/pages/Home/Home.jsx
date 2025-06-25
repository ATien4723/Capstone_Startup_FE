import { useProfileData } from '@/hooks/useProfileHooks';
import { useNewsFeedData } from '@/hooks/useNewsFeedData';
import { usePostActions, useInfiniteScroll } from '@/hooks/useProfileHooks';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEllipsisH, faImage, faPaperclip, faSmile, faPlus, faMapMarkerAlt, faEdit, faTrash, faShareSquare, faComment, faHeart, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { faComment as farComment, faHeart as farHeart, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getUserId, getUserInfoFromToken } from '@/apis/authService';
import PostMediaGrid from '@/components/PostMedia/PostMediaGrid';
import CommentSection from '@/components/CommentSection/CommentSection';
import { getRelativeTime, formatPostTime } from '@/utils/dateUtils';
import PostDropdownMenu from '@/components/Dropdown/PostDropdownMenu';
import { getPostLikesByPostId } from '@/apis/postService';
import LikesModal, { LikeCounter } from '@/components/Common/LikesModal';
import SharePostModal from '@/components/Common/SharePostModal';
import SharedPost from '@/components/PostMedia/SharedPost';

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
    const currentUserId = getUserId();
    const {
        profileData, following, followers, isLoading: isLoadingProfile
    } = useProfileData(currentUserId);

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
                                        <div className="p-4">
                                            {/* Post header */}
                                            <div className="flex justify-between mb-3">
                                                <div className="flex gap-3">
                                                    <img
                                                        src={post.avatarURL || post.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        alt="Profile"
                                                        className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                                        }}
                                                    />
                                                    <div>
                                                        <h6 className="font-semibold mb-0">
                                                            {post.name || post.fullName || post.firstName || "Unknown User"}
                                                        </h6>
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
                                                <p className="text-gray-800 whitespace-pre-wrap break-words mb-3">{post.content}</p>

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
