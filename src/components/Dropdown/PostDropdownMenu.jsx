import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit,
    faTrash,
    faEyeSlash,
    faShareSquare,
    faEllipsisH
} from '@fortawesome/free-solid-svg-icons';

/**
 * Component dropdown menu cho bài viết
 * @param {Object} props - Props của component
 * @param {Object} props.post - Thông tin bài viết
 * @param {string} props.currentUserId - ID của người dùng hiện tại
 * @param {boolean} props.isOpen - Trạng thái mở/đóng của dropdown
 * @param {Function} props.onToggle - Hàm toggle dropdown
 * @param {Function} props.onEdit - Hàm xử lý khi click vào Edit
 * @param {Function} props.onDelete - Hàm xử lý khi click vào Delete
 * @param {Function} props.onHide - Hàm xử lý khi click vào Hide
 * @param {Function} props.onShare - Hàm xử lý khi click vào Share
 */
const PostDropdownMenu = ({
    post,
    currentUserId,
    currentUserIdHome,
    isOpen,
    onToggle,
    onEdit,
    onDelete,
    onHide,
    onShare
}) => {
    const dropdownRef = useRef(null);

    // Xử lý click ra ngoài dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onToggle(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onToggle]);

    const isOwnPost = post.accountId == currentUserIdHome || post.accountID == currentUserIdHome;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => onToggle(!isOpen)}
                className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full"
            >
                <FontAwesomeIcon icon={faEllipsisH} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-50">
                    {isOwnPost && (
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    onEdit(post);
                                    onToggle(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faEdit} className="text-blue-500" />
                                Edit Post
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(post.postId);
                                    onToggle(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                                Delete Post
                            </button>
                        </div>
                    )}

                    {!isOwnPost && (
                        <button
                            onClick={() => {
                                onHide(post.postId, post.accountId);
                                onToggle(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faEyeSlash} className="text-gray-500" />
                            Hide Post
                        </button>
                    )}

                    <div className="py-1">
                        <button
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => {
                                onShare && onShare(post);
                                onToggle(false);
                            }}
                        >
                            <FontAwesomeIcon icon={faShareSquare} className="text-green-500" />
                            Share Post
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostDropdownMenu;