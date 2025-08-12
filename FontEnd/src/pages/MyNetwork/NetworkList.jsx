import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@components/Navbar/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUserCheck, faUserPlus, faUserMinus } from '@fortawesome/free-solid-svg-icons';
import { getUserId } from '@/apis/authService';
import { useProfileData } from '@/hooks/useProfileHooks';
import { toast } from 'react-toastify';
import useFollow from '@/hooks/useFollow';

const NetworkList = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy type từ URL path
    const pathType = location.pathname.includes('followers') ? 'followers' : 'following';

    // Đặt activeTab dựa trên đường dẫn URL
    const [activeTab, setActiveTab] = useState(pathType);
    // Lấy accountId của user hiện tại
    const accountId = getUserId();
    // Sử dụng hook useFollow đã nâng cấp
    const {
        handleFollow,
        handleUnfollow,
        followLoading,
        following,
        followers,
        loading,
        followingIds,
        processingId,
        isFollowing,
        refetchData
    } = useFollow(accountId);

    const [error, setError] = useState(null);
    const { profileData } = useProfileData(accountId);

    // Cập nhật activeTab khi URL thay đổi
    useEffect(() => {
        const currentType = location.pathname.includes('followers') ? 'followers' : 'following';
        setActiveTab(currentType);
    }, [location.pathname]);

    // Fetch lại dữ liệu khi activeTab thay đổi
    useEffect(() => {
        refetchData();
    }, [activeTab, refetchData]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`/network/${tab}`);
    };

    const handleFollowAction = async (userId) => {
        const success = await handleFollow(userId);
        if (success) {
            toast.success("Followed successfully!");
        }
    };

    const handleUnfollowAction = async (userId) => {
        const success = await handleUnfollow(userId);
        if (success) {
            toast.success("Unfollowed successfully!");
        }
    };

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-10 px-4">
            <img
                src="https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/04/anh-cuoi-34.jpg"
                alt="Empty network"
                className="w-64 h-64 mb-4"
            />
            <h2 className="text-2xl font-bold mb-2">
                {activeTab === 'following'
                    ? "You are not following anyone yet"
                    : "You have no followers yet"}
            </h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
                {activeTab === 'following'
                    ? "Follow people with similar interests to see their latest news and updates."
                    : "When someone follows you, they will appear here."}
            </p>
        </div>
    );

    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />
            <div className="container mx-auto pt-20 px-4">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b flex items-center">
                        <button
                            onClick={() => navigate('/mynetwork')}
                            className="mr-3 p-2 rounded-full hover:bg-gray-100"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        <h1 className="text-xl font-bold">{profileData?.firstName}'s Network</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b">
                        <button
                            className={`py-3 px-6 font-medium text-sm ${activeTab === 'following' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'}`}
                            onClick={() => handleTabChange('following')}
                        >
                            Following
                        </button>
                        <button
                            className={`py-3 px-6 font-medium text-sm ${activeTab === 'followers' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'}`}
                            onClick={() => handleTabChange('followers')}
                        >
                            Followers
                        </button>
                    </div>

                    {/* Loading & Error states */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-3"></div>
                            <div className="text-lg text-gray-500">Loading data...</div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4">
                            <div className="text-lg text-red-500">{error}</div>
                        </div>
                    ) : ((activeTab === 'following' && following.length === 0) ||
                        (activeTab === 'followers' && followers.length === 0)) && renderEmptyState()}

                    {/* Following List */}
                    {activeTab === 'following' && following.length > 0 && (
                        <div className="p-4">
                            {following.map(user => (
                                <div key={user.accountId} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <Link to={`/profile/${user.accountId}`}>
                                            <img
                                                src={user.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                className="w-12 h-12 rounded-full mr-3 hover:opacity-90 transition-opacity"
                                                alt={`${user.firstName} ${user.lastName}`}
                                            />
                                        </Link>
                                        <div>
                                            <Link to={`/profile/${user.accountId}`}>
                                                <h3 className="font-medium hover:text-blue-600 transition-colors">
                                                    {user.firstName} {user.lastName}
                                                </h3>
                                            </Link>
                                            <p className="text-sm text-gray-600">{user.position}</p>
                                        </div>
                                    </div>
                                    <button
                                        className={`px-4 py-1 rounded-full text-sm flex items-center transition-colors ${isFollowing(user.accountId)
                                            ? "border border-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-red-600 hover:border-red-600 group"
                                            : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                                            }`}
                                        onClick={() =>
                                            isFollowing(user.accountId)
                                                ? handleUnfollowAction(user.accountId)
                                                : handleFollowAction(user.accountId)
                                        }
                                        disabled={processingId === user.accountId}
                                    >
                                        {isFollowing(user.accountId) ? (
                                            <>
                                                <FontAwesomeIcon
                                                    icon={faUserCheck}
                                                    className="mr-2 group-hover:hidden"
                                                />
                                                <FontAwesomeIcon
                                                    icon={faUserMinus}
                                                    className="mr-2 hidden group-hover:inline-block"
                                                />
                                                <span className="group-hover:hidden">
                                                    {processingId === user.accountId ? 'Processing...' : 'Following'}
                                                </span>
                                                <span className="hidden group-hover:inline">
                                                    Unfollow
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                                {processingId === user.accountId ? 'Processing...' : 'Follow back'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Followers List */}
                    {activeTab === 'followers' && followers.length > 0 && (
                        <div className="p-4">
                            {followers.map(user => (
                                <div key={user.accountId} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <Link to={`/profile/${user.accountId}`}>
                                            <img
                                                src={user.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                alt={user.name || `${user.firstName} ${user.lastName}`}
                                                className="w-12 h-12 rounded-full mr-3 hover:opacity-90 transition-opacity"
                                            />
                                        </Link>
                                        <div>
                                            <Link to={`/profile/${user.accountId}`}>
                                                <h3 className="font-medium hover:text-blue-600 transition-colors">{user.firstName} {user.lastName}</h3>
                                            </Link>
                                            <p className="text-sm text-gray-600">{user.position}</p>
                                        </div>
                                    </div>
                                    {!isFollowing(user.accountId) && (
                                        <button
                                            className="px-4 py-1 border border-blue-600 text-blue-600 rounded-full text-sm flex items-center hover:bg-blue-50 transition-colors"
                                            onClick={() => handleFollowAction(user.accountId)}
                                            disabled={processingId === user.accountId}
                                        >
                                            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                            {processingId === user.accountId ? 'Processing...' : 'Follow back'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetworkList;

