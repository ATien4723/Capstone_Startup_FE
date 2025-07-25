import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import PostMediaGrid from './PostMediaGrid';
import { getPostById } from '@/apis/postService';
import { formatPostTime } from '@/utils/dateUtils';

const SharedPost = ({ postShareId }) => {
    const [sharedPost, setSharedPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [expandedContent, setExpandedContent] = useState(false);

    const toggleContent = () => {
        setExpandedContent(!expandedContent);
    };

    useEffect(() => {
        const fetchSharedPost = async () => {
            if (!postShareId) return;

            try {
                setLoading(true);
                const response = await getPostById(postShareId);
                setSharedPost(response);
            } catch (err) {
                console.error('Lỗi khi lấy bài viết được chia sẻ:', err);
                setError('Không thể tải bài viết được chia sẻ');
            } finally {
                setLoading(false);
            }
        };

        fetchSharedPost();
    }, [postShareId]);

    if (loading) {
        return (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mt-3">
                <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
                <div className="space-y-3 mt-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !sharedPost) {
        return (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mt-3">
                <p className="text-gray-500 text-center">Bài viết đã bị xóa hoặc không thể truy cập</p>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mt-3">
            <div className="flex items-center gap-3">
                <Link to={`/profile/${sharedPost.accountId}`}>
                    <img
                        src={sharedPost.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                        }}
                    />
                </Link>
                <div>
                    <Link to={`/profile/${sharedPost.accountId}`} className="font-medium hover:underline">
                        {sharedPost.fullName || "User"}
                    </Link>
                    <div className="text-xs text-gray-500 flex items-center">
                        <span>{sharedPost.createAt ? formatPostTime(sharedPost.createAt) : ""}</span>
                    </div>
                </div>
            </div>

            <div className="mt-2">
                {sharedPost.title && <h6 className="font-semibold mb-1">{sharedPost.title}</h6>}
                <p className={`text-sm text-gray-700 ${!expandedContent ? 'line-clamp-2' : ''}`}>{sharedPost.content}</p>

                {sharedPost.content && sharedPost.content.length > 100 && (
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

                {sharedPost.postMedia && sharedPost.postMedia.length > 0 && (
                    <div className="mt-2">
                        <PostMediaGrid media={sharedPost.postMedia} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedPost; 