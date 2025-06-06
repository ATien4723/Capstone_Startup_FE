import React from 'react';

const PostMediaGrid = ({ media }) => {
  if (!media || media.length === 0) return null;

  // Sắp xếp media theo displayOrder
  const sortedMedia = [...media].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Chỉ hiển thị tối đa 4 ảnh
  const displayMedia = sortedMedia.slice(0, 4);
  const hiddenCount = sortedMedia.length - 4;

  // Bố cục lưới tùy theo số lượng
  const getGridClasses = () => {
    switch (sortedMedia.length) {
      case 1:
        return "grid grid-cols-1";
      case 2:
        return "grid grid-cols-2 gap-0.5";
      case 3:
        return "grid grid-cols-2 grid-rows-2 gap-0.5";
      default:
        return "grid grid-cols-2 gap-0.5";
    }
  };

  // Class cho từng item ảnh
  const getItemClasses = (index, total) => {
    let classes = "relative overflow-hidden";

    if (total === 1) {
      classes += " max-h-[500px]";
    } else {
      classes += " h-[200px]";
    }

    if (total === 3 && index === 0) {
      classes += " col-span-2";
    }

    return classes;
  };

  return (
    <div className={`mt-3 ${getGridClasses()}`}>
      {displayMedia.map((item, index) => (
        <div
          key={`media-${item.postMediaId || index}`}
          className={getItemClasses(index, sortedMedia.length)}
        >
          <img
            src={
              item.mediaUrl ||
              "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg"
            }
            alt={`Media ${index + 1}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg";
            }}
          />
          {index === 3 && hiddenCount > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-2xl font-bold">
              +{hiddenCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostMediaGrid;
