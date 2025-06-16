import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell, faCaretDown, faBars, faTimes, faUser,
    faCog, faEnvelope, faQuestionCircle, faHeadset, faSignOutAlt,
    faCheck, faCommentAlt, faShare, faHome
} from '@fortawesome/free-solid-svg-icons';
import { logout, getUserId, getUserInfoFromToken } from "@/apis/authService";
import Cookies from "js-cookie";
import { getRelativeTime } from "@/utils/dateUtils";
import useNotifications from "@/hooks/useNotifications";
import { useProfileData } from '@/hooks/useProfileHooks';

export default function MeNavbar() {
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
    const { profileData } = useProfileData(currentUserId);
    const navigate = useNavigate();

    // Sử dụng custom hook cho notification
    const {
        notifications,
        unreadCount,
        loading,
        hasMore,
        pageNumber,
        userInfoMap,
        showingUnreadOnly,
        setShowingUnreadOnly,
        handleMarkAsRead,
        markAllAsRead,
        loadMoreNotifications,
        toggleUnreadOnly,
        setPageNumber,
        setNotifications,
    } = useNotifications(currentUserId, isAuthenticated);

    // Thêm state mobileDropdownOpen để quản lý trạng thái mở/đóng dropdown.
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
    // Thêm state mobileAvatarDropdownOpen để quản lý dropdown avatar trên mobile
    const [mobileAvatarDropdownOpen, setMobileAvatarDropdownOpen] = useState(false);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Kiểm tra nếu click ra ngoài dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            // Kiểm tra nếu click ra ngoài notification dropdown và không phải là nút thông báo
            if (notificationDropdownRef.current &&
                !notificationDropdownRef.current.contains(event.target) &&
                !event.target.closest('.notification-btn')) {
                setNotificationDropdownOpen(false);
            }
            // Đóng dropdown avatar mobile nếu click ra ngoài
            if (mobileAvatarDropdownOpen) {
                const avatarBtn = document.querySelector('.mobile-avatar-btn');
                const dropdown = document.querySelector('.mobile-avatar-dropdown');
                if (avatarBtn && !avatarBtn.contains(event.target) && dropdown && !dropdown.contains(event.target)) {
                    setMobileAvatarDropdownOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            clearTimeout(timeoutRef.current);
            clearTimeout(notificationTimeoutRef.current);
        };
    }, [mobileAvatarDropdownOpen]);

    // Giữ lại các hàm xử lý hover cho user dropdown
    const handleMouseEnter = () => {
        clearTimeout(timeoutRef.current);
        setDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setDropdownOpen(false);
        }, 300); // Delay 300ms trước khi đóng
    };

    // Toggle notification dropdown khi click
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

    const dropdownItems = [
        { label: 'Profile', to: `/profile/${currentUserId}`, icon: faUser },
        { label: 'Settings', to: `/settings/${currentUserId}`, icon: faCog },
        { label: 'Back to Home', to: '/home', icon: faHome },
        { label: 'Messages', to: '/messages', icon: faEnvelope },
        { label: 'Help Center', to: '/help', icon: faQuestionCircle },
        { label: 'Contact Support', to: '/support', icon: faHeadset },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-blue-900 to-blue-700 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="text-xl font-bold text-white">Simes</Link>

                {/* Mobile: Bell + Avatar */}
                {isAuthenticated && (
                    <div className="flex items-center space-x-3 lg:hidden ml-auto relative">
                        {/* Nút thông báo */}
                        <div className="relative">
                            <button
                                className="relative notification-btn"
                                onClick={toggleNotificationDropdown}
                            >
                                <FontAwesomeIcon icon={faBell} className="text-lg hover:text-white/80" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 border-2 border-blue-900">{unreadCount}</span>
                                )}
                            </button>
                            {/* Dropdown thông báo cho mobile */}
                            {notificationDropdownOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50"
                                    style={{ top: 'calc(100% + 8px)' }}
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
                                                className={`flex-1 py-1 font-medium ${!showingUnreadOnly ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                                onClick={() => setShowingUnreadOnly(false)}
                                            >
                                                Tất cả
                                            </button>
                                            <button
                                                className={`flex-1 py-1 ${showingUnreadOnly ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                                onClick={toggleUnreadOnly}
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
                                            notifications
                                                .filter(notification => !showingUnreadOnly || !notification.isRead)
                                                .map((notification, index) => {
                                                    const userId = notification.accountId || notification.senderId;
                                                    const senderInfo = notification.userInfo || (userId ? userInfoMap[userId] : null);
                                                    const uniqueKey = notification.id ? `notification-${notification.id}` : `notification-index-${index}`;
                                                    return (
                                                        <div
                                                            key={uniqueKey}
                                                            className={`flex p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                                            onClick={() => {
                                                                if (!notification.isRead) {
                                                                    const idToUse = notification.notificationId || notification.id;
                                                                    handleMarkAsRead(idToUse);
                                                                }
                                                            }}
                                                        >
                                                            <div className="relative mr-3">
                                                                <img
                                                                    src={senderInfo?.avartarURL || "/api/placeholder/40/40"}
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
                                                                        {senderInfo ? `${senderInfo.firstName} ${senderInfo.lastName}` : (notification.type === 'SYSTEM' ? 'Hệ thống' : 'Người dùng')}
                                                                    </span>{' '}
                                                                    {notification.content || notification.message}
                                                                </p>
                                                                <div className="flex items-center mt-1">
                                                                    <span className="text-xs text-gray-500">
                                                                        {getRelativeTime(notification.sendAt || notification.createdAt)}
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
                                                {showingUnreadOnly ? 'Không có thông báo chưa đọc' : 'Không có thông báo nào'}
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
                        {/* Avatar user */}
                        <div className="relative">
                            <button
                                onClick={() => setMobileAvatarDropdownOpen(open => !open)}
                                className="block focus:outline-none mobile-avatar-btn"
                            >
                                <img src={profileData?.avatarUrl} className="w-8 h-8 rounded-full border border-white/20" />
                            </button>
                            {mobileAvatarDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 mobile-avatar-dropdown">
                                    <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">Account</div>
                                    {dropdownItems.slice(0, 3).map((item) => (
                                        <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50" onClick={() => setMobileAvatarDropdownOpen(false)}>
                                            <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                            {item.label}
                                        </Link>
                                    ))}
                                    {/* Các mục còn lại */}
                                    {dropdownItems.slice(3, 4).map((item) => (
                                        <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50" onClick={() => setMobileAvatarDropdownOpen(false)}>
                                            <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                            {item.label}
                                        </Link>
                                    ))}
                                    <hr className="my-2" />
                                    <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">Support</div>
                                    {dropdownItems.slice(4, 6).map((item) => (
                                        <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50" onClick={() => setMobileAvatarDropdownOpen(false)}>
                                            <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                            {item.label}
                                        </Link>
                                    ))}
                                    <hr className="my-2" />
                                    <button
                                        onClick={() => {
                                            logout();
                                            setMobileAvatarDropdownOpen(false);
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
                    </div>
                )}

                {/* Right section (notification & user) */}
                <div className="flex items-center space-x-4 ml-auto">
                    {isAuthenticated ? (
                        <>
                            {/* Notification */}
                            <div
                                className="relative"
                                ref={notificationDropdownRef}
                            >
                                <button
                                    className="relative notification-btn"
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
                                                    className={`flex-1 py-1 font-medium ${!showingUnreadOnly ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                                    onClick={() => setShowingUnreadOnly(false)}
                                                >
                                                    Tất cả
                                                </button>
                                                <button
                                                    className={`flex-1 py-1 ${showingUnreadOnly ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                                    onClick={toggleUnreadOnly}
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
                                                notifications
                                                    .filter(notification => !showingUnreadOnly || !notification.isRead) // Lọc theo chưa đọc
                                                    .map((notification, index) => {
                                                        const userId = notification.accountId || notification.senderId;
                                                        // Ưu tiên sử dụng thông tin người dùng đính kèm trong thông báo
                                                        const senderInfo = notification.userInfo || (userId ? userInfoMap[userId] : null);
                                                        // Sử dụng index kết hợp với ID để đảm bảo key luôn duy nhất
                                                        const uniqueKey = notification.id ? `notification-${notification.id}` : `notification-index-${index}`;
                                                        return (
                                                            <div
                                                                key={uniqueKey}
                                                                className={`flex p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                                                onClick={() => {
                                                                    console.log("Clicked notification:", notification);

                                                                    if (!notification.isRead) {
                                                                        // Ưu tiên sử dụng ID đúng nếu có
                                                                        const idToUse = notification.notificationId || notification.id;
                                                                        handleMarkAsRead(idToUse);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="relative mr-3">
                                                                    <img
                                                                        src={senderInfo?.avartarURL || "/api/placeholder/40/40"}
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
                                                                            {senderInfo ? `${senderInfo.firstName} ${senderInfo.lastName}` : (notification.type === 'SYSTEM' ? 'Hệ thống' : 'Người dùng')}
                                                                        </span>{' '}
                                                                        {notification.content || notification.message}
                                                                    </p>
                                                                    <div className="flex items-center mt-1">
                                                                        <span className="text-xs text-gray-500">
                                                                            {getRelativeTime(notification.sendAt || notification.createdAt)}
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
                                                    {showingUnreadOnly ? 'Không có thông báo chưa đọc' : 'Không có thông báo nào'}
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
                                    <img src={profileData?.avatarUrl} className="w-8 h-8 rounded-full mr-2 border border-white/20" alt="User" />
                                    <span>{profileData?.firstName} {profileData?.lastName}</span>
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
                                        {/* Các mục còn lại */}
                                        {dropdownItems.slice(3, 4).map((item) => (
                                            <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                                                <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                                {item.label}
                                            </Link>
                                        ))}
                                        <hr className="my-2" />
                                        <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">Support</div>
                                        {dropdownItems.slice(4, 6).map((item) => (
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
        </nav>
    );
}
