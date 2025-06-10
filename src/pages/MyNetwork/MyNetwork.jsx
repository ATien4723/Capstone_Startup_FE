import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@components/Navbar/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUserPlus, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import { getUserId } from '@/apis/authService';
import { useRecommendAccounts } from '@/hooks/useProfileHooks';
import { toast } from 'react-toastify';

const MyNetwork = () => {
    const currentUserId = getUserId();
    const { data: suggestedConnections, isLoading, error, refetch } = useRecommendAccounts(currentUserId, 1, 10);
    const [pendingInvitations, setPendingInvitations] = useState([]);

    const handleConnect = (id) => {
        toast.success('Đã gửi lời mời kết nối');
        // Cập nhật UI
        // setStats(prev => ({ ...prev, sent: prev.sent + 1 }));
    };

    const handleIgnore = (id) => {
        // Loại bỏ người dùng khỏi danh sách gợi ý
        // setSuggestedConnections(prev => prev.filter(conn => conn.id !== id));
        // Nếu muốn cập nhật UI, có thể refetch hoặc filter tạm thời ở đây
        refetch();
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />
            <div className="container mx-auto pt-20 px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left Column - Network Stats */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                            <h2 className="font-semibold text-lg mb-4">Network Overview</h2>
                            <div className="grid grid-cols-2 text-center">
                                {/* <div>
                                    <div className="font-bold text-xl">{stats.sent}</div>
                                    <div className="text-sm text-gray-600">Đã gửi lời mời</div>
                                </div> */}
                                <div>
                                    <Link to="/network/following" className="block">
                                        <div className="font-bold text-xl hover:text-blue-600">0</div>
                                        <div className="text-sm text-gray-600 hover:text-blue-600">Following</div>
                                    </Link>
                                </div>
                                <div>
                                    <Link to="/network/followers" className="block">
                                        <div className="font-bold text-xl hover:text-blue-600">0</div>
                                        <div className="text-sm text-gray-600 hover:text-blue-600">Followers</div>
                                    </Link>
                                </div>
                            </div>
                            <div className="mt-4 border-t pt-3">
                                {/* <button className="text-blue-600 font-medium text-sm flex items-center">
                                    Hiển thị thêm <span className="ml-1">▼</span>
                                </button> */}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Connection Suggestions */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                            <h2 className="font-semibold text-lg mb-2">Mời 5 đồng nghiệp của bạn kết nối ngay hôm nay</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Nhiều kết nối hơn có nghĩa là nhiều cơ hội hơn. Hãy bắt đầu với bạn bè, đồng đội và người quen lý.
                            </p>

                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                                Tìm kiếm những người bạn biết
                            </button>
                        </div>

                        {/* <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-semibold text-lg">Không có lời mời nào đang chờ</h2>
                            </div>
                        </div> */}

                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="">Những người bạn có thể biết </h2>
                                {/* <button className="text-blue-600 font-medium text-sm">Hiển thị tất cả</button> */}
                            </div>

                            {isLoading ? (
                                <div className="text-center py-8 text-gray-500">Đang tải gợi ý...</div>
                            ) : error ? (
                                <div className="text-center py-8 text-red-500">Không thể tải danh sách gợi ý kết nối</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {suggestedConnections.map(person => (
                                        <div key={person.accountId} className="border rounded-lg relative">
                                            <button
                                                className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                                                onClick={() => handleIgnore(person.accountId)}
                                            >
                                                <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
                                            </button>
                                            <div className="p-3 text-center flex flex-col h-auto">
                                                <div className="mb-2">
                                                    <img
                                                        src={person.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                                        alt={person.fullName}
                                                        className="w-20 h-20 rounded-full mx-auto object-cover"
                                                    />
                                                </div>
                                                <h3 className="font-medium text-sm">{person.fullName}</h3>
                                                <div className="flex-grow">
                                                    <p className="text-xs text-gray-600 mb-3 line-clamp-2 h-8">{person.position || ''}</p>
                                                    <p className="text-xs text-gray-500 mb-2">Followers: {person.totalFollowers}</p>
                                                </div>
                                                <div className="mt-auto">
                                                    <button
                                                        className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-1 px-3 rounded-full text-sm font-medium flex items-center justify-center"
                                                        onClick={() => handleConnect(person.accountId)}
                                                    >
                                                        <FontAwesomeIcon icon={faUserPlus} className="mr-1" />
                                                        Follow
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyNetwork;

