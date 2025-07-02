import { useState } from 'react';

// Modal component
const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="w-full h-full max-w-5xl max-h-[80vh] relative p-6 flex flex-col">
            <button
                className="absolute top-4 right-4 text-3xl text-white hover:text-gray-300 z-50"
                onClick={onClose}
            >
                &times;
            </button>
            {children}
        </div>
    </div>
);

const MediaGalleryModal = ({ media, isOpen, onClose, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    if (!isOpen || !media || media.length === 0) return null;

    const sortedMedia = [...media].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const currentMedia = sortedMedia[currentIndex];

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === sortedMedia.length - 1 ? 0 : prev + 1));
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? sortedMedia.length - 1 : prev - 1));
    };

    const isVideo = (item) => {
        return (item.mediaType && item.mediaType.startsWith('video')) ||
            (typeof item.mediaUrl === 'string' && /\.(mp4|mov|webm|avi|mkv)$/i.test(item.mediaUrl));
    };

    return (
        <Modal onClose={onClose}>
            <div className="flex items-center justify-center h-full">
                <button
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 text-2xl font-bold text-white z-40"
                    onClick={goToPrevious}
                >
                    &#10094;
                </button>

                <div className="w-full h-full flex items-center justify-center">
                    {isVideo(currentMedia) ? (
                        <video
                            src={currentMedia.mediaUrl}
                            controls
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.poster = "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg";
                            }}
                            autoPlay
                        />
                    ) : (
                        <img
                            src={currentMedia.mediaUrl || "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg"}
                            alt={`Media ${currentIndex + 1}`}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg";
                            }}
                        />
                    )}
                </div>

                <button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 text-2xl font-bold text-white z-40"
                    onClick={goToNext}
                >
                    &#10095;
                </button>

                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                    {sortedMedia.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-3 h-3 rounded-full ${currentIndex === idx ? 'bg-white' : 'bg-white/50'}`}
                        />
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default MediaGalleryModal; 