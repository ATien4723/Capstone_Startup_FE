import * as signalR from "@microsoft/signalr";
import { URL_API } from '@/config/axiosClient';
import { toast } from 'react-toastify';
import { getAccountInfo } from "@/apis/accountService";

class SignalRService {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        this.callbacks = {
            onReceiveNotification: null,
            onReceiveUnreadCount: null,
            onNotificationRead: null,
            onUserInfoReceived: null
        };
        this.chatConnection = null;
        this.chatConnected = false;
    }

    // Khởi tạo kết nối SignalR
    async initConnection(currentUserId) {
        if (!currentUserId) return;

        // Nếu đã có kết nối, không khởi tạo lại
        if (this.connection && this.isConnected) return;
        // Tạo kết nối SignalR
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${URL_API}hubs/notification`)
            .withAutomaticReconnect()
            .build();

        // Đăng ký event handler nhận thông báo mới
        this.connection.on('ReceiveNotification', async notification => {
            console.log('Nhận thông báo mới:', notification);
            // Lấy thông tin người dùng từ accountId hoặc senderId
            const userId = notification.accountId || notification.senderId;

            // Luôn lấy thông tin người dùng mới nhất từ API
            if (userId) {
                try {
                    const userInfo = await getAccountInfo(userId);

                    if (userInfo) {
                        // Gọi callback để cập nhật UI
                        if (this.callbacks.onUserInfoReceived) {
                            this.callbacks.onUserInfoReceived(userId, userInfo);
                        }

                        // Gán thông tin người dùng vào thông báo để hiển thị ngay
                        notification.userInfo = userInfo;
                    }
                } catch (error) {
                    console.error(`Error fetching user info for new notification:`, error);
                }
            } else {
                console.log('Thông báo không có accountId hoặc senderId:', notification);
            }

            // Gọi callback nếu có
            if (this.callbacks.onReceiveNotification) {
                this.callbacks.onReceiveNotification(notification);
            }

            // Hiển thị toast thông báo
            toast.info(notification.content || 'Bạn có thông báo mới');
        });

        // Đăng ký event handler cập nhật số lượng thông báo chưa đọc
        this.connection.on('ReceiveUnreadNotificationCount', data => {
            if (data && data.accountId && data.accountId.toString() === currentUserId.toString()) {
                if (this.callbacks.onReceiveUnreadCount) {
                    this.callbacks.onReceiveUnreadCount(data.unreadCount);
                }
            }
        });

        // Đăng ký event handler khi thông báo được đánh dấu đã đọc
        this.connection.on('NotificationRead', data => {
            if (data && data.isRead) {
                if (this.callbacks.onNotificationRead) {
                    this.callbacks.onNotificationRead(data.notificationId, data.unreadCount);
                }
            }
        });

        try {
            // Kết nối đến hub
            await this.connection.start();
            console.log("SignalR Connected!");

            // Tham gia nhóm thông báo của người dùng
            await this.connection.invoke("JoinGroup", currentUserId);
            console.log(`Đã tham gia nhóm thông báo của user ID: ${currentUserId}`);

            this.isConnected = true;
            return true;
        } catch (err) {
            console.error("SignalR Connection Error:", err);
            this.isConnected = false;
            return false;
        }
    }

    // Đăng ký các callback
    registerCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Ngắt kết nối
    async disconnect() {
        if (this.connection) {
            try {
                await this.connection.stop();
                console.log("SignalR disconnected");
                this.isConnected = false;
            } catch (err) {
                console.error("Lỗi khi dừng kết nối SignalR:", err);
            }
        }
    }

    // --- CHAT REALTIME ---
    async initChatConnection(chatRoomId, onReceiveMessage) {
        if (!chatRoomId) return;
        if (this.chatConnection && this.chatConnected) return;

        this.chatConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${URL_API}messagehub`)
            .withAutomaticReconnect()
            .build();

        this.chatConnection.on('ReceiveMessage', (message) => {
            console.log('Nhận tin nhắn từ sự kiện ReceiveMessage:', message);
            if (onReceiveMessage) onReceiveMessage(message);
        });

        this.chatConnection.on('NewMessage', (message) => {
            console.log('Nhận tin nhắn từ sự kiện NewMessage:', message);
            if (onReceiveMessage) onReceiveMessage(message);
        });

        try {
            await this.chatConnection.start();
            await this.chatConnection.invoke("JoinGroup", chatRoomId.toString());
            this.chatConnected = true;
            console.log('SignalR chat connected & joined group', chatRoomId);
        } catch (err) {
            console.error('SignalR Chat Connection Error:', err);
            this.chatConnected = false;
        }
    }

    async disconnectChat() {
        if (this.chatConnection) {
            try {
                await this.chatConnection.stop();
                this.chatConnected = false;
                console.log('SignalR chat disconnected');
            } catch (err) {
                console.error('Lỗi khi dừng kết nối SignalR chat:', err);
            }
        }
    }
}

// Tạo một instance duy nhất của service
const signalRService = new SignalRService();

export default signalRService;