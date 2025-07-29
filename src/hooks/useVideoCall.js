import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
// import SimplePeer from 'simple-peer'; // Uncomment khi đã cài đặt simple-peer
import { sendCallSignal, answerCallSignal, rejectCallSignal, endCallSignal } from '@/apis/videoCallService';
// import signalRService, { registerVideoCallHandlers } from '@/services/signalRService';

export default function useVideoCall(currentUserId) {
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isCallIncoming, setIsCallIncoming] = useState(false);
    const [callerInfo, setCallerInfo] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const streamRef = useRef(null);
    const connectionRef = useRef(null);

    // // Đăng ký các handlers cho cuộc gọi video qua SignalR
    // useEffect(() => {
    //     registerVideoCallHandlers({
    //         onIncomingCall: (callData) => {
    //             setCallerInfo({
    //                 id: callData.callerId,
    //                 name: callData.callerName,
    //                 avatar: callData.callerAvatar
    //             });
    //             setIsCallIncoming(true);
    //             setIsCallModalOpen(true);

    //             // Lưu signal data
    //             connectionRef.current = callData.signal;
    //         },
    //         onCallAnswered: (answerData) => {
    //             // Khi cuộc gọi được trả lời, thiết lập kết nối peer
    //             if (peerRef.current && answerData.signal) {
    //                 try {
    //                     // peer.signal(JSON.parse(answerData.signal));
    //                     setIsCallActive(true);
    //                     toast.success(`${answerData.targetName} đã trả lời cuộc gọi`);
    //                 } catch (error) {
    //                     console.error("Lỗi khi xử lý tín hiệu trả lời:", error);
    //                 }
    //             }
    //         },
    //         onCallRejected: () => {
    //             endCall();
    //         },
    //         onCallEnded: () => {
    //             endCall();
    //         },
    //         onSignalReceived: (signalData) => {
    //             // Xử lý tín hiệu WebRTC
    //             if (peerRef.current && signalData.signal) {
    //                 try {
    //                     // peer.signal(JSON.parse(signalData.signal));
    //                 } catch (error) {
    //                     console.error("Lỗi khi xử lý tín hiệu:", error);
    //                 }
    //             }
    //         }
    //     });

    //     return () => {
    //         // Cleanup khi unmount
    //         endCall();
    //     };
    // }, []);

    // Hàm bắt đầu cuộc gọi video
    const startVideoCall = async (targetUserId, targetName) => {
        try {
            // Hiển thị modal cuộc gọi
            setIsCallModalOpen(true);

            // Mở stream video và âm thanh
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Lưu stream để có thể đóng sau này
            streamRef.current = stream;

            // Hiển thị video local
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Thiết lập WebRTC với simple-peer
            /*
            const peer = new SimplePeer({
                initiator: true,
                trickle: false,
                stream: stream
            });

            peer.on('signal', async data => {
                // Gửi tín hiệu qua API
                try {
                    await sendCallSignal(targetUserId, JSON.stringify(data));
                } catch (error) {
                    console.error("Lỗi khi gửi tín hiệu cuộc gọi:", error);
                    toast.error("Không thể kết nối đến người dùng");
                    endCall();
                }
            });

            peer.on('stream', remoteStream => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                    setIsCallActive(true);
                }
            });

            peer.on('close', () => {
                endCall();
            });

            peer.on('error', (err) => {
                console.error("Lỗi kết nối peer:", err);
                toast.error("Lỗi kết nối cuộc gọi");
                endCall();
            });

            peerRef.current = peer;
            */

            // Đánh dấu cuộc gọi đang hoạt động
            // Trong triển khai thực tế, chỉ đánh dấu khi cuộc gọi đã được kết nối
            // Ở đây chúng ta giả lập cho giao diện
            setTimeout(() => {
                setIsCallActive(true);
            }, 2000);

            // Gửi thông báo đến người dùng khác qua API
            toast.info(`Đang gọi cho ${targetName}...`);

            // Gửi yêu cầu cuộc gọi (không có tín hiệu thực tế)
            try {
                await sendCallSignal(targetUserId, null);
            } catch (error) {
                console.error("Lỗi khi gửi yêu cầu cuộc gọi:", error);
                toast.error("Không thể kết nối đến người dùng");
                endCall();
            }

        } catch (error) {
            console.error("Lỗi khi bắt đầu cuộc gọi video:", error);
            toast.error("Không thể bắt đầu cuộc gọi video: " + error.message);
            endCall();
        }
    };

    // Hàm kết thúc cuộc gọi
    const endCall = () => {
        // Dừng tất cả tracks của stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Đóng kết nối WebRTC nếu có
        if (peerRef.current) {
            peerRef.current.destroy && peerRef.current.destroy();
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
        setIsCallActive(false);
        setIsCallIncoming(false);
        setCallerInfo(null);
        setIsCallModalOpen(false);

        // Gửi tín hiệu kết thúc cuộc gọi qua API (nếu có ID cuộc gọi)
        if (callerInfo?.id) {
            try {
                endCallSignal(callerInfo.id);
            } catch (error) {
                console.error("Lỗi khi kết thúc cuộc gọi:", error);
            }
        }
    };

    // Hàm trả lời cuộc gọi
    const answerCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            streamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            /*
            // Thiết lập WebRTC để trả lời cuộc gọi
            const peer = new SimplePeer({
                initiator: false,
                trickle: false,
                stream: stream
            });

            peer.on('signal', async data => {
                // Gửi tín hiệu trả lời qua API
                try {
                    await answerCallSignal(callerInfo.id, JSON.stringify(data));
                } catch (error) {
                    console.error("Lỗi khi gửi tín hiệu trả lời:", error);
                    toast.error("Không thể kết nối cuộc gọi");
                    endCall();
                }
            });

            peer.on('stream', remoteStream => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            });

            peer.on('close', () => {
                endCall();
            });

            peer.on('error', (err) => {
                console.error("Lỗi kết nối peer:", err);
                toast.error("Lỗi kết nối cuộc gọi");
                endCall();
            });

            // Kết nối với tín hiệu đã nhận từ người gọi
            if (connectionRef.current) {
                peer.signal(JSON.parse(connectionRef.current));
            }

            peerRef.current = peer;
            */

            setIsCallActive(true);
            setIsCallIncoming(false);

            // Giả lập trả lời cuộc gọi thông qua API
            if (callerInfo?.id) {
                try {
                    await answerCallSignal(callerInfo.id, null);
                } catch (error) {
                    console.error("Lỗi khi gửi tín hiệu trả lời:", error);
                }
            }

        } catch (error) {
            console.error("Lỗi khi trả lời cuộc gọi:", error);
            toast.error("Không thể trả lời cuộc gọi: " + error.message);
            endCall();
        }
    };

    // Hàm từ chối cuộc gọi
    const rejectCall = async () => {
        try {
            // Gửi thông báo từ chối cuộc gọi qua API
            if (callerInfo?.id) {
                await rejectCallSignal(callerInfo.id);
            }
        } catch (error) {
            console.error("Lỗi khi từ chối cuộc gọi:", error);
        } finally {
            setIsCallIncoming(false);
            setCallerInfo(null);
            setIsCallModalOpen(false);
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
        isMuted,
        isVideoOff,

        // Refs
        localVideoRef,
        remoteVideoRef,

        // Methods
        startVideoCall,
        endCall,
        // handleIncomingCall,
        answerCall,
        rejectCall,
        toggleMute,
        toggleVideo
    };
} 