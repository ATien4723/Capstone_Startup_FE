import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareSquare } from '@fortawesome/free-solid-svg-icons';
import { getUserId } from '@/apis/authService';
import { sharePost } from '@/apis/postService';
import { toast } from 'react-toastify';
import SharedPost from '@/components/PostMedia/SharedPost';

const SharePostModal = ({ isOpen, onClose, post, profileData, onShareSuccess }) => {
    const [shareContent, setShareContent] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [expandedContent, setExpandedContent] = useState(false);

    if (!isOpen || !post) return null;

    const toggleContent = () => {
        setExpandedContent(!expandedContent);
    };

    const handleSharePost = async () => {
        try {
            setIsSharing(true);
            const currentUserId = getUserId();

            if (!currentUserId) {
                toast.error('Bạn cần đăng nhập để chia sẻ bài viết');
                return;
            }

            const shareData = {
                accountId: currentUserId,
                originalPostId: post.postId,
                content: shareContent
            };

            const response = await sharePost(shareData);
            toast.success('Chia sẻ bài viết thành công!');
            setShareContent('');
            onClose();

            // Gọi callback để cập nhật UI sau khi chia sẻ thành công
            if (onShareSuccess && typeof onShareSuccess === 'function') {
                onShareSuccess();
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi chia sẻ bài viết');
            console.error('Lỗi chia sẻ bài viết:', error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg w-full max-w-lg shadow-lg relative p-6 max-h-[90vh] overflow-auto">
                <button
                    className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    &times;
                </button>

                <div className="flex items-center gap-3 pb-4 border-b">
                    <FontAwesomeIcon icon={faShareSquare} className="text-blue-600" />
                    <h3 className="text-xl font-semibold">Chia sẻ bài viết</h3>
                </div>

                <div className="py-4">
                    <div className="flex items-center gap-3 mb-3">
                        <img
                            src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                            }}
                        />
                        <div className="font-medium">{profileData?.firstName} {profileData?.lastName}</div>
                    </div>

                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 resize-none"
                        rows={3}
                        placeholder="Viết suy nghĩ của bạn về bài viết này..."
                        value={shareContent}
                        onChange={(e) => setShareContent(e.target.value)}
                    />

                    {/* Hiển thị xem trước bài viết sẽ được chia sẻ */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <img
                                src={post.avatarURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                alt="Profile"
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                }}
                            />
                            <div>
                                <div className="font-medium">{post.name || "User"}</div>
                                <div className="text-xs text-gray-500">{post.createAt}</div>
                            </div>
                        </div>

                        <div className="mt-2">
                            {post.title && <div className="font-semibold">{post.title}</div>}
                            <p className={`text-sm text-gray-700 ${!expandedContent ? 'line-clamp-2' : ''}`}>{post.content}</p>

                            {post.content && post.content.length > 100 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleContent();
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm mt-1 font-medium"
                                >
                                    {expandedContent ? 'Thu gọn' : 'Xem thêm'}
                                </button>
                            )}

                            {post.postMedia && post.postMedia.length > 0 && (
                                // <div className="mt-1 h-30 bg-gray-200 rounded overflow-hidden">
                                <div className="mt-1 flex gap-2 overflow-x-auto">
                                    {post.postMedia.map((media, idx) => {
                                        const url = media.mediaUrl;
                                        const isVideo = url.match(/\.(mp4|mov|webm)$/i);
                                        return isVideo ? (
                                            <video
                                                key={idx}
                                                src={url}
                                                className="h-full w-full object-cover"
                                                controls
                                            />
                                        ) : (
                                            <img
                                                key={idx}
                                                src={url}
                                                alt={`Post media ${idx + 1}`}
                                                className="h-full w-full object-cover rounded flex-shrink-0"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-3 border-t flex justify-end">
                    <button
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium mr-2 hover:bg-gray-300"
                        onClick={onClose}
                        disabled={isSharing}
                    >
                        Hủy
                    </button>
                    <button
                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 ${isSharing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        onClick={handleSharePost}
                        disabled={isSharing}
                    >
                        {isSharing ? 'Đang chia sẻ...' : 'Chia sẻ ngay'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharePostModal; 