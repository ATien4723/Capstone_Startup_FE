import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faImage, faPaperclip, faSmile, faPlus,
    faEye, faEdit, faTrash
} from '@fortawesome/free-solid-svg-icons';
import { getUserId, getUserInfoFromToken } from '@/apis/authService';
import { getAccountInfo } from '@/apis/accountService';
import { toast } from 'react-toastify';
import { useStartupPost } from '@/hooks/useStartupPost';

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
        handleCreatePost
    } = useStartupPost();

    // State tạm thời cho từ khóa tìm kiếm và bộ lọc
    const [searchText, setSearchText] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    // Lấy thông tin người dùng hiện tại
    const currentUserId = getUserId();
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Lấy thông tin tài khoản từ API
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                const accountInfo = await getAccountInfo(currentUserId);

                if (!accountInfo) {
                    toast.error('Không thể tải thông tin tài khoản');
                    return;
                }

                setProfileData(accountInfo);
            } catch (error) {
                console.error('Lỗi khi lấy thông tin tài khoản:', error);
                toast.error('Không thể tải thông tin tài khoản');
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
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                <span className="ml-3">Đang tải thông tin...</span>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="bg-white shadow px-4 py-4 flex justify-between items-center mb-6 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-800">Bài viết</h1>
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"
                    onClick={() => setShowPostModal(true)}
                >
                    <i className="fas fa-plus"></i> Tạo bài viết mới
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
                            className="w-12 h-12 rounded-full"
                        />
                        <div>
                            <div className="font-semibold">{profileData?.firstName} {profileData?.lastName}</div>
                            <div className="text-xs text-gray-500">Đang đăng công khai</div>
                        </div>
                    </div>
                    <div className="p-6">
                        <textarea
                            className={`w-full border-none outline-none resize-none text-lg ${postError ? 'border-red-500' : ''}`}
                            rows={4}
                            placeholder="Bạn muốn chia sẻ điều gì?"
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
                            {isCreatingPost ? 'Đang đăng...' : 'Đăng bài'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Search and Filter */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài viết..."
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="popular">Phổ biến nhất</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Posts List */}
            <div className="space-y-6">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.postId} className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-xl font-bold text-gray-800">{post.title || 'Bài viết không có tiêu đề'}</h2>
                                    <span className="text-sm text-gray-500">{new Date(post.createdDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <p className="text-gray-600 mb-4">{post.content}</p>
                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {post.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {post.mediaUrls && post.mediaUrls.length > 0 && (
                                    <div className="mt-4 mb-4 grid grid-cols-2 gap-2">
                                        {post.mediaUrls.slice(0, 4).map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt={`Hình ảnh ${index + 1}`}
                                                className="w-full h-40 object-cover rounded"
                                            />
                                        ))}
                                        {post.mediaUrls.length > 4 && (
                                            <div className="col-span-2 text-center text-blue-600">
                                                + {post.mediaUrls.length - 4} hình ảnh khác
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <div className="flex space-x-2">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            <FontAwesomeIcon icon={faEye} className="mr-1" /> Xem
                                        </button>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="text-gray-600 hover:text-gray-800">
                                            <FontAwesomeIcon icon={faEdit} className="mr-1" /> Sửa
                                        </button>
                                        <button className="text-red-600 hover:text-red-800">
                                            <FontAwesomeIcon icon={faTrash} className="mr-1" /> Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white shadow rounded-lg p-8 text-center">
                        <p className="text-gray-500">Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {posts.length > 0 && postsPagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <nav className="inline-flex rounded-md shadow">
                        <button
                            className={`px-3 py-1 rounded-l-md border border-gray-300 bg-white text-gray-500 ${postsPagination.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                                }`}
                            onClick={() => handlePostPageChange(postsPagination.currentPage - 1)}
                            disabled={postsPagination.currentPage === 1}
                        >
                            Trước
                        </button>

                        {/* Render các số trang */}
                        {[...Array(postsPagination.totalPages).keys()].map(page => (
                            <button
                                key={page + 1}
                                className={`px-3 py-1 border-t border-b border-gray-300 ${postsPagination.currentPage === page + 1
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                                onClick={() => handlePostPageChange(page + 1)}
                            >
                                {page + 1}
                            </button>
                        ))}

                        <button
                            className={`px-3 py-1 rounded-r-md border border-gray-300 bg-white text-gray-500 ${postsPagination.currentPage === postsPagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                                }`}
                            onClick={() => handlePostPageChange(postsPagination.currentPage + 1)}
                            disabled={postsPagination.currentPage === postsPagination.totalPages}
                        >
                            Sau
                        </button>
                    </nav>
                </div>
            )}
        </>
    );
};

export default Post; 