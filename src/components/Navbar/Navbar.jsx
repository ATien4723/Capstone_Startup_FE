import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell, faCaretDown, faBars, faTimes, faUser,
    faCog, faEnvelope, faQuestionCircle, faHeadset, faSignOutAlt,
    faCheck, faCommentAlt, faShare, faBuildingUser, faXmark, faCheckCircle, faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { logout, getUserId, getUserInfoFromToken } from "@/apis/authService";
import { useAuth } from '@/contexts/AuthContext'; // Thêm import useAuth
import Cookies from "js-cookie";
import { getRelativeTime } from "@/utils/dateUtils";
import useNotifications from "@/hooks/useNotifications";
import { useProfileData } from '@/hooks/useProfileHooks';
import { getInviteById, respondToInvite } from '@/apis/startupService';
import PostModal from '@/components/PostMedia/PostModal';
import { toast } from 'react-toastify';


// Hàm trả về icon phù hợp với từng loại thông báo dựa vào trường 'type' từ API
const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
        case 'comment':
            return <FontAwesomeIcon icon={faCommentAlt} className="text-blue-500" />;
        case 'system':
            return <FontAwesomeIcon icon={faCheck} className="text-green-500" />;
        case 'mention':
            return <FontAwesomeIcon icon={faUser} className="text-purple-500" />;
        case 'share':
            return <FontAwesomeIcon icon={faShare} className="text-orange-500" />;
        case 'like':
            return <FontAwesomeIcon icon={faBell} className="text-pink-500" />;
        case 'invite':
            return <FontAwesomeIcon icon={faBuildingUser} className="text-indigo-500" />;
        default:
            return <FontAwesomeIcon icon={faBell} className="text-gray-500" />;
    }
};

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
    const { profileData } = useProfileData(currentUserId);
    const navigate = useNavigate();
    const [openPostModal, setOpenPostModal] = useState(false);
    const [modalPostId, setModalPostId] = useState(null);

    // Sử dụng AuthContext
    const { isMember } = useAuth();

    // Thêm state cho modal lời mời startup
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState(null);
    const [processingResponse, setProcessingResponse] = useState(false);

    // Thêm state để lưu trữ kết quả kiểm tra membership
    const [membershipStatus, setMembershipStatus] = useState(null);
    const [checkingMembership, setCheckingMembership] = useState(false);

    // Sử dụng custom hook cho notification
    const {
        notifications,
        unreadCount,
        loading: notificationLoading,
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
        inviteDetails,
        loadingInvite,
        handleInviteNotification,
        closeInviteModal,
        setInviteDetails
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

    const navItems = [
        { label: 'Home', to: '/home' },
        { label: 'My Network', to: '/mynetwork' },
        { label: 'Startups', to: '/startups' },
        { label: 'Messages', to: '/messages' },
        { label: 'Policy', to: '/policy' },
    ];

    const handleMyStartupsClick = () => {
        // Sử dụng isMember từ AuthContext
        if (isMember) {
            navigate('/me/dashboard');
        } else {
            navigate('/create-startup');
        }
    };

    const dropdownItems = [
        { label: 'Profile', to: `/profile/${currentUserId}`, icon: faUser },
        { label: 'Settings', to: `/settings/${currentUserId}`, icon: faCog },
        { label: 'My startups', isMyStartup: true, icon: faBuildingUser },
        { label: 'Messages', to: '/messages', icon: faEnvelope },
        { label: 'Help Center', to: '/help', icon: faQuestionCircle },
        { label: 'Contact Support', to: '/support', icon: faHeadset },
    ];

    // Hàm xử lý khi nhấp vào thông báo
    const handleNotificationClick = async (notification) => {
        if (!notification.isRead && notification.notificationId) {
            handleMarkAsRead(notification.notificationId);
        }

        // Kiểm tra nếu là thông báo lời mời tham gia startup
        if (notification.type?.toLowerCase() === 'invite') {
            // Kiểm tra và trích xuất inviteId từ targetURL nếu không có sẵn
            if (!notification.inviteId && notification.targetURL) {
                const inviteIdMatch = notification.targetURL.match(/\/invite\/(\d+)/);
                if (inviteIdMatch && inviteIdMatch[1]) {
                    notification.inviteId = inviteIdMatch[1];
                } else {
                    toast.error('Không thể mở lời mời. Vui lòng làm mới trang và thử lại.');
                    return;
                }
            }

            await handleInviteNotification(notification);
            setShowInviteModal(true);
            setNotificationDropdownOpen(false);
        } else if (notification.targetURL && notification.targetURL.startsWith('/post/')) {
            const postId = notification.targetURL.split('/post/')[1];
            setModalPostId(postId);
            setOpenPostModal(true);
            setNotificationDropdownOpen(false);
        } else if (notification.targetURL) {
            navigate(notification.targetURL);
        }
    };

    // Xử lý phản hồi lời mời
    const handleInviteResponse = async (accept) => {
        if (!inviteDetails || processingResponse) return;

        try {
            setProcessingResponse(true);

            const responseData = {
                inviteId: inviteDetails.inviteId,
                response: accept ? "Approved" : "Rejected"
            };
            await respondToInvite(responseData);
            // console.log("✅ Invite response thành công");
            // console.log("accept =", accept);
            // Hiển thị thông báo thành công
            if (accept) {
                toast.success('Bạn đã chấp nhận lời mời tham gia startup');
                // Chuyển hướng đến trang dashboard của startup
                window.location.href = '/me/dashboard';
            } else {
                toast.info('Bạn đã từ chối lời mời tham gia startup');
            }

            // Đóng modal
            closeInviteModal();

        } catch (error) {
            console.error('Lỗi khi phản hồi lời mời:', error);
            toast.error('Có lỗi xảy ra khi xử lý lời mời. Vui lòng thử lại sau.');
        } finally {
            setProcessingResponse(false);
        }
    };

    // Thay đổi phần render thông báo để sử dụng hàm handleNotificationClick
    const renderNotification = (notification, index) => {
        // Lấy userId từ accountId hoặc senderID (tùy API trả về)
        const userId = notification.accountId || notification.senderID;
        // Lấy thông tin người gửi nếu có, ưu tiên userInfo đính kèm, nếu không thì lấy từ userInfoMap
        const senderInfo = notification.userInfo || (userId ? userInfoMap[userId] : null);
        // Tạo key duy nhất cho mỗi thông báo (ưu tiên notificationId)
        const uniqueKey = notification.notificationId ? `notification-${notification.notificationId}` : `notification-index-${index}`;

        return (
            <div
                key={uniqueKey}
                className={`flex p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                onMouseDown={() => handleNotificationClick(notification)}
            >
                <div className="relative mr-3">
                    {/* Hiển thị avatar người gửi, ưu tiên avartarURL từ notification, nếu không có thì lấy từ senderInfo, nếu vẫn không có thì dùng placeholder */}
                    <img
                        src={notification.avartarURL || senderInfo?.avartarURL || "/api/placeholder/40/40"}
                        alt={senderInfo?.firstName || "User"}
                        className="w-12 h-12 rounded-full"
                    />
                    {/* Hiển thị icon loại thông báo */}
                    <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-gray-200">
                        {getNotificationIcon(notification.type)}
                    </div>
                </div>
                <div className="flex-1">
                    {/* Hiển thị tên người gửi (nếu có), nếu là SYSTEM thì ghi 'Hệ thống', còn lại là 'Người dùng' */}
                    <p className="text-gray-800 text-sm">
                        <span className="font-semibold">
                            {senderInfo ? `${senderInfo.firstName} ${senderInfo.lastName}` : (notification.type?.toLowerCase() === 'system' ? 'Hệ thống' : 'Người dùng')}
                        </span>{' '}
                        {/* Nội dung thông báo */}
                        {notification.content || notification.message}
                    </p>
                    <div className="flex items-center mt-1">
                        {/* Thời gian gửi thông báo (dạng tương đối) */}
                        <span className="text-xs text-gray-500">
                            {getRelativeTime(notification.createdAt)}
                        </span>
                    </div>
                </div>
                {/* Nếu thông báo chưa đọc thì hiển thị chấm tròn màu xanh */}
                {!notification.isRead && (
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    </div>
                )}
            </div>
        );
    };

    // Cập nhật phần render thông báo trong dropdown desktop
    const renderNotificationsDesktop = () => {
        if (notificationLoading && pageNumber === 1) {
            return (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
            );
        } else if (notifications.length > 0) {
            return notifications
                .filter(notification => !showingUnreadOnly || !notification.isRead)
                .map((notification, index) => renderNotification(notification, index));
        } else {
            return (
                <div className="text-center py-6 text-gray-500">
                    {showingUnreadOnly ? 'Không có thông báo chưa đọc' : 'Không có thông báo nào'}
                </div>
            );
        }
    };

    // Cập nhật phần render thông báo trong dropdown mobile
    const renderNotificationsMobile = () => {
        if (notificationLoading && pageNumber === 1) {
            return (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
            );
        } else if (notifications.length > 0) {
            return notifications
                .filter(notification => !showingUnreadOnly || !notification.isRead)
                .map((notification, index) => renderNotification(notification, index));
        } else {
            return (
                <div className="text-center py-6 text-gray-500">
                    {showingUnreadOnly ? 'Không có thông báo chưa đọc' : 'Không có thông báo nào'}
                </div>
            );
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-blue-900 to-blue-700 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/home" className="text-xl font-bold text-white">Simes</Link>

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
                                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full border-2 border-blue-900">{unreadCount}</span>
                                )}
                            </button>
                            {/* Dropdown thông báo cho mobile */}
                            {notificationDropdownOpen && (
                                <div
                                    ref={notificationDropdownRef}
                                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50"
                                    style={{ top: 'calc(100% + 8px)' }}
                                >
                                    <div className="p-3 border-b border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-gray-800 text-lg">Thông báo</h3>
                                            {/* <div className="flex space-x-2">
                                                <button
                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                    onClick={markAllAsRead}
                                                >
                                                    Đánh dấu đã đọc
                                                </button>
                                            </div> */}
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
                                        {renderNotificationsMobile()}
                                        {notificationLoading && pageNumber > 1 && (
                                            <div className="flex justify-center items-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                            </div>
                                        )}
                                        {hasMore && !notificationLoading && (
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
                                    {/* <div className="p-3 text-center border-t border-gray-100">
                                        <Link to="/notifications" className="text-blue-600 hover:underline text-sm font-medium">
                                            Xem tất cả
                                        </Link>
                                    </div> */}
                                </div>
                            )}
                        </div>
                        {/* Avatar user */}
                        <div className="relative">
                            <button
                                onClick={() => setMobileAvatarDropdownOpen(open => !open)}
                                className="block focus:outline-none"
                            >
                                <img src={profileData?.avatarUrl} className="w-8 h-8 rounded-full border border-white/20" />
                            </button>
                            {mobileAvatarDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50">
                                    <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">Account</div>
                                    {dropdownItems.slice(0, 3).map((item) =>
                                        item.isMyStartup ? (
                                            <button
                                                key={item.label}
                                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 w-full text-left"
                                                onClick={() => { handleMyStartupsClick(); setMobileAvatarDropdownOpen(false); }}
                                                type="button"
                                            >
                                                <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                                {item.label}
                                            </button>
                                        ) : (
                                            <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50" onClick={() => setMobileAvatarDropdownOpen(false)}>
                                                <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                                {item.label}
                                            </Link>
                                        )
                                    )}
                                    {/* Các mục còn lại */}
                                    {dropdownItems.slice(3, 4).map((item) => (
                                        <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50" onClick={() => setMobileAvatarDropdownOpen(false)}>
                                            <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                            {item.label}
                                        </Link>
                                    ))}
                                    <hr className="my-2" />
                                    <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">Support</div>
                                    {dropdownItems.slice(4, 5).map((item) => (
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
                                    ? 'bg-white/20 text-white'
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
                            >
                                <button
                                    className="relative notification-btn"
                                    onClick={toggleNotificationDropdown}
                                >
                                    <FontAwesomeIcon icon={faBell} className="text-lg hover:text-white/80" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full border-2 border-blue-900">{unreadCount}</span>
                                    )}
                                </button>

                                {/* Notification dropdown */}
                                {notificationDropdownOpen && (
                                    <div
                                        ref={notificationDropdownRef}
                                        className="absolute right-0 w-80 bg-white rounded-lg shadow-xl z-50"
                                        style={{ top: 'calc(100% + 8px)' }}
                                    >
                                        <div className="p-3 border-b border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold text-gray-800 text-lg">Thông báo</h3>
                                                {/* <div className="flex space-x-2">
                                                    <button
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                        onClick={markAllAsRead}
                                                    >
                                                        Đánh dấu đã đọc
                                                    </button>
                                                </div> */}
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
                                            {renderNotificationsDesktop()}
                                            {notificationLoading && pageNumber > 1 && (
                                                <div className="flex justify-center items-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                                </div>
                                            )}
                                            {hasMore && !notificationLoading && (
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
                                        {dropdownItems.slice(0, 3).map((item) =>
                                            item.isMyStartup ? (
                                                <button
                                                    key={item.label}
                                                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 w-full text-left"
                                                    onClick={handleMyStartupsClick}
                                                    type="button"
                                                >
                                                    <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                                    {item.label}
                                                </button>
                                            ) : (
                                                <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                                                    <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                                    {item.label}
                                                </Link>
                                            )
                                        )}
                                        {/* Các mục còn lại */}
                                        {dropdownItems.slice(3, 4).map((item) => (
                                            <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                                                <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                                {item.label}
                                            </Link>
                                        ))}
                                        <hr className="my-2" />
                                        <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">Support</div>
                                        {dropdownItems.slice(4, 5).map((item) => (
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
            {openPostModal && (
                <PostModal
                    postId={modalPostId}
                    onClose={() => setOpenPostModal(false)}
                />
            )}

            {/* Modal thông báo lời mời tham gia startup */}
            {showInviteModal && inviteDetails && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center pb-3 border-b">
                                    <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                                        Lời mời tham gia startup
                                    </h3>
                                    <button
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={closeInviteModal}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    {/* Thông tin người gửi lời mời */}
                                    <div className="flex items-center mb-4 bg-blue-50 p-3 rounded-lg">
                                        <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden">
                                            <img
                                                src={inviteDetails.senderAvatar || '/placeholder-avatar.png'}
                                                alt="Người gửi"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="text-md font-semibold text-gray-900">Người gửi lời mời</h4>
                                            <p className="text-sm text-gray-600">{inviteDetails.senderEmail}</p>
                                        </div>
                                    </div>

                                    {/* Thông tin người nhận */}
                                    <div className="flex items-center mb-4 bg-gray-50 p-3 rounded-lg">
                                        <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden">
                                            <img
                                                src={inviteDetails.receiveravatar || '/placeholder-avatar.png'}
                                                alt="Người nhận"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="text-md font-semibold text-gray-900">Người nhận lời mời</h4>
                                            <p className="text-sm text-gray-600">{inviteDetails.receiverEmail}</p>
                                        </div>
                                    </div>

                                    {/* Thông tin vai trò và startup */}
                                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Vai trò:</span>
                                            <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                {inviteDetails.roleName}
                                            </span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">ID Startup:</span>
                                            <span className="text-sm text-gray-900">{inviteDetails.startupId}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
                                            <span className="text-sm font-semibold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                                {inviteDetails.inviteStatus}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-700">Thời gian gửi:</span>
                                            <span className="text-sm text-gray-900">
                                                {new Date(inviteDetails.inviteSentAt).toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-2">
                                            Bạn có muốn tham gia startup này không?
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => handleInviteResponse(true)}
                                    disabled={processingResponse}
                                >
                                    {processingResponse ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                    )}
                                    Chấp nhận
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex items-center justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => handleInviteResponse(false)}
                                    disabled={processingResponse}
                                >
                                    {processingResponse ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                                    ) : (
                                        <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                                    )}
                                    Từ chối
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
