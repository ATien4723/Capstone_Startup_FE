import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@components/Navbar/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
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
    const { handleFollow, followLoading, following, followers, loading } = useFollow(accountId);
    const [error, setError] = useState(null);
    const { profileData } = useProfileData(accountId);
    // Cập nhật activeTab khi URL thay đổi
    useEffect(() => {
        const currentType = location.pathname.includes('followers') ? 'followers' : 'following';
        setActiveTab(currentType);
    }, [location.pathname]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`/network/${tab}`);
    };

    // Hàm xử lý follow lại
    const handleFollowBack = async (userId) => {
        await handleFollow(userId);
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />
            <div className="container mx-auto pt-20 px-4">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b">
                        <h1 className="text-xl font-bold">Mạng lưới của {profileData?.firstName}</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b">
                        <button
                            className={`py-3 px-6 font-medium text-sm ${activeTab === 'following' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'}`}
                            onClick={() => handleTabChange('following')}
                        >
                            Đang theo dõi
                        </button>
                        <button
                            className={`py-3 px-6 font-medium text-sm ${activeTab === 'followers' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'}`}
                            onClick={() => handleTabChange('followers')}
                        >
                            Người theo dõi
                        </button>
                    </div>

                    {/* Empty state */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4">
                            <div className="text-lg text-gray-500">Đang tải dữ liệu...</div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4">
                            <div className="text-lg text-red-500">{error}</div>
                        </div>
                    ) : ((activeTab === 'following' && following.length === 0) ||
                        (activeTab === 'followers' && followers.length === 0)) && (
                        <div className="flex flex-col items-center justify-center py-10 px-4">
                            <img
                                src="https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/04/anh-cuoi-34.jpg"
                                alt="Empty network"
                                className="w-64 h-64 mb-4"
                            />
                            <h2 className="text-2xl font-bold mb-2">
                                {activeTab === 'following'
                                    ? "You are not following anyone"
                                    : "You don't have any followers yet"}
                            </h2>
                            <p className="text-gray-600 text-center max-w-md mb-6">
                                {activeTab === 'following'
                                    ? "Follow creators based on your interest to see their latest news and updates."
                                    : "When people follow you, they'll appear here."}
                            </p>
                        </div>
                    )}

                    {/* List of connections (if any) */}
                    {activeTab === 'following' && following.length > 0 && (
                        <div className="p-4">
                            {following.map(user => (
                                <div key={user.accountId} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <img src={user.avatarUrl} className="w-12 h-12 rounded-full mr-3" />
                                        <div>
                                            <h3 className="font-medium">{user.firstName}{user.lastName}</h3>
                                            <p className="text-sm text-gray-600">{user.position}</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 border border-gray-400 rounded-full text-sm">
                                        Đang theo dõi
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'followers' && followers.length > 0 && (
                        <div className="p-4">
                            {followers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full mr-3" />
                                        <div>
                                            <h3 className="font-medium">{user.name}</h3>
                                            <p className="text-sm text-gray-600">{user.position}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="px-3 py-1 border border-blue-600 text-blue-600 rounded-full text-sm hover:bg-blue-50"
                                        onClick={() => handleFollowBack(user.id)}
                                        disabled={followLoading}
                                    >
                                        {followLoading ? 'Đang theo dõi...' : 'Theo dõi lại'}
                                    </button>
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

