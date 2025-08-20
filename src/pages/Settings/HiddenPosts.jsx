import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { getPostHideByAccountId, unhidePost } from '@/apis/postService';
import { getUserId } from '@/apis/authService';
import { toast } from 'react-toastify';

const HiddenPosts = () => {
    const [hiddenPosts, setHiddenPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [unhidingPosts, setUnhidingPosts] = useState(new Set());
    const accountId = getUserId();

    // Đảm bảo hiddenPosts luôn là array
    const safeHiddenPosts = Array.isArray(hiddenPosts) ? hiddenPosts : [];

    // Lấy danh sách bài viết đã ẩn
    const fetchHiddenPosts = async (page = 1, reset = false) => {
        if (loading) return;

        setLoading(true);
        try {
            const response = await getPostHideByAccountId(accountId, page, 5);
            console.log('Hidden posts response:', response); // Debug log

            // Xử lý response data - đảm bảo luôn là array
            let newPosts = [];

            if (response?.items && Array.isArray(response.items)) {
                newPosts = response.items;
            } else {
                console.warn('API response không có items array:', response);
                newPosts = [];
            }

            if (reset) {
                setHiddenPosts(newPosts);
            } else {
                setHiddenPosts(prev => {
                    const prevArray = Array.isArray(prev) ? prev : [];
                    return [...prevArray, ...newPosts];
                });
            }

            setHasMore(newPosts.length === 5);
            setPageNumber(page);
        } catch (error) {
            console.error('Lỗi khi lấy bài viết đã ẩn:', error);
            toast.error('Unable to load hidden posts list');
            setHiddenPosts([]); // Đặt về array rỗng khi có lỗi
        } finally {
            setLoading(false);
        }
    };

    // Bỏ ẩn bài viết
    const handleUnhidePost = async (postId) => {
        if (unhidingPosts.has(postId)) return;

        setUnhidingPosts(prev => new Set([...prev, postId]));
        try {
            await unhidePost(postId, accountId);
            setHiddenPosts(prev => {
                const prevArray = Array.isArray(prev) ? prev : [];
                return prevArray.filter(post => (post.postId || post.id) !== postId);
            });
            toast.success('Post unhidden successfully');
        } catch (error) {
            console.error('Lỗi khi bỏ ẩn bài viết:', error);
            toast.error('Unable to unhide post');
        } finally {
            setUnhidingPosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
        }
    };

    // Tải thêm bài viết
    const loadMore = () => {
        if (hasMore && !loading) {
            fetchHiddenPosts(pageNumber + 1);
        }
    };

    // Làm mới danh sách
    const refreshList = () => {
        fetchHiddenPosts(1, true);
    };

    useEffect(() => {
        fetchHiddenPosts(1, true);
    }, []);

    // Render một bài viết
    const renderPost = (post, index) => {
        if (!post) return null;

        return (
            <div key={post.postId || post.id || index} className="bg-white border border-gray-100 rounded-xl p-6 mb-6 shadow-sm hover:shadow-md hidden-post-card fade-in-up">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                        <img
                            src={post.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt={post.fullName || post.authorName || 'User'}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                        />
                        {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div> */}
                    </div>

                    {/* Nội dung bài viết */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 text-lg">{post.fullName || post.authorName || 'Unknown User'}</h3>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500 text-sm">
                                    {post.createAt ? new Date(post.createAt).toLocaleDateString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    }) : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <FontAwesomeIcon icon={faEyeSlash} className="text-gray-400" />
                                <span>Hidden</span>
                            </div>
                        </div>

                        {/* Tiêu đề bài viết nếu có */}
                        {post.title && post.title !== 'string' && (
                            <h4 className="font-semibold text-gray-800 mb-3 text-xl leading-relaxed">{post.title}</h4>
                        )}

                        {/* Nội dung */}
                        <div className="mb-4">
                            <p className="text-gray-700 leading-relaxed line-clamp-3">
                                {post.content && post.content !== 'string' ? post.content : 'No content'}
                            </p>
                        </div>

                        {/* Hình ảnh nếu có */}
                        {post.postMedia && post.postMedia.length > 0 && (
                            <div className="mb-4">
                                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                                    <img
                                        src={post.postMedia[0].url || post.postMedia[0]}
                                        alt="Post content"
                                        className="w-full h-64 object-cover"
                                    />
                                    {post.postMedia.length > 1 && (
                                        <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-sm">
                                            +{post.postMedia.length - 1} photos
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Thống kê tương tác */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faEye} className="text-blue-500" />
                                    <span>{post.likeCount || 0} likes</span>
                                </div>
                                {post.commentCount !== undefined && (
                                    <div className="flex items-center gap-1">
                                        <FontAwesomeIcon icon={faEye} className="text-green-500" />
                                        <span>{post.commentCount || 0} comments</span>
                                    </div>
                                )}
                                {post.shareCount !== undefined && (
                                    <div className="flex items-center gap-1">
                                        <FontAwesomeIcon icon={faEye} className="text-purple-500" />
                                        <span>{post.shareCount || 0} shares</span>
                                    </div>
                                )}
                            </div>

                            {/* Nút bỏ ẩn */}
                            <button
                                onClick={() => handleUnhidePost(post.postId || post.id)}
                                disabled={unhidingPosts.has(post.postId || post.id)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 
                                           text-white rounded-lg font-medium shadow-sm hover:shadow-lg
                                   transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800
                            focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {unhidingPosts.has(post.postId || post.id) ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faEye} />
                                        <span>Unhide</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <FontAwesomeIcon icon={faEyeSlash} className="text-white text-lg" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Hidden Posts</h1>
                            <p className="text-gray-600 text-lg">
                                Manage posts you've hidden from your feed
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={refreshList}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all duration-200 font-medium"
                    >
                        <FontAwesomeIcon icon={faSpinner} className={loading ? "animate-spin" : ""} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Danh sách bài viết */}
            <div className="space-y-6">
                {safeHiddenPosts.length === 0 && !loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FontAwesomeIcon icon={faEyeSlash} className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                            No hidden posts
                        </h3>
                        <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
                            When you hide posts from your feed, they will appear here and you can unhide them anytime
                        </p>
                    </div>
                ) : (
                    safeHiddenPosts.map(renderPost)
                )}

                {/* Loading */}
                {loading && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FontAwesomeIcon icon={faSpinner} className="text-2xl text-blue-600 animate-spin" />
                        </div>
                        <p className="text-gray-600 text-lg font-medium">Loading posts...</p>
                        <p className="text-gray-500 mt-1">Please wait a moment</p>
                    </div>
                )}

                {/* Nút tải thêm */}
                {hasMore && !loading && safeHiddenPosts.length > 0 && (
                    <div className="text-center py-8">
                        <button
                            onClick={loadMore}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-lg"
                        >
                            Load more posts
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HiddenPosts;
