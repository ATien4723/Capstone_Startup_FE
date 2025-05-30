import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell, faCaretDown, faBars, faTimes, faUser,
    faCog, faEnvelope, faQuestionCircle, faHeadset, faSignOutAlt,
    faCheck, faCommentAlt, faShare
} from '@fortawesome/free-solid-svg-icons';
import { logout, getUserId, getUserInfoFromToken } from "@/apis/authService";
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead } from "@/apis/notificationService";
import { getAccountInfo } from "@/apis/accountService";
import Cookies from "js-cookie";
import { toast } from 'react-toastify';
import * as signalR from '@microsoft/signalr';
import axiosClient from '@/apis/axiosClient';

export default function Navbar() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notificationDropdownRef = useRef(null);
    const timeoutRef = useRef(null);
    const notificationTimeoutRef = useRef(null);
    const isAuthenticated = !!Cookies.get("accessToken");
    const currentUserId = getUserId();
    const userInfo = getUserInfoFromToken();
    const [hubConnection, setHubConnection] = useState(null);

    // State cho thông báo
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const [userInfoCache, setUserInfoCache] = useState({});

    // Kết nối SignalR khi component mount
    useEffect(() => {
        // Bỏ qua nếu không có xác thực hoặc ID người dùng
        if (!isAuthenticated || !currentUserId) return;

        // Lấy baseURL từ axiosClient
        const baseURL = axiosClient.defaults.baseURL || 'https://localhost:7192';

        // Tạo kết nối SignalR đơn giản
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseURL}hubs/notification`, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();

        // Đăng ký các event handler
        connection.on('ReceiveNotification', notification => {
            console.log('Received notification:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.info(notification.message || notification.content);
        });

        connection.on('ReceiveUnreadNotificationCount', data => {
            if (data && data.accountId && data.accountId.toString() === currentUserId.toString()) {
                setUnreadCount(data.unreadCount);
            }
        });

        connection.on('NotificationRead', data => {
            if (data && data.isRead) {
                setNotifications(prev => prev.map(n =>
                    n.id === data.notificationId ? { ...n, isRead: true } : n
                ));
                setUnreadCount(data.unreadCount);
            }
        });

        // Bắt đầu kết nối
        connection.start()
            .then(() => {
                console.log('SignalR Connected!');
                return connection.invoke('JoinGroup', currentUserId.toString());
            })
            .then(() => {
                console.log(`Joined group: ${currentUserId}`);
                setHubConnection(connection);
            })
            .catch(err => console.error('SignalR Connection Error:', err));

        // Cleanup khi component unmount
        return () => {
            if (connection) {
                connection.stop()
                    .catch(err => console.error('Error stopping connection:', err));
            }
        };
    }, [isAuthenticated, currentUserId]);

    // Lấy thông báo khi component mount
    useEffect(() => {
        if (isAuthenticated && currentUserId) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [isAuthenticated, currentUserId]);

    // Lấy danh sách thông báo
    const fetchNotifications = async () => {
        if (!currentUserId || loading) return;

        try {
            setLoading(true);
            const response = await getNotifications(currentUserId, pageNumber, pageSize);

            if (response && response.items) {
                // Nếu là trang đầu tiên, thay thế danh sách cũ
                if (pageNumber === 1) {
                    setNotifications(response.items);
                } else {
                    // Nếu không phải trang đầu, thêm vào danh sách hiện tại
                    setNotifications(prev => [...prev, ...response.items]);
                }

                // Kiểm tra xem còn trang nào nữa không
                setHasMore(response.items.length === pageSize);

                // Lấy thông tin người dùng cho mỗi thông báo nếu cần
                enrichNotificationsWithUserInfo(response.items);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Không thể tải thông báo');
        } finally {
            setLoading(false);
        }
    };

    // Lấy số lượng thông báo chưa đọc
    const fetchUnreadCount = async () => {
        if (!currentUserId) return;

        try {
            const count = await getUnreadNotificationCount(currentUserId);
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Thêm thông tin người dùng vào thông báo
    const enrichNotificationsWithUserInfo = async (notificationList) => {
        for (const notification of notificationList) {
            if (notification.senderId && !userInfoCache[notification.senderId]) {
                try {
                    const userInfo = await getAccountInfo(notification.senderId);
                    setUserInfoCache(prev => ({
                        ...prev,
                        [notification.senderId]: userInfo
                    }));
                } catch (error) {
                    console.error(`Error fetching user info for ID ${notification.senderId}:`, error);
                }
            }
        }
    };

    // Đánh dấu thông báo là đã đọc
    const handleMarkAsRead = async (notificationId) => {
        if (!currentUserId) return;

        try {
            await markNotificationAsRead(notificationId, currentUserId);
            // Cập nhật UI ngay lập tức (SignalR sẽ cập nhật lại sau)
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, isRead: true } : n
            ));
            // Giảm số lượng thông báo chưa đọc
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Đánh dấu tất cả thông báo là đã đọc
    const markAllAsRead = async () => {
        if (!currentUserId) return;

        try {
            // Giả sử có API để đánh dấu tất cả là đã đọc
            // await markAllNotificationsAsRead(currentUserId);

            // Cập nhật UI
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            toast.error('Không thể đánh dấu tất cả thông báo là đã đọc');
        }
    };

    // Tải thêm thông báo khi cuộn xuống
    const loadMoreNotifications = () => {
        if (hasMore && !loading) {
            setPageNumber(prev => prev + 1);
        }
    };

    // Hiển thị chỉ thông báo chưa đọc
    const showUnreadOnly = () => {
        // Implement filter logic if needed
    };

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
                setNotificationDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            clearTimeout(timeoutRef.current);
            clearTimeout(notificationTimeoutRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        clearTimeout(timeoutRef.current);
        setDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setDropdownOpen(false);
        }, 300); // Delay 300ms trước khi đóng
    };

    const handleNotificationMouseEnter = () => {
        clearTimeout(notificationTimeoutRef.current);
        setNotificationDropdownOpen(true);
    };

    const handleNotificationMouseLeave = () => {
        notificationTimeoutRef.current = setTimeout(() => {
            setNotificationDropdownOpen(false);
        }, 300); // Delay 300ms trước khi đóng
    };

    const toggleNotificationDropdown = () => {
        setNotificationDropdownOpen(!notificationDropdownOpen);
    };

    // Lấy icon cho từng loại thông báo
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'COMMENT':
                return <FontAwesomeIcon icon={faCommentAlt} className="text-blue-500" />;
            case 'SYSTEM':
                return <FontAwesomeIcon icon={faCheck} className="text-green-500" />;
            case 'MENTION':
                return <FontAwesomeIcon icon={faUser} className="text-purple-500" />;
            case 'SHARE':
                return <FontAwesomeIcon icon={faShare} className="text-orange-500" />;
            default:
                return <FontAwesomeIcon icon={faBell} className="text-gray-500" />;
        }
    };

    // Định dạng thời gian
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'vừa xong';
        } else if (diffInSeconds < 3600) {
            return `${Math.floor(diffInSeconds / 60)} phút trước`;
        } else if (diffInSeconds < 86400) {
            return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        } else if (diffInSeconds < 604800) {
            return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
        } else if (diffInSeconds < 2592000) {
            return `${Math.floor(diffInSeconds / 604800)} tuần trước`;
        } else {
            return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
        }
    };

    const navItems = [
        { label: 'Home', to: '/home' },
        { label: 'Startups', to: '/startups' },
        { label: 'InvestmentEvents', to: '/investment-events' },
        { label: 'Policy', to: '/policy' },
    ];

    const dropdownItems = [
        { label: 'Profile', to: `/profile/${currentUserId}`, icon: faUser },
        { label: 'Settings', to: `/settings/${currentUserId}`, icon: faCog },
        { label: 'Messages', to: '/messages', icon: faEnvelope },
        { label: 'Help Center', to: '/help', icon: faQuestionCircle },
        { label: 'Contact Support', to: '/support', icon: faHeadset },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-blue-900 to-blue-700 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="text-xl font-bold text-white">Simes</Link>

                {/* Hamburger button (mobile) */}
                <button
                    className="lg:hidden text-white text-2xl focus:outline-none"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
                </button>

                {/* Menu (desktop) */}
                <ul className="hidden lg:flex space-x-6 text-sm font-medium">
                    {navItems.map((item) => (
                        <li key={item.label}>
                            <Link
                                to={item.to}
                                className={`px-4 py-2 rounded-lg transition-all duration-300 ${window.location.pathname === item.to
                                    ? 'bg-white/20 text-black'
                                    : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Right section (notification & user) */}
                <div className="hidden lg:flex items-center space-x-4">
                    {isAuthenticated ? (
                        <>
                            {/* Notification */}
                            <div
                                className="relative"
                                ref={notificationDropdownRef}
                                onMouseEnter={handleNotificationMouseEnter}
                                onMouseLeave={handleNotificationMouseLeave}
                            >
                                <button
                                    className="relative"
                                    onClick={toggleNotificationDropdown}
                                >
                                    <FontAwesomeIcon icon={faBell} className="text-lg hover:text-white/80" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 border-2 border-blue-900">{unreadCount}</span>
                                    )}
                                </button>

                                {/* Notification dropdown */}
                                {notificationDropdownOpen && (
                                    <div
                                        className="absolute right-0 w-80 bg-white rounded-lg shadow-xl z-50"
                                        style={{ top: 'calc(100% + 8px)' }}
                                        onMouseEnter={handleNotificationMouseEnter}
                                        onMouseLeave={handleNotificationMouseLeave}
                                    >
                                        <div className="p-3 border-b border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold text-gray-800 text-lg">Thông báo</h3>
                                                <div className="flex space-x-2">
                                                    <button
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                        onClick={markAllAsRead}
                                                    >
                                                        Đánh dấu đã đọc
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex mt-2 border-b border-gray-100 pb-1">
                                                <button
                                                    className="flex-1 py-1 font-medium text-blue-600 border-b-2 border-blue-600"
                                                >
                                                    Tất cả
                                                </button>
                                                <button
                                                    className="flex-1 py-1 text-gray-600 hover:bg-gray-50"
                                                    onClick={showUnreadOnly}
                                                >
                                                    Chưa đọc
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-600 px-3 py-2 border-b border-gray-100">
                                            Trước đó
                                        </div>

                                        <div className="max-h-96 overflow-y-auto">
                                            {loading && pageNumber === 1 ? (
                                                <div className="flex justify-center items-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                notifications.map((notification) => {
                                                    const senderInfo = notification.senderId ? userInfoCache[notification.senderId] : null;
                                                    return (
                                                        <div
                                                            key={notification.id}
                                                            className={`flex p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                                            onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                                        >
                                                            <div className="relative mr-3">
                                                                <img
                                                                    src={senderInfo?.avatarUrl || "/api/placeholder/40/40"}
                                                                    alt={senderInfo?.firstName || "User"}
                                                                    className="w-12 h-12 rounded-full"
                                                                />
                                                                <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-gray-200">
                                                                    {getNotificationIcon(notification.type)}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-gray-800 text-sm">
                                                                    <span className="font-semibold">
                                                                        {senderInfo ? `${senderInfo.firstName} ${senderInfo.lastName}` : 'Hệ thống'}
                                                                    </span>{' '}
                                                                    {notification.content}
                                                                </p>
                                                                <div className="flex items-center mt-1">
                                                                    <span className="text-xs text-gray-500">
                                                                        {formatTime(notification.sendAt || notification.createdAt)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {!notification.isRead && (
                                                                <div className="flex items-center">
                                                                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center py-6 text-gray-500">
                                                    Không có thông báo nào
                                                </div>
                                            )}

                                            {loading && pageNumber > 1 && (
                                                <div className="flex justify-center items-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                                </div>
                                            )}

                                            {hasMore && !loading && (
                                                <div className="text-center py-2">
                                                    <button
                                                        className="text-blue-600 text-sm hover:underline"
                                                        onClick={loadMoreNotifications}
                                                    >
                                                        Tải thêm
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3 text-center border-t border-gray-100">
                                            <Link to="/notifications" className="text-blue-600 hover:underline text-sm font-medium">
                                                Xem tất cả
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dropdown (hover) */}
                            <div
                                className="relative group"
                                ref={dropdownRef}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <button className="flex items-center text-white text-sm">
                                    <img src="/api/placeholder/40/40" className="w-8 h-8 rounded-full mr-2 border border-white/20" alt="User" />
                                    <span>TienDz</span>
                                    <FontAwesomeIcon
                                        icon={faCaretDown}
                                        className={`ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Hover menu */}
                                {dropdownOpen && (
                                    <div
                                        className="absolute right-0 w-56 bg-white rounded-lg shadow-xl z-50"
                                        style={{ top: 'calc(100% + 8px)' }}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">Account</div>
                                        {dropdownItems.slice(0, 3).map((item) => (
                                            <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                                                <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                                {item.label}
                                            </Link>
                                        ))}
                                        <hr className="my-2" />
                                        <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">Support</div>
                                        {dropdownItems.slice(3, 5).map((item) => (
                                            <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                                                <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                                {item.label}
                                            </Link>
                                        ))}
                                        <hr className="my-2" />
                                        <button
                                            onClick={() => {
                                                logout();  // gọi hàm xóa cookie và redirect
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-blue-50 focus:outline-none"
                                            type="button"
                                        >
                                            <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 w-5 text-gray-500" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="px-6 py-2  text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="lg:hidden bg-blue-800 px-4 py-3 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.to}
                            className={`block px-4 py-2 rounded-md ${window.location.pathname === item.to
                                ? 'bg-white/20 text-black'
                                : 'text-white hover:bg-white/10'
                                }`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                    {!isAuthenticated && (
                        <Link
                            to="/login"
                            className="block px-4 py-2 bg-white text-blue-600 rounded-md font-semibold hover:bg-blue-50 transition-all duration-300"
                            onClick={() => setMenuOpen(false)}
                        >
                            Login
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
