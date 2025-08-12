import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { getPostLikesByPostId } from '@/apis/postService';

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

const LikesModal = ({ postId, isOpen, onClose }) => {
    const [currentPostLikes, setCurrentPostLikes] = useState([]);
    const [isLoadingLikes, setIsLoadingLikes] = useState(false);

    useEffect(() => {
        const fetchLikes = async () => {
            if (!isOpen || !postId) return;

            setIsLoadingLikes(true);
            try {
                const response = await getPostLikesByPostId(postId);
                if (response) {
                    setCurrentPostLikes(response.items || []);
                    console.log("Danh sách người thích:", response);
                } else {
                    setCurrentPostLikes([]);
                }
            } catch (error) {
                console.error("Lỗi khi lấy danh sách người thích:", error);
                setCurrentPostLikes([]);
            } finally {
                setIsLoadingLikes(false);
            }
        };

        fetchLikes();
    }, [postId, isOpen]);

    if (!isOpen) return null;

    return (
        <Modal onClose={onClose}>
            <div className="p-2">
                <h3 className="text-xl text-black font-semibold mb-4">People who liked this post</h3>
                {isLoadingLikes ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : currentPostLikes.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                        {currentPostLikes.map((user) => (
                            <div key={user.accountId} className="flex text-black items-center gap-3 mb-3 p-2 hover:bg-gray-50">
                                <Link to={`/profile/${user.accountId}`}>
                                    <img
                                        src={user.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt={user.fullName || "User"}
                                        className="w-10 h-10  rounded-full object-cover"
                                    />
                                </Link>
                                <div>
                                    <Link to={`/profile/${user.accountId}`} className="font-semibold hover:text-blue-600">
                                        {user.fullName || "User"}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No one has liked this post yet</p>
                )}
            </div>
        </Modal>
    );
};

// Component hiển thị số lượt thích có thể click
export const LikeCounter = ({ postId, count, onClick }) => {
    if (!count || count <= 0) return null;

    return (
        <div
            className="flex items-center cursor-pointer hover:underline"
            onClick={() => onClick(postId)}
        >
            <span className="inline-flex justify-center items-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs">
                <FontAwesomeIcon icon={faHeart} className="text-red-500" size="xs" />
            </span>
            <span className="ml-1">{count}</span>
        </div>
    );
};

export default LikesModal; 