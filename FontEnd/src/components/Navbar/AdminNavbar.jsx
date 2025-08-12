import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faSignOutAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/apis/authService';

const AdminNavbar = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownOpen && !event.target.closest('.user-dropdown')) {
                setDropdownOpen(false);
            }
            if (notificationOpen && !event.target.closest('.notification-dropdown')) {
                setNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen, notificationOpen]);

    // // Mẫu thông báo
    // useEffect(() => {
    //     // Trong thực tế, bạn sẽ lấy thông báo từ API
    //     setNotifications([
    //         { id: 1, text: 'Có 5 tài khoản mới đang chờ xác thực', time: '5 phút trước', isRead: false },
    //         { id: 2, text: 'Chính sách mới vừa được tạo', time: '1 giờ trước', isRead: false },
    //         { id: 3, text: 'Báo cáo thống kê hàng tuần đã sẵn sàng', time: '1 ngày trước', isRead: true },
    //     ]);
    // }, []);

    const handleLogout = () => {
        // Xử lý đăng xuất thực sự
        logout();
    };

    return (
        <nav className="bg-white shadow-md py-3 px-6 flex justify-between items-center">
            <div className="flex items-center">
                <h1 className="text-xl font-bold text-purple-800">Simes Admin</h1>
            </div>

            <div className="flex items-center space-x-4">
                {/* Notification Dropdown
                <div className="relative notification-dropdown">
                    <button
                        className="relative p-2 text-gray-600 hover:text-purple-700 focus:outline-none"
                        onClick={() => setNotificationOpen(!notificationOpen)}
                    >
                        <FontAwesomeIcon icon={faBell} className="text-xl" />
                        {notifications.some(n => !n.isRead) && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                    </button>

                    {notificationOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
                            <div className="py-2 px-3 bg-purple-700 text-white font-semibold">
                                Thông báo ({notifications.filter(n => !n.isRead).length} chưa đọc)
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`flex p-3 border-b hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-purple-50' : ''
                                                }`}
                                        >
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{notification.text}</div>
                                                <div className="text-xs text-gray-500">{notification.time}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500">Không có thông báo</div>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="py-2 px-3 bg-gray-100 text-center">
                                    <button className="text-sm text-purple-700 font-medium">Xem tất cả thông báo</button>
                                </div>
                            )}
                        </div>
                    )}
                </div> */}

                {/* User Dropdown */}
                <div className="relative user-dropdown">
                    <button
                        className="flex items-center focus:outline-none"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <FontAwesomeIcon icon={faUserCircle} className="text-2xl text-purple-700" />
                        <span className="ml-2 font-medium text-gray-700">{user?.fullName || 'Admin'}</span>
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-100"
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default AdminNavbar; 