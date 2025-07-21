import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faImage, faPaperclip, faSmile, faPlus,
    faEye, faEdit, faTrash, faSearch, faCalendarAlt,
    faThumbsUp, faComment, faShare, faSpinner,
    faTimes, faFileImage, faFile
} from '@fortawesome/free-solid-svg-icons';
import { getUserId, getUserInfoFromToken } from '@/apis/authService';
import { getAccountInfo } from '@/apis/accountService';
import { toast } from 'react-toastify';
import { useStartupPost } from '@/hooks/useStartupPost';
import { formatVietnameseDate } from '@/utils/dateUtils';


// Modal component
const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl relative p-6">
            <button
                className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700 transition-colors"
                onClick={onClose}
            >
                &times;
            </button>
            {children}
        </div>
    </div>
);

// Modal cho xem ảnh
const MediaModal = ({ media, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
        <div className="relative w-full max-w-4xl">
            <button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                onClick={onClose}
            >
                <FontAwesomeIcon icon={faTimes} />
            </button>

            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                {media.length === 1 ? (
                    <img
                        src={media[0].mediaUrl}
                        alt="Media"
                        className="w-full max-h-[80vh] object-contain"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                        {media.map((item, index) => (
                            <img
                                key={index}
                                src={item.mediaUrl}
                                alt={`Media ${index + 1}`}
                                className="w-full rounded-lg object-cover"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
);

const Post = () => {
    // Sử dụng hook useStartupPost để xử lý các chức năng liên quan đến bài viết
    const {
        posts,
        isLoadingPosts,
        postsPagination,
        showPostModal,
        newPost,
        postError,
        isCreatingPost,
        userStartupId,
        setShowPostModal,
        setNewPost,
        fetchStartupPosts,
        handlePostPageChange,
        handleFileUpload,
        handleCreatePost,
        // Sử dụng các state và function tìm kiếm từ hook
        postSearchText,
        isSearchingPosts,
        handlePostSearchTextChange,
        handlePostSearch,
        // Thêm các state và function cho chức năng chỉnh sửa bài viết
        handleUpdatePost,
        handleDeletePost
    } = useStartupPost();

    // State tạm thời cho bộ lọc
    const [sortBy, setSortBy] = useState('newest');

    // State cho modal xem ảnh
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [showMediaModal, setShowMediaModal] = useState(false);

    // State cho chức năng chỉnh sửa bài viết
    const [editingPost, setEditingPost] = useState(null);
    const [editedPostContent, setEditedPostContent] = useState(undefined);

    // State cho modal xác nhận xóa bài viết
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);

    // State cho dropdown menu của bài viết
    const [openDropdownPostId, setOpenDropdownPostId] = useState(null);

    // Lấy thông tin người dùng hiện tại
    const currentUserId = getUserId();
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Hàm mở modal xem ảnh
    const openMediaModal = (media) => {
        setSelectedMedia(media);
        setShowMediaModal(true);
    };

    // Hàm toggle dropdown menu
    const toggleDropdown = (postId, isOpen) => {
        setOpenDropdownPostId(isOpen ? postId : null);
    };

    // Hàm xác nhận xóa bài viết
    const confirmDeletePost = (post) => {
        setPostToDelete(post);
        setShowDeleteConfirmModal(true);
    };

    // Hàm xóa bài viết
    const handleDeletePostConfirm = async (post) => {
        try {
            // Gọi API xóa bài viết từ hook
            const result = await handleDeletePost(post.postId);
            if (result) {
                setShowDeleteConfirmModal(false);
                setPostToDelete(null);
                toast.success('Bài viết đã được xóa thành công');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Không thể xóa bài viết');
        }
    };

    // Hàm ẩn bài viết
    const handleHidePost = async (postId) => {
        try {
            // Gọi API ẩn bài viết (nếu có)
            // await hidePost(postId);
            toast.success('Bài viết đã được ẩn');
        } catch (error) {
            console.error('Error hiding post:', error);
            toast.error('Không thể ẩn bài viết');
        }
    };

    // Lấy thông tin tài khoản từ API
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                const accountInfo = await getAccountInfo(currentUserId);

                if (!accountInfo) {
                    toast.error('Unable to load account information');
                    return;
                }

                setProfileData(accountInfo);
            } catch (error) {
                console.error('Error getting account information:', error);
                toast.error('Unable to load account information');
            } finally {
                setIsLoading(false);
            }
        };

        if (currentUserId) {
            fetchProfileData();
        }
    }, [currentUserId]);

    // Gọi API để lấy danh sách bài viết khi component được tạo
    useEffect(() => {
        if (userStartupId) {
            fetchStartupPosts();
        }
    }, [userStartupId]);

    if (isLoading || isLoadingPosts) {
        return (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl shadow-md">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
                <span className="text-gray-600 font-medium">Loading posts...</span>
            </div>
        );
    }

    return (
        <>
            {/* Header - Giống với InternshipPost */}
            <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg px-6 py-6 flex justify-between items-center mb-8 rounded-xl text-white">
                <h1 className="text-3xl font-bold">Startup Posts</h1>
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition duration-200 flex items-center gap-2 font-medium"
                    onClick={() => setShowPostModal(true)}
                >
                    <FontAwesomeIcon icon={faPlus} /> Create New Post
                </button>
            </header>

            {/* Post Modal */}
            {showPostModal && (
                <Modal onClose={() => {
                    setShowPostModal(false);
                    setNewPost({ content: '', files: [] }); // Reset form
                }}>
                    <div className="flex items-center gap-3 p-6 border-b">
                        <img
                            src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt="Avatar"
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                        />
                        <div>
                            <div className="font-semibold text-gray-800">{profileData?.firstName} {profileData?.lastName}</div>
                            <div className="text-xs text-gray-500">Posting publicly</div>
                        </div>
                    </div>
                    <div className="p-6">
                        <textarea
                            className={`w-full p-3 border ${postError ? 'border-red-300' : 'border-gray-200'} rounded-lg outline-none resize-none text-lg focus:ring-2 focus:ring-blue-100 transition-all`}
                            rows={4}
                            placeholder="What do you want to share?"
                            value={newPost.content}
                            onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                        />
                        {postError && (
                            <div className="mt-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                                {postError}
                            </div>
                        )}
                        {newPost.files.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {newPost.files.map((file, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Upload ${index + 1}`}
                                            className="w-24 h-24 object-cover rounded-lg shadow-md"
                                        />
                                        <button
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
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
                        <div className="flex items-center gap-4 mt-5">
                            <label className="cursor-pointer p-2 rounded-full hover:bg-blue-50 transition">
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <FontAwesomeIcon icon={faImage} className="text-blue-500 text-xl" />
                            </label>
                            <label className="cursor-pointer p-2 rounded-full hover:bg-yellow-50 transition">
                                <FontAwesomeIcon icon={faSmile} className="text-yellow-500 text-xl" />
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end p-4 border-t">
                        <button
                            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow hover:shadow-lg transition ${isCreatingPost ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleCreatePost}
                            disabled={isCreatingPost}
                        >
                            {isCreatingPost ? (
                                <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Posting...</>
                            ) : 'Post'}
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
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                        />
                        <div>
                            <div className="font-semibold text-gray-800">{profileData?.firstName} {profileData?.lastName}</div>
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
                                                src={media.mediaUrl}
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
                                setEditedPostContent(undefined);
                            }}
                        >
                            Hủy
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
                            onClick={() => {
                                handleUpdatePost(editingPost.postId, editedPostContent === undefined ? editingPost.content : editedPostContent);
                                setEditingPost(null);
                            }}
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal xác nhận xóa bài viết */}
            {showDeleteConfirmModal && (
                <Modal onClose={() => {
                    setShowDeleteConfirmModal(false);
                    setPostToDelete(null);
                }}>
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Xác nhận xóa bài viết</h3>
                        <p className="mb-6">Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium"
                                onClick={() => {
                                    setShowDeleteConfirmModal(false);
                                    setPostToDelete(null);
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium"
                                onClick={() => postToDelete && handleDeletePostConfirm(postToDelete)}
                            >
                                Xóa bài viết
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Search and Filter */}
            <div className="bg-white shadow-md rounded-xl p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 relative">
                        <form onSubmit={handlePostSearch} className="w-full flex">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search posts..."
                                className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                value={postSearchText}
                                onChange={handlePostSearchTextChange}
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-r-lg shadow-md transition duration-200 flex items-center"
                                disabled={isSearchingPosts}
                            >
                                {isSearchingPosts ? (
                                    <FontAwesomeIcon icon={faSpinner} spin className="mr-1" />
                                ) : (
                                    <FontAwesomeIcon icon={faSearch} className="mr-1" />
                                )}
                                Search
                            </button>
                        </form>
                    </div>
                    <div className="flex gap-3">
                        <select
                            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white hover:border-gray-300 transition"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="popular">Most Popular</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Posts List - Cải tiến thiết kế */}
            {posts.length > 0 ? (
                <div className="space-y-6">
                    {posts.map(post => (
                        <div key={post.postId} className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border border-gray-100 hover:border-blue-200">
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <img
                                        src={post.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt="Avatar"
                                        className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-200"
                                    />
                                    <div>
                                        <h3 className="font-medium text-gray-900">{post.accountName || 'Startup User'}</h3>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-xs" />
                                            <span className="text-sm">{post.date || formatVietnameseDate(post.createAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {post.title && (
                                    <h2 className="text-xl font-bold text-gray-800 mb-3">{post.title}</h2>
                                )}

                                <p className="text-gray-600 mb-4 leading-relaxed">{post.content}</p>

                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {post.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Hiển thị dạng tệp đính kèm thay vì hiển thị trực tiếp ảnh */}
                                {post.postMedia && post.postMedia.length > 0 && (
                                    <div className="mt-4 mb-4">
                                        {/* {post.postMedia.length === 1 ? (
                                            <img
                                                src={post.postMedia[0].mediaUrl}
                                                alt="Post media"
                                                className="w-full h-auto max-h-96 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className={`grid ${post.postMedia.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
                                                {post.postMedia.slice(0, 4).map((media, index) => (
                                                    <div key={index} className={`${post.postMedia.length === 3 && index === 0 ? 'sm:col-span-3' : ''} relative group overflow-hidden rounded-lg`}>
                                                        <img
                                                            src={media.mediaUrl}
                                                            alt={`Image ${index + 1}`}
                                                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </div>
                                                ))}
                                                {post.postMedia.length > 4 && (
                                                    <div className="flex items-center justify-center bg-gray-900 bg-opacity-60 rounded-lg text-white font-medium">
                                                        + {post.postMedia.length - 4} more
                                                    </div>
                                                )}
                                            </div>
                                        )} */}
                                        <button
                                            onClick={() => openMediaModal(post.postMedia)}
                                            className="flex items-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                                        >
                                            <FontAwesomeIcon icon={faPaperclip} className="text-blue-500" />
                                            <span className="font-medium">{post.postMedia.length} {post.postMedia.length === 1 ? 'attachment' : 'attachments'}</span>
                                            <FontAwesomeIcon icon={faEye} className="ml-auto text-gray-500" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex space-x-4">
                                        <button className="flex items-center text-gray-500 hover:text-blue-600 transition-colors">
                                            <FontAwesomeIcon icon={faThumbsUp} className="mr-1.5" />
                                            <span>{post.likeCount || 0}</span>
                                        </button>
                                        <button className="flex items-center text-gray-500 hover:text-blue-600 transition-colors">
                                            <FontAwesomeIcon icon={faComment} className="mr-1.5" />
                                            <span>{post.commentCount || 0}</span>
                                        </button>
                                        {/* <button className="flex items-center text-gray-500 hover:text-blue-600 transition-colors">
                                            <FontAwesomeIcon icon={faShare} className="mr-1.5" /> Share
                                        </button> */}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            className="text-gray-500 hover:text-blue-600 transition-colors p-1.5 rounded-full hover:bg-blue-50"
                                            onClick={() => setEditingPost(post)}
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            className="text-gray-500 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-red-50"
                                            onClick={() => confirmDeletePost(post)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-xl p-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No posts yet</h3>
                    <p className="text-gray-500 mb-6">Create your first post to share with your network</p>
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition duration-200 font-medium"
                        onClick={() => setShowPostModal(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Create New Post
                    </button>
                </div>
            )}

            {/* Modal xem ảnh */}
            {showMediaModal && selectedMedia && (
                <MediaModal
                    media={selectedMedia}
                    onClose={() => {
                        setShowMediaModal(false);
                        setSelectedMedia(null);
                    }}
                />
            )}

            {/* Pagination - Cải tiến */}
            {posts.length > 0 && postsPagination.totalPages > 1 && (
                <div className="flex justify-center mt-10">
                    <nav className="inline-flex rounded-lg shadow-sm overflow-hidden">
                        <button
                            className={`px-4 py-2 border border-gray-300 ${postsPagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'} transition font-medium text-sm`}
                            onClick={() => handlePostPageChange(postsPagination.currentPage - 1)}
                            disabled={postsPagination.currentPage === 1}
                        >
                            Previous
                        </button>

                        {/* Render các số trang */}
                        {Array.from({ length: Math.min(postsPagination.totalPages, 5) }, (_, i) => {
                            // Logic để hiển thị các nút trang xung quanh trang hiện tại
                            let pageToShow = i + 1;
                            if (postsPagination.totalPages > 5) {
                                if (postsPagination.currentPage > 3) {
                                    pageToShow = postsPagination.currentPage - 3 + i;
                                }
                                if (pageToShow > postsPagination.totalPages) {
                                    pageToShow = postsPagination.totalPages - (4 - i);
                                }
                            }

                            return (
                                <button
                                    key={pageToShow}
                                    className={`px-4 py-2 ${postsPagination.currentPage === pageToShow ? 'border-t border-b border-gray-300 bg-blue-50 text-blue-600 font-medium' : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} transition text-sm`}
                                    onClick={() => handlePostPageChange(pageToShow)}
                                >
                                    {pageToShow}
                                </button>
                            );
                        })}

                        <button
                            className={`px-4 py-2 border border-gray-300 ${postsPagination.currentPage === postsPagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'} transition font-medium text-sm`}
                            onClick={() => handlePostPageChange(postsPagination.currentPage + 1)}
                            disabled={postsPagination.currentPage === postsPagination.totalPages}
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}
        </>
    );
};

export default Post; 