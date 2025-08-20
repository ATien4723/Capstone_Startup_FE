import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import SimplePeer from 'simple-peer';
import { startCallApi, acceptCallApi, rejectCallApi, endCallApi, getCallHistoryApi } from '@/apis/videoCallService';
import { getUserId } from '@/apis/authService';
import callHubService from '@/services/callHubService';

export default function useVideoCall(currentUserId) {
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isCallIncoming, setIsCallIncoming] = useState(false);
    const [callerInfo, setCallerInfo] = useState(null);
    const [calleeInfo, setCalleeInfo] = useState(null); // Thông tin người nhận cuộc gọi
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callSession, setCallSession] = useState(null);
    const [connectionEstablished, setConnectionEstablished] = useState(false);
    const [targetConnectionId, setTargetConnectionId] = useState(null);
    const [roomToken, setRoomToken] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const streamRef = useRef(null);
    const targetConnectionIdRef = useRef(null);
    const roomTokenRef = useRef(null);

    // Khởi tạo kết nối SignalR khi component mount
    useEffect(() => {
        // Khởi tạo kết nối CallHub
        const initCallHub = async () => {
            await callHubService.initConnection();

            // Đăng ký các callback
            callHubService.registerCallbacks({
                onIncomingCall: handleIncomingCall,
                onReceiveOffer: handleReceiveOffer,
                onReceiveAnswer: handleReceiveAnswer,
                onReceiveIceCandidate: handleReceiveIceCandidate,
                onCallEnded: handleCallEnded
            });
        };

        initCallHub();

        // Cleanup khi component unmount
        return () => {
            endCall();
        };
    }, []);

    // Debug useEffect để theo dõi connectionEstablished
    // useEffect(() => {
    //     console.log('🔄 CONNECTION STATUS CHANGED:', {
    //         connectionEstablished,
    //         isCallActive,
    //         isCallIncoming,
    //         timestamp: new Date().toLocaleTimeString()
    //     });
    // }, [connectionEstablished, isCallActive, isCallIncoming]);

    // Xử lý khi nhận cuộc gọi đến qua SignalR
    const handleIncomingCall = async (data) => {
        // console.log("=== NHẬN CUỘC GỌI ĐẾN ===");
        // console.log("Data:", data);
        // console.log("data.roomToken:", data.roomToken);
        // console.log("data.senderConnectionId:", data.senderConnectionId);
        // console.log("data.callSessionId:", data.callSessionId);

        // Trích xuất thông tin người gọi từ đối tượng from
        const caller = data.from || {};
        const callerName = caller.fullName || data.from?.fullName || "Người gọi";

        // Hiển thị thông báo có cuộc gọi đến
        toast.info(`${callerName} calling...`, {
            autoClose: 10000,
            position: "top-right"
        });

        // Tham gia vào phòng cuộc gọi nếu có roomToken
        if (data.roomToken) {
            await callHubService.joinRoom(data.roomToken);
        }

        // Cập nhật state để hiển thị UI cuộc gọi đến
        // data.from chính là thông tin caller (người gọi)
        setCallerInfo({
            id: caller.accountId || data.from?.accountId,
            name: caller.fullName || data.from?.fullName || "Người gọi",
            avatarUrl: caller.avatarUrl || data.from?.avatarUrl || "",
            connectionId: data.senderConnectionId || null
        });


        // Lưu thông tin phiên gọi
        setCallSession(data.callSessionId);
        setRoomToken(data.roomToken);
        roomTokenRef.current = data.roomToken; // Lưu vào ref
        setTargetConnectionId(data.senderConnectionId || null);
        targetConnectionIdRef.current = data.senderConnectionId || null; // Lưu vào ref

        // console.log("=== SAU KHI SET REF ===");
        // console.log("roomTokenRef.current:", roomTokenRef.current);
        // console.log("targetConnectionIdRef.current:", targetConnectionIdRef.current);

        setIsCallIncoming(true);
        setIsCallModalOpen(true);
    };

    // Lưu offer để xử lý sau khi peer được tạo
    const pendingOfferRef = useRef(null);

    // Xử lý khi nhận offer WebRTC
    const handleReceiveOffer = (senderConnectionId, offer) => {
        // console.log("=== NHẬN OFFER ===");
        // console.log("Sender ConnectionId:", senderConnectionId);
        // console.log("Offer type:", typeof offer);
        // console.log("Offer value:", offer);
        // console.log("Offer JSON:", JSON.stringify(offer));
        // console.log("Peer hiện tại:", peerRef.current ? "Có" : "Không có");

        // Nếu đã có peer, xử lý offer ngay
        if (peerRef.current) {
            try {
                // console.log("Xử lý offer ngay lập tức với peer hiện tại");
                peerRef.current.signal(offer);
            } catch (error) {
                console.error("Error processing offer:", error);
            }
        } else {
            // Lưu offer để xử lý sau khi peer được tạo
            // console.log("Chưa có peer, lưu offer để xử lý sau");
            // console.log("Pending offer trước khi lưu:", pendingOfferRef.current);
            pendingOfferRef.current = offer;
            // console.log("Pending offer sau khi lưu:", pendingOfferRef.current);
        }
    };

    // Xử lý khi nhận answer WebRTC
    const handleReceiveAnswer = (senderConnectionId, answer) => {
        // console.log("Nhận answer từ:", senderConnectionId, answer);

        // Nếu đã có peer, xử lý answer
        if (peerRef.current) {
            try {
                peerRef.current.signal(answer);
            } catch (error) {
                console.error("Error processing answer:", error);
            }
        }
    };

    // Xử lý khi nhận ICE candidate
    const handleReceiveIceCandidate = (senderConnectionId, candidate) => {
        // console.log("Nhận ICE candidate từ:", senderConnectionId, candidate);

        // Nếu đã có peer, xử lý ICE candidate
        if (peerRef.current) {
            try {
                peerRef.current.signal({ candidate: candidate });
            } catch (error) {
                console.error("Error processing ICE candidate:", error);
            }
        }
    };

    // Xử lý khi cuộc gọi kết thúc
    const handleCallEnded = (data) => {
        // console.log("Nhận thông báo cuộc gọi kết thúc:", data);
        // toast.info("Cuộc gọi đã kết thúc");
        endCall();
    };

    // Hàm bắt đầu cuộc gọi video
    const startVideoCall = async (chatRoomId, targetName, targetInfo = null) => {
        try {
            // Reset trạng thái audio/video về mặc định khi bắt đầu cuộc gọi mới
            setIsMuted(false);
            setIsVideoOff(false);

            // Hiển thị modal cuộc gọi
            setIsCallModalOpen(true);

            // Đảm bảo kết nối CallHub đã được thiết lập
            const connectionId = await callHubService.initConnection();
            if (!connectionId) {
                throw new Error("Unable to connect to CallHub");
            }
            // console.log("Kết nối CallHub thành công, connectionId:", connectionId);

            // Mở stream video và âm thanh
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Lưu stream để có thể đóng sau này
            streamRef.current = stream;

            // Hiển thị video local với retry logic
            const assignLocalStreamWithRetry = (stream, maxRetries = 5, delay = 200) => {
                const tryAssign = (attempt) => {
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    } else if (attempt < maxRetries) {
                        setTimeout(() => tryAssign(attempt + 1), delay);
                    }
                };
                tryAssign(1);
            };

            assignLocalStreamWithRetry(stream);

            // Gọi API để bắt đầu cuộc gọi và gửi connectionId của mình
            const callResponse = await startCallApi(chatRoomId, getUserId(), connectionId);

            // Kiểm tra và log response
            // console.log("Phản hồi từ startCallApi:", callResponse);
            // console.log("callResponse keys:", callResponse ? Object.keys(callResponse) : 'null');

            // Lưu thông tin phiên gọi
            if (callResponse) {
                // console.log('callResponse.callSessionId:', callResponse.callSessionId);
                // console.log('callResponse.roomToken:', callResponse.roomToken);
                // console.log('callResponse.calleeConnectionId:', callResponse.calleeConnectionId);
                // console.log('callResponse.caller:', callResponse.caller);

                setCallSession(callResponse.callSessionId);

                // Lưu thông tin roomToken
                if (callResponse.roomToken) {
                    setRoomToken(callResponse.roomToken);
                    roomTokenRef.current = callResponse.roomToken; // Lưu vào ref để sử dụng ngay lập tức
                    // console.log('Đã set roomToken:', callResponse.roomToken);
                    // Tham gia vào phòng cuộc gọi
                    await callHubService.joinRoom(callResponse.roomToken);
                } else {
                    console.warn('Không có roomToken trong response');
                }

                // Lưu thông tin người được gọi từ targetInfo được truyền vào
                // console.log(' Setting Callee Info:', targetInfo);
                if (targetInfo) {
                    const calleeData = {
                        id: targetInfo.accountId || targetInfo.id,
                        name: targetInfo.fullName || targetInfo.name || targetName,
                        avatarUrl: targetInfo.avatarUrl || "",
                        connectionId: callResponse.calleeConnectionId
                    };
                    // console.log('Callee Data:', calleeData);
                    setCalleeInfo(calleeData);
                } else {
                    // Fallback nếu không có targetInfo
                    const fallbackData = {
                        id: null,
                        name: targetName,
                        avatarUrl: "",
                        connectionId: callResponse.calleeConnectionId
                    };
                    console.log('📞 Fallback Callee Data:', fallbackData);
                    setCalleeInfo(fallbackData);
                }

                // Lưu thông tin người gọi (chính mình)
                if (callResponse.caller) {
                    setCallerInfo({
                        id: callResponse.caller.accountId,
                        name: callResponse.caller.fullName || "Bạn",
                        avatarUrl: callResponse.caller.avatarUrl || "",
                        connectionId: null
                    });
                }

                // Lưu thông tin calleeConnectionId từ response
                if (callResponse.calleeConnectionId) {
                    setTargetConnectionId(callResponse.calleeConnectionId);
                    targetConnectionIdRef.current = callResponse.calleeConnectionId; // Lưu vào ref để sử dụng ngay lập tức
                    // console.log('Đã set targetConnectionId:', callResponse.calleeConnectionId);
                } else {
                    console.warn('Không có calleeConnectionId trong response');
                }
            } else {
                console.warn("Không nhận được dữ liệu phản hồi từ startCallApi");
            }

            // Thiết lập WebRTC với simple-peer
            // console.log('=== TẠO PEER CONNECTION (INITIATOR) ===');
            // console.log('Local stream:', stream);
            // console.log('Local stream tracks:', stream.getTracks());

            const peer = new SimplePeer({
                initiator: true,
                trickle: false, // Tắt trickle ICE cho ổn định hơn
                stream: stream,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ],
                    iceCandidatePoolSize: 10
                }
            });

            // console.log('Peer created (initiator):', peer);

            // Xử lý sự kiện khi có tín hiệu WebRTC (offer)
            peer.on('signal', async data => {
                // console.log('=== TÍN HIỆU KHỞI TẠO CUỘC GỌI ===');
                // console.log('Signal data:', data);
                // Gửi tín hiệu qua SignalR
                try {
                    // Sử dụng ref để lấy giá trị ngay lập tức
                    const currentTargetConnectionId = targetConnectionIdRef.current;
                    const currentRoomToken = roomTokenRef.current;
                    // console.log('targetConnectionId (ref):', currentTargetConnectionId, 'roomToken (ref):', currentRoomToken);

                    if (data.type === 'offer') {
                        // Ưu tiên gửi offer qua roomToken vì targetConnectionId có thể không đúng
                        const target = currentRoomToken || currentTargetConnectionId;
                        // console.log('Gửi offer đến target (ưu tiên roomToken):', target);
                        await callHubService.callUser(target, data);
                    } else if (data.candidate) {
                        const target = currentRoomToken || currentTargetConnectionId;
                        // console.log('Gửi ICE candidate đến target (ưu tiên roomToken):', target);
                        await callHubService.sendIceCandidate(target, data.candidate);
                    }
                } catch (error) {
                    console.error("Error sending WebRTC signal:", error);
                }
            });

            // Xử lý khi nhận được stream từ người khác
            peer.on('stream', remoteStream => {
                // Hàm retry để đợi video element được render
                const assignStreamWithRetry = (stream, maxRetries = 10, delay = 100) => {
                    const tryAssign = (attempt) => {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = stream;
                            setConnectionEstablished(true);
                        } else if (attempt < maxRetries) {
                            setTimeout(() => tryAssign(attempt + 1), delay);
                        }
                    };
                    tryAssign(1);
                };

                assignStreamWithRetry(remoteStream);
            });

            // Xử lý khi kết nối thành công
            peer.on('connect', () => {
                // console.log('🟢 KẾT NỐI P2P THÀNH CÔNG (initiator)');
                // console.log('🟢 SETTING connectionEstablished = true (từ connect event - initiator)');
                toast.success(`Đã kết nối với ${targetName}`);
                setConnectionEstablished(true);
            });

            // Xử lý khi đóng kết nối
            peer.on('close', () => {
                // console.log('Kết nối P2P đã đóng');
                endCall();
            });

            // Xử lý khi có lỗi
            peer.on('error', (err) => {
                console.error("Peer connection error:", err);
                toast.error("Call connection error");
                endCall();
            });

            // Lưu đối tượng peer để sử dụng sau
            peerRef.current = peer;
            // console.log('Đã lưu peer vào peerRef (initiator):', peerRef.current);

            // Hiển thị thông báo đang gọi
            toast.info(`Calling ${targetName}...`);

            // Đánh dấu đang gọi ngay lập tức (chưa kết nối)
            setIsCallActive(true);

        } catch (error) {
            console.error("Error starting video call:", error);
            toast.error("Unable to start video call: " + error.message);
            endCall();
        }
    };

    // Hàm kết thúc cuộc gọi
    const endCall = async () => {
        // Dừng tất cả tracks của stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Đóng kết nối WebRTC nếu có
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }

        // Xóa video
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        // Reset trạng thái cuộc gọi
        // console.log('🔴 RESETTING connectionEstablished = false (endCall)');
        setIsCallActive(false);
        setIsCallIncoming(false);
        setConnectionEstablished(false);

        // Reset trạng thái audio/video về mặc định
        setIsMuted(false);
        setIsVideoOff(false);

        // Reset refs
        targetConnectionIdRef.current = null;
        roomTokenRef.current = null;

        // Gọi API để kết thúc cuộc gọi nếu có callSessionId
        if (callSession) {
            try {
                await endCallApi(callSession, roomToken);
            } catch (error) {
                console.error("Error ending call:", error);
            } finally {
                setCallerInfo(null);
                setCallSession(null);
                setRoomToken(null);
                setTargetConnectionId(null);
                setIsCallModalOpen(false);
            }
        } else {
            setCallerInfo(null);
            setRoomToken(null);
            setTargetConnectionId(null);
            setIsCallModalOpen(false);
        }
    };

    // Hàm trả lời cuộc gọi
    const answerCall = async () => {
        // console.log("=== ANSWER CALL ĐƯỢC GỌI ===");
        // console.log("callSession:", callSession);
        // console.log("roomToken state:", roomToken);
        // console.log("targetConnectionId state:", targetConnectionId);
        // console.log("roomTokenRef.current:", roomTokenRef.current);
        // console.log("targetConnectionIdRef.current:", targetConnectionIdRef.current);

        try {
            // Reset trạng thái audio/video về mặc định khi trả lời cuộc gọi
            setIsMuted(false);
            setIsVideoOff(false);

            // Kiểm tra nếu không có callSessionId
            if (!callSession) {
                toast.error("Call information not found");
                return;
            }

            // Đảm bảo kết nối CallHub đã được thiết lập
            const connectionId = await callHubService.initConnection();
            if (!connectionId) {
                toast.error("Unable to connect to CallHub");
                return;
            }
            // console.log("Kết nối CallHub thành công khi trả lời, connectionId:", connectionId);
            // console.log("=== THÔNG TIN NGƯỜI NHẬN ===");
            // console.log("ConnectionId của người nhận:", connectionId);
            // console.log("TargetConnectionId (người gọi sẽ gửi offer đến):", targetConnectionIdRef.current);
            // console.log("RoomToken:", roomTokenRef.current);

            // Mở stream video và âm thanh
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            streamRef.current = stream;

            // Hiển thị video local với retry logic
            const assignLocalStreamWithRetry = (stream, maxRetries = 5, delay = 200) => {
                const tryAssign = (attempt) => {
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    } else if (attempt < maxRetries) {
                        setTimeout(() => tryAssign(attempt + 1), delay);
                    }
                };
                tryAssign(1);
            };

            assignLocalStreamWithRetry(stream);

            // Gọi API để chấp nhận cuộc gọi và gửi connectionId hiện tại
            await acceptCallApi(callSession, roomToken, connectionId);

            // Tham gia vào phòng cuộc gọi
            await callHubService.joinRoom(roomToken);

            // Thiết lập WebRTC để trả lời cuộc gọi
            // console.log('=== TẠO PEER CONNECTION (ANSWERER) ===');
            // console.log('Local stream:', stream);
            // console.log('Local stream tracks:', stream.getTracks());

            const peer = new SimplePeer({
                initiator: false,
                trickle: true,
                stream: stream,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            // console.log('Peer created (answerer):', peer);

            // Xử lý sự kiện khi có tín hiệu WebRTC (answer)
            peer.on('signal', async data => {
                // console.log('=== TÍN HIỆU TRẢ LỜI CUỘC GỌI ===');
                // console.log('Answer signal data:', data);

                // Gửi tín hiệu qua SignalR
                try {
                    // Sử dụng ref để lấy giá trị ngay lập tức
                    const currentTargetConnectionId = targetConnectionIdRef.current;
                    const currentRoomToken = roomTokenRef.current;

                    if (data.type === 'answer') {
                        // console.log('Gửi answer đến targetConnectionId:', currentTargetConnectionId, 'hoặc roomToken:', currentRoomToken);
                        // Luôn ưu tiên gửi qua roomToken vì targetConnectionId có thể null
                        const target = currentRoomToken || currentTargetConnectionId;
                        // console.log('Target cuối cùng để gửi answer:', target);
                        await callHubService.answerCall(target, data);
                    } else if (data.candidate) {
                        // console.log('Gửi ICE candidate đến roomToken:', currentRoomToken);
                        const target = currentRoomToken || currentTargetConnectionId;
                        await callHubService.sendIceCandidate(target, data.candidate);
                    }
                } catch (error) {
                    console.error("Error sending WebRTC signal:", error);
                }
            });

            // Xử lý khi nhận được stream từ người gọi
            peer.on('stream', remoteStream => {
                // Hàm retry để đợi video element được render
                const assignStreamWithRetry = (stream, maxRetries = 10, delay = 100) => {
                    const tryAssign = (attempt) => {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = stream;
                            setConnectionEstablished(true);
                        } else if (attempt < maxRetries) {
                            setTimeout(() => tryAssign(attempt + 1), delay);
                        }
                    };
                    tryAssign(1);
                };

                assignStreamWithRetry(remoteStream);
            });

            // Xử lý khi kết nối thành công
            peer.on('connect', () => {
                // console.log('🟢 KẾT NỐI P2P THÀNH CÔNG (answerer)');
                // console.log('🟢 SETTING connectionEstablished = true (từ connect event - answerer)');
                setConnectionEstablished(true);
                toast.success(`Đã kết nối với ${callerInfo?.name || 'người gọi'}`);
            });

            // Xử lý khi đóng kết nối
            peer.on('close', () => {
                // console.log('Kết nối P2P đã đóng');
                endCall();
            });

            // Xử lý khi có lỗi
            peer.on('error', (err) => {
                console.error("Peer connection error:", err);
                toast.error("Call connection error");
                endCall();
            });

            // Lưu đối tượng peer để sử dụng sau
            peerRef.current = peer;
            // console.log('Đã lưu peer vào peerRef (answerer):', peerRef.current);

            // Xử lý pending offer nếu có
            if (pendingOfferRef.current) {
                // console.log("=== XỬ LÝ PENDING OFFER ===");
                // console.log("Pending offer:", pendingOfferRef.current);
                try {
                    peer.signal(pendingOfferRef.current);
                    pendingOfferRef.current = null;
                    // console.log("Đã xử lý pending offer thành công");
                } catch (error) {
                    console.error("Error processing pending offer:", error);
                }
            } else {
                // console.log("Không có pending offer để xử lý");
            }

            // Đánh dấu cuộc gọi đang hoạt động
            setIsCallActive(true);
            setIsCallIncoming(false);

            // Hiển thị thông báo đang kết nối (không phải đã kết nối)
            toast.info(`Connecting to ${callerInfo?.name || 'caller'}...`);

        } catch (error) {
            console.error("Error answering call:", error);
            toast.error("Unable to answer call: " + error.message);
            endCall();
        }
    };

    // Hàm từ chối cuộc gọi
    const rejectCall = async () => {
        try {
            // Hiển thị thông báo từ chối
            toast.info("Call rejected");

            // Kiểm tra nếu không có callSessionId
            if (!callSession) {
                setIsCallIncoming(false);
                setCallerInfo(null);
                setIsCallModalOpen(false);
                return;
            }

            // Gọi API để từ chối cuộc gọi
            await rejectCallApi(callSession, roomToken);

            // Gọi API endCall để đảm bảo cuộc gọi được kết thúc hoàn toàn
            await endCallApi(callSession, roomToken);

        } catch (error) {
            console.error("Error rejecting call:", error);
        } finally {
            // Reset tất cả state liên quan đến cuộc gọi
            setIsCallIncoming(false);
            setIsCallActive(false);
            setConnectionEstablished(false);
            setCallerInfo(null);
            setCallSession(null);
            setRoomToken(null);
            setTargetConnectionId(null);
            setIsCallModalOpen(false);

            // Reset refs
            targetConnectionIdRef.current = null;
            roomTokenRef.current = null;
            pendingOfferRef.current = null;

            // Dừng media stream nếu có
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            // Đóng peer connection nếu có
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }

            // Clear video elements
            if (localVideoRef.current) localVideoRef.current.srcObject = null;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        }
    };

    // Hàm tắt/bật microphone
    const toggleMute = () => {
        if (streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    // Hàm tắt/bật camera
    const toggleVideo = () => {
        if (streamRef.current) {
            const videoTracks = streamRef.current.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    return {
        // State
        isCallModalOpen,
        isCallActive,
        isCallIncoming,
        callerInfo,
        calleeInfo,
        isMuted,
        isVideoOff,
        callSession,
        connectionEstablished,

        // Refs
        localVideoRef,
        remoteVideoRef,

        // Methods
        startVideoCall,
        endCall,
        answerCall,
        rejectCall,
        toggleMute,
        toggleVideo
    };
} 