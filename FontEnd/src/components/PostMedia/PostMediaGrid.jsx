import React, { useState } from 'react';
import MediaGalleryModal from '../Common/MediaGalleryModal';

const PostMediaGrid = ({ media }) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // const [initialMediaIndex, setInitialMediaIndex] = useState(0);

  if (!media || media.length === 0) return null;

  // Sắp xếp media theo displayOrder
  const sortedMedia = [...media].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Chỉ hiển thị tối đa 2 ảnh
  const displayMedia = sortedMedia.slice(0, 2);
  const hiddenCount = sortedMedia.length - 2;

  // Bố cục lưới tùy theo số lượng
  const getGridClasses = () => {
    switch (sortedMedia.length) {
      case 1:
        return "grid grid-cols-1";
      default:
        return "grid grid-cols-2 gap-0.5";
    }
  };

  // Class cho từng item ảnh
  const getItemClasses = (index, total) => {
    let classes = "relative overflow-hidden bg-black";

    if (total === 1) {
      classes += " max-h-[600px]";
    } else {
      classes += " h-[200px]";
    }

    return classes;
  };


  // const handleMediaClick = (index) => {
  //   setInitialMediaIndex(index);


  // Luôn mở gallery từ ảnh đầu tiên
  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
  };

  // Ngăn chặn sự kiện click lan truyền khi tương tác với video
  const handleVideoClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className={`mt-3 ${getGridClasses()}`}>
        {displayMedia.map((item, index) => {
          // Kiểm tra loại media: video hay ảnh
          const isVideo = (item.mediaType && item.mediaType.startsWith('video')) ||
            (typeof item.mediaUrl === 'string' && /\.(mp4|mov|webm|avi|mkv)$/i.test(item.mediaUrl));
          return (
            <div
              key={`media-${item.postMediaId || index}`}
              className={getItemClasses(index, sortedMedia.length)}
              // onClick={() => handleMediaClick(index)}
              onClick={isVideo ? null : handleOpenGallery}
            >
              {isVideo ? (
                <div className="w-full h-full relative cursor-default">
                  <video
                    src={item.mediaUrl}
                    controls
                    className="w-full h-full object-contain bg-black"
                    onClick={handleVideoClick}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.poster =
                        "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg";
                    }}
                  />
                </div>
              ) : (
                <img
                  src={
                    item.mediaUrl ||
                    "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg"
                  }
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-contain cursor-pointer"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg";
                  }}
                />
              )}
              {index === 1 && hiddenCount > 0 && (
                <div
                  className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-2xl font-bold cursor-pointer"
                  onClick={handleOpenGallery}
                >
                  +{hiddenCount}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MediaGalleryModal
        media={sortedMedia}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        // initialIndex={initialMediaIndex}
        initialIndex={0}
      />
    </>
  );
};

export default PostMediaGrid;
