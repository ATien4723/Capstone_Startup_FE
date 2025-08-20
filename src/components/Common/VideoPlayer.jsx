import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTimes } from '@fortawesome/free-solid-svg-icons';

const VideoPlayer = ({ videoUrl, onClose }) => {
    const [loading, setLoading] = useState(true);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Xem video Pitching
                    </h2>
                    <div className="flex items-center space-x-4">
                        <a
                            href={videoUrl}
                            download
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                            title="Tải xuống"
                        >
                            <FontAwesomeIcon icon={faDownload} />
                        </a>
                        <button
                            onClick={onClose}
                            className="text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                            title="Đóng"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                {/* Video Player */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                        </div>
                    )}
                    <video
                        className="max-w-full max-h-[70vh]"
                        controls
                        autoPlay
                        onLoadedData={() => setLoading(false)}
                        onError={() => setLoading(false)}
                    >
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer; 