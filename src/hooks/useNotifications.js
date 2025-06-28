import { useState, useRef, useEffect } from 'react';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead } from "@/apis/notificationService";
import { getAccountInfo } from "@/apis/accountService";
import { getInviteById } from "@/apis/startupService";
import signalRService from "@/services/signalRService";
import Cookies from "js-cookie";
import { toast } from 'react-toastify';

export default function useNotifications(currentUserId, isAuthenticated) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const [userInfoMap, setUserInfoMap] = useState({});
    const [showingUnreadOnly, setShowingUnreadOnly] = useState(false);
    const notificationTimeoutRef = useRef(null);

    // Thêm state cho thông báo lời mời
    const [inviteDetails, setInviteDetails] = useState(null);
    const [loadingInvite, setLoadingInvite] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);

    // Kết nối SignalR khi component mount
    useEffect(() => {
        if (!isAuthenticated || !currentUserId) return;
        const initializeSignalR = async () => {
            signalRService.registerCallbacks({
                onReceiveNotification: async (notification) => {
                    const userId = notification.accountId || notification.senderId;
                    if (userId) {
                        try {
                            const userInfo = await getAccountInfo(userId);
                            if (userInfo) {
                                setUserInfoMap(prev => ({ ...prev, [userId]: userInfo }));
                                setNotifications(prev => [{ ...notification, userInfo }, ...prev]);
                                setUnreadCount(prev => prev + 1);
                            }
                        } catch (error) {
                            setNotifications(prev => [notification, ...prev]);
                            setUnreadCount(prev => prev + 1);
                        }
                    } else {
                        setNotifications(prev => [notification, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    }

                    // Hiển thị toast thông báo đặc biệt cho lời mời startup
                    if (notification.type?.toLowerCase() === 'invite') {
                        toast.info('Bạn có lời mời tham gia startup mới!', {
                            autoClose: 5000,
                            position: 'top-right'
                        });
                    }
                },
                onReceiveUnreadCount: (count) => {
                    setUnreadCount(count);
                },
                onNotificationRead: (notificationId, unreadCount) => {
                    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
                    setUnreadCount(unreadCount);
                },
                onUserInfoReceived: (userId, userInfo) => {
                    setUserInfoMap(prev => ({ ...prev, [userId]: userInfo }));
                    setNotifications(prev => prev.map(notification => {
                        const notificationUserId = notification.accountId || notification.senderId;
                        if (notificationUserId === userId) {
                            return { ...notification, userInfo };
                        }
                        return notification;
                    }));
                }
            });
            await signalRService.initConnection(currentUserId);
        };
        initializeSignalR();
        return () => {
            signalRService.disconnect();
            clearTimeout(notificationTimeoutRef.current);
        };
    }, [isAuthenticated, currentUserId]);

    // Lấy thông báo khi component mount
    useEffect(() => {
        if (isAuthenticated && currentUserId) {
            fetchNotifications(1, true);
            fetchUnreadCount();
        }
        // eslint-disable-next-line
    }, [isAuthenticated, currentUserId]);

    // Lấy danh sách thông báo
    const fetchNotifications = async (page = pageNumber, reset = false) => {
        if (!currentUserId || loading) return;
        try {
            setLoading(true);
            const response = await getNotifications(currentUserId, page, pageSize);
            if (response && response.items) {
                const processedItemsPromises = response.items.map(async (item, idx) => {
                    const notificationId = item.notificationId;
                    let processedItem = item;
                    if (notificationId) {
                        processedItem = { ...item, id: notificationId };
                    } else {
                        processedItem = { ...item, id: `temp-id-${Date.now()}-${idx}` };
                    }
                    const userId = processedItem.accountId || processedItem.senderId;
                    if (userId) {
                        try {
                            const userInfo = await getAccountInfo(userId);
                            if (userInfo) {
                                setUserInfoMap(prev => ({ ...prev, [userId]: userInfo }));
                                processedItem.userInfo = userInfo;
                            }
                        } catch (error) { }
                    }

                    // Nếu là thông báo lời mời, thêm thông tin đặc biệt
                    if (processedItem.type?.toLowerCase() === 'invite' && processedItem.targetURL) {
                        processedItem.isInvite = true;

                        // Lấy inviteId từ targetURL nếu có
                        const inviteIdMatch = processedItem.targetURL.match(/\/invite\/(\d+)/);
                        if (inviteIdMatch && inviteIdMatch[1]) {
                            processedItem.inviteId = inviteIdMatch[1];
                        }
                    }

                    return processedItem;
                });
                const processedItems = await Promise.all(processedItemsPromises);
                if (reset || page === 1) {
                    setNotifications(processedItems);
                } else {
                    setNotifications(prev => [...prev, ...processedItems]);
                }
                setHasMore(response.items.length === pageSize);
            }
        } catch (error) {
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
        } catch (error) { }
    };

    // Đánh dấu thông báo là đã đọc
    const handleMarkAsRead = async (notificationId) => {
        if (!currentUserId) return;
        try {
            await markNotificationAsRead(notificationId, currentUserId);
            setNotifications(prev => prev.map(n => n.id == notificationId ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) { }
    };

    // Đánh dấu tất cả thông báo là đã đọc
    const markAllAsRead = async () => {
        if (!currentUserId) return;
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
        } catch (error) {
            toast.error('Không thể đánh dấu tất cả thông báo là đã đọc');
        }
    };

    // Tải thêm thông báo khi cuộn xuống hoặc nhấn nút "Tải thêm"
    const loadMoreNotifications = () => {
        if (hasMore && !loading) {
            setPageNumber(prev => prev + 1);
        }
    };

    // Tải thêm khi pageNumber thay đổi
    useEffect(() => {
        if (isAuthenticated && currentUserId && pageNumber > 1) {
            fetchNotifications(pageNumber);
        }
        // eslint-disable-next-line
    }, [pageNumber, isAuthenticated, currentUserId]);

    // Toggle chỉ hiển thị chưa đọc
    const toggleUnreadOnly = () => {
        setShowingUnreadOnly(!showingUnreadOnly);
    };

    // Xử lý khi nhấp vào thông báo lời mời
    const handleInviteNotification = async (notification) => {
        if (!notification || !notification.inviteId) return null;

        try {
            setLoadingInvite(true);
            const inviteData = await getInviteById(notification.inviteId);
            setInviteDetails(inviteData);
            setShowInviteModal(true);
            return inviteData;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin lời mời:', error);
            toast.error('Không thể lấy thông tin lời mời');
            return null;
        } finally {
            setLoadingInvite(false);
        }
    };

    // Đóng modal lời mời
    const closeInviteModal = () => {
        setShowInviteModal(false);
        setInviteDetails(null);
    };

    return {
        notifications,
        unreadCount,
        loading,
        hasMore,
        pageNumber,
        userInfoMap,
        showingUnreadOnly,
        setShowingUnreadOnly,
        fetchNotifications,
        fetchUnreadCount,
        handleMarkAsRead,
        markAllAsRead,
        loadMoreNotifications,
        toggleUnreadOnly,
        setPageNumber,
        setNotifications,
        // Thêm các hàm và state mới cho xử lý lời mời
        inviteDetails,
        loadingInvite,
        showInviteModal,
        handleInviteNotification,
        closeInviteModal,
        setInviteDetails,
        setShowInviteModal
    };
} 