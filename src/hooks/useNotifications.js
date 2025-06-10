import { useState, useRef, useEffect } from 'react';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead } from "@/apis/notificationService";
import { getAccountInfo } from "@/apis/accountService";
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
    };
} 