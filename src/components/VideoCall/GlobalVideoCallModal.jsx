import React from 'react';
import { useVideoCallContext } from '@/contexts/VideoCallContext';

const GlobalVideoCallModal = () => {
    const {
        isCallModalOpen,
        isCallActive,
        isCallIncoming,
        callerInfo,
        calleeInfo,
        isMuted,
        isVideoOff,
        connectionEstablished,
        localVideoRef,
        remoteVideoRef,
        endCall,
        answerCall,
        rejectCall,
        toggleMute,
        toggleVideo,
    } = useVideoCallContext();

    // Không hiển thị modal nếu không có cuộc gọi
    if (!isCallModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header của modal cuộc gọi */}
                <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                    <div className="text-white font-bold flex items-center">
                        <i className="fas fa-video mr-3"></i>
                        {isCallIncoming ? (
                            <span>Incoming Call from {callerInfo?.name || "Unknown"}</span>
                        ) : (
                            <span>
                                {isCallActive && connectionEstablished
                                    ? `Connected with ${calleeInfo?.name || "Unknown"}`
                                    : `Calling ${calleeInfo?.name || "Unknown"}...`
                                }
                            </span>
                        )}
                    </div>

                    {/* Nút điều khiển cuộc gọi - chỉ hiển thị khi đang trong cuộc gọi */}
                    {!isCallIncoming && (
                        <div className="flex space-x-2">
                            <button
                                className={`p-2 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-80`}
                                title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                                onClick={toggleVideo}
                                disabled={!isCallActive}
                            >
                                <i className={`fas ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
                            </button>
                            <button
                                className={`p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-80`}
                                title={isMuted ? "Turn on microphone" : "Turn off microphone"}
                                onClick={toggleMute}
                                disabled={!isCallActive}
                            >
                                <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                            </button>
                            <button
                                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                                title="End call"
                                onClick={endCall}
                            >
                                <i className="fas fa-phone-slash"></i>
                            </button>
                        </div>
                    )}
                </div>

                {/* Nội dung modal cuộc gọi */}
                <div className="flex-1 flex flex-col md:flex-row min-h-[400px]">
                    {/* Khu vực hiển thị video */}
                    <div className="flex-1 relative">
                        {/* Video người nhận */}
                        <div className="h-full bg-gray-800 flex items-center justify-center">
                            {connectionEstablished ? (
                                <video
                                    ref={remoteVideoRef}
                                    className="h-full w-full object-cover"
                                    autoPlay
                                    playsInline
                                />
                            ) : (
                                <div className="text-center p-6">
                                    {/* Avatar người gọi/người nhận */}
                                    <div className="h-24 w-24 rounded-full mx-auto mb-4 overflow-hidden border-4 border-gray-600">
                                        {isCallIncoming && callerInfo?.avatarUrl ? (
                                            <img
                                                src={callerInfo.avatarUrl}
                                                alt={callerInfo.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : calleeInfo?.avatarUrl ? (
                                            <img
                                                src={calleeInfo.avatarUrl}
                                                alt={calleeInfo.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="w-full h-full bg-gray-600 flex items-center justify-center" style={{ display: 'none' }}>
                                            <i className="fas fa-user text-gray-400 text-2xl"></i>
                                        </div>
                                    </div>

                                    {/* Trạng thái cuộc gọi */}
                                    {isCallIncoming ? (
                                        <div>
                                            <h3 className="text-white text-xl font-medium mb-6">
                                                {callerInfo?.name || "Unknown"} is calling...
                                            </h3>
                                            <div className="flex items-center justify-center mb-6">
                                                <div className="animate-bounce">
                                                    <i className="fas fa-phone text-green-400 text-2xl"></i>
                                                </div>
                                                <span className="ml-3 text-white">Incoming call</span>
                                            </div>

                                            {/* Nút trả lời và từ chối ở giữa */}
                                            <div className="flex justify-center space-x-6">
                                                <button
                                                    className="w-16 h-16 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-lg transition-all duration-200"
                                                    title="Reject call"
                                                    onClick={rejectCall}
                                                >
                                                    <i className="fas fa-phone-slash text-xl"></i>
                                                </button>
                                                <button
                                                    className="w-16 h-16 rounded-full bg-green-500 text-white hover:bg-green-600 flex items-center justify-center shadow-lg transition-all duration-200"
                                                    title="Answer call"
                                                    onClick={answerCall}
                                                >
                                                    <i className="fas fa-phone text-xl"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <h3 className="text-white text-xl font-medium mb-3">
                                                Calling {calleeInfo?.name || "Unknown"}
                                            </h3>
                                            <div className="flex items-center justify-center">
                                                <div className="animate-pulse">
                                                    <i className="fas fa-phone text-white text-2xl"></i>
                                                </div>
                                                <span className="ml-3 text-white">Calling...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Video local (góc dưới bên phải) */}
                        <div className="absolute bottom-4 right-4 w-1/4 aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
                            <video
                                ref={localVideoRef}
                                className="h-full w-full object-cover"
                                autoPlay
                                muted
                                playsInline
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalVideoCallModal;
