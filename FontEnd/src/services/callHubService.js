import * as signalR from "@microsoft/signalr";
import { URL_API } from '@/config/axiosClient';
import { getUserId } from '@/apis/authService';


class CallHubService {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        this.connectionId = null;
        this.callbacks = {
            onIncomingCall: null,
            onReceiveOffer: null,
            onReceiveAnswer: null,
            onReceiveIceCandidate: null,
            onCallEnded: null,
            onCallAccepted: null,
            onCallRejected: null
        };
    }

    // Khởi tạo kết nối SignalR
    async initConnection() {
        // Nếu đã có kết nối, không khởi tạo lại
        if (this.connection && this.isConnected) {
            console.log("Đã có kết nối CallHub, trả về connectionId:", this.connectionId);
            return this.connectionId;
        }

        // Tạo kết nối SignalR
        // this.connection = new signalR.HubConnectionBuilder()
        //     .withUrl(`${URL_API}callhub?userId=${getUserId()}`)
        //     .withAutomaticReconnect()
        //     .build();
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${URL_API}api/callhub?userId=${getUserId()}`, {
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
                skipNegotiation: false
            })
            .withAutomaticReconnect()
            .build();

        // Đăng ký các event handler
        this.setupEventHandlers();

        try {
            // Kết nối đến hub
            await this.connection.start();
            console.log("CallHub Connected!");

            // Lưu connectionId để sử dụng sau
            this.connectionId = this.connection.connectionId;
            console.log("CallHub Connection ID:", this.connectionId);

            // Lưu connectionId vào localStorage để có thể sử dụng ở nơi khác
            localStorage.setItem('callHubConnectionId', this.connectionId);

            this.isConnected = true;
            return this.connectionId;
        } catch (err) {
            console.error("CallHub Connection Error:", err);
            this.isConnected = false;
            return null;
        }
    }

    // Thiết lập các event handler
    setupEventHandlers() {
        // Log tất cả events để debug
        // console.log("=== SETTING UP SIGNALR EVENT HANDLERS ===");

        // Xử lý khi có cuộc gọi đến
        this.connection.on("IncomingCall", data => {
            // console.log("=== SIGNALR EVENT: IncomingCall ===");
            // console.log("Data:", data);

            // Tham gia vào nhóm phòng gọi
            if (data && data.roomToken) {
                this.joinRoom(data.roomToken);
            }

            if (this.callbacks.onIncomingCall) {
                this.callbacks.onIncomingCall(data);
            }
        });

        // Xử lý khi nhận tín hiệu offer
        // Backend gửi (offer, connectionId) nhưng frontend expect (connectionId, offer)
        this.connection.on("ReceiveOffer", (offer, senderConnectionId) => {
            // console.log("=== SIGNALR EVENT: ReceiveOffer ===");
            // console.log("Offer:", offer, "SenderConnectionId:", senderConnectionId);
            if (this.callbacks.onReceiveOffer) {
                this.callbacks.onReceiveOffer(senderConnectionId, offer);
            }
        });

        // Xử lý khi nhận tín hiệu answer
        // Backend gửi (answer, connectionId) nhưng frontend expect (connectionId, answer)
        this.connection.on("ReceiveAnswer", (answer, senderConnectionId) => {
            // console.log("=== SIGNALR EVENT: ReceiveAnswer ===");
            // console.log("Answer:", answer, "SenderConnectionId:", senderConnectionId);
            if (this.callbacks.onReceiveAnswer) {
                this.callbacks.onReceiveAnswer(senderConnectionId, answer);
            }
        });

        // Xử lý khi nhận ICE candidate
        // Backend gửi (candidate, connectionId) nhưng frontend expect (connectionId, candidate)
        this.connection.on("ReceiveIceCandidate", (candidate, senderConnectionId) => {
            // console.log("=== SIGNALR EVENT: ReceiveIceCandidate ===");
            // console.log("Candidate:", candidate, "SenderConnectionId:", senderConnectionId);
            if (this.callbacks.onReceiveIceCandidate) {
                this.callbacks.onReceiveIceCandidate(senderConnectionId, candidate);
            }
        });

        // Xử lý khi cuộc gọi kết thúc
        this.connection.on("CallEnded", data => {
            // console.log("=== SIGNALR EVENT: CallEnded ===");
            // console.log("Data:", data);
            if (this.callbacks.onCallEnded) {
                this.callbacks.onCallEnded(data);
            }
        });

        // Thêm các event khác có thể có
        this.connection.on("CallAccepted", data => {
            // console.log("=== SIGNALR EVENT: CallAccepted ===");
            // console.log("Data:", data);
        });

        this.connection.on("CallRejected", data => {
            // console.log("=== SIGNALR EVENT: CallRejected ===");
            // console.log("Data:", data);
            // Xử lý như CallEnded để kết thúc cuộc gọi
            if (this.callbacks.onCallEnded) {
                this.callbacks.onCallEnded(data);
            }
        });

        // Catch-all để bắt các events không xác định
        this.connection.onreconnected = () => {
            // console.log("=== SIGNALR: Reconnected ===");
        };

        this.connection.onclose = () => {
            // console.log("=== SIGNALR: Connection Closed ===");
        };

        // Xử lý khi cuộc gọi được chấp nhận
        this.connection.on("CallAccepted", callSessionId => {
            console.log("Cuộc gọi được chấp nhận:", callSessionId);
            if (this.callbacks.onCallAccepted) {
                this.callbacks.onCallAccepted(callSessionId);
            }
        });

        // Xử lý khi cuộc gọi bị từ chối
        this.connection.on("CallRejected", callSessionId => {
            console.log("Cuộc gọi bị từ chối:", callSessionId);
            if (this.callbacks.onCallRejected) {
                this.callbacks.onCallRejected(callSessionId);
            }
        });
    }

    // Đăng ký các callback
    registerCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Tham gia vào phòng (group) theo roomToken
    async joinRoom(roomToken) {
        if (!this.isConnected) await this.initConnection();
        if (!roomToken) return false;

        try {
            await this.connection.invoke("JoinRoom", roomToken);
            // console.log("Đã tham gia phòng:", roomToken);
            return true;
        } catch (err) {
            console.error("Lỗi khi tham gia phòng:", err);
            return false;
        }
    }

    // Gửi tín hiệu offer đến người nhận
    async callUser(target, offer) {
        if (!this.isConnected) await this.initConnection();
        // console.log("=== GỬI OFFER ===");
        // console.log("Target (connectionId hoặc roomToken):", target);
        // console.log("Offer type:", typeof offer);
        // console.log("Offer value:", offer);
        // console.log("Offer JSON:", JSON.stringify(offer));

        try {
            // Nếu target là roomToken (khi connectionId null), gửi offer đến phòng
            await this.connection.invoke("SendOffer", target, offer);
            // console.log("Đã gửi offer thành công");
            return true;
        } catch (err) {
            console.error("Lỗi khi gọi SendOffer:", err);
            return false;
        }
    }

    // Gửi tín hiệu answer đến người gọi
    async answerCall(target, answer) {
        if (!this.isConnected) await this.initConnection();

        try {
            await this.connection.invoke("SendAnswer", target, answer);
            return true;
        } catch (err) {
            console.error("Lỗi khi gọi SendAnswer:", err);
            return false;
        }
    }

    // Gửi ICE candidate đến đối tác
    async sendIceCandidate(roomToken, candidate) {
        if (!this.isConnected) await this.initConnection();

        try {
            await this.connection.invoke("SendIceCandidate", roomToken, candidate);
            return true;
        } catch (err) {
            console.error("Lỗi khi gọi SendIceCandidate:", err);
            return false;
        }
    }

    // Lấy connectionId hiện tại
    getConnectionId() {
        if (this.connectionId) {
            return this.connectionId;
        }
        return localStorage.getItem('callHubConnectionId') || null;
    }

    // Ngắt kết nối
    async disconnect() {
        if (this.connection) {
            try {
                await this.connection.stop();
                console.log("CallHub disconnected");
                this.isConnected = false;
                this.connectionId = null;
                localStorage.removeItem('callHubConnectionId');
            } catch (err) {
                console.error("Lỗi khi dừng kết nối CallHub:", err);
            }
        }
    }
}

// Tạo một instance duy nhất của service
const callHubService = new CallHubService();

export default callHubService; 