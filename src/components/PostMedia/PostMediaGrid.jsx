import React from 'react';

const PostMediaGrid = ({ media }) => {
  if (!media || media.length === 0) return null;

  // Sắp xếp media theo displayOrder
  const sortedMedia = [...media].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Xác định layout dựa trên số lượng ảnh
  const getGridClasses = () => {
    switch (sortedMedia.length) {
      case 1:
        return "grid grid-cols-1";
      case 2:
        return "grid grid-cols-2 gap-0.5";
      case 3:
        return "grid grid-cols-2 gap-0.5 grid-rows-2";
      case 4:
      case 5:
        return "grid grid-cols-2 gap-0.5 auto-rows-[200px]";
      default:
        return "grid grid-cols-2 gap-0.5 auto-rows-[200px]";
    }
  };

  // Xác định class cho từng item
  const getItemClasses = (index, total) => {
    let classes = "relative overflow-hidden";

    // Nếu là 3 ảnh và là ảnh đầu tiên
    if (total === 3 && index === 0) {
      classes += " col-span-2";
    }

    // Chiều cao cho từng trường hợp
    if (total === 1) {
      classes += " max-h-[500px]";
    } else {
      classes += " h-[200px]";
    }

    return classes;
  };

  // Xác định class cho ảnh
  const getImageClasses = (total) => {
    let classes = "w-full h-full";

    // Nếu chỉ có 1 ảnh thì dùng object-contain, ngược lại dùng object-cover
    classes += total === 1 ? " object-contain" : " object-cover";

    return classes;
  };

  return (
    <div className={`mt-3 ${getGridClasses()}`}>
      {sortedMedia.map((item, index) => (
        <div
          key={`media-${item.postMediaId || index}`}
          className={getItemClasses(index, sortedMedia.length)}
        >
          <img
            src={item.mediaUrl || "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg"}
            alt={`Media ${index + 1}`}
            className={getImageClasses(sortedMedia.length)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://png.pngtree.com/png-clipart/20191120/original/pngtree-error-file-icon-vectors-png-image_5053766.jpg";
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default PostMediaGrid;
