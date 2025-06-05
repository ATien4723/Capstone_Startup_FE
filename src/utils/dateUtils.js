/**
 * Chuyển đổi thời gian thành chuỗi thời gian tương đối (ví dụ: "5 phút", "2 giờ", "3 ngày")
 * @param {Date|string} dateTime - Thời gian cần chuyển đổi (đối tượng Date hoặc chuỗi ISO)
 * @param {boolean} addSuffix - Thêm hậu tố "trước" vào kết quả (mặc định: false)
 * @returns {string} Chuỗi thời gian tương đối
 */
export const getRelativeTime = (dateTime, addSuffix = false) => {
  const commentTime = dateTime instanceof Date ? dateTime : new Date(dateTime);
  const now = new Date();
  const diffMs = now - commentTime;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const suffix = addSuffix ? ' trước' : '';

  if (diffSec < 60) {
    return 'Vừa xong';
  } else if (diffMin < 60) {
    return `${diffMin} phút${suffix}`;
  } else if (diffHour < 24) {
    return `${diffHour} giờ${suffix}`;
  } else if (diffDay < 7) {
    return `${diffDay} ngày${suffix}`;
  } else if (diffWeek < 4) {
    return `${diffWeek} tuần${suffix}`;
  } else if (diffMonth < 12) {
    return `${diffMonth} tháng${suffix}`;
  } else {
    return `${diffYear} năm${suffix}`;
  }
};

/**
 * Định dạng thời gian theo múi giờ Việt Nam
 * @param {Date|string} dateTime - Thời gian cần định dạng
 * @param {Object} options - Tùy chọn định dạng (tham khảo Intl.DateTimeFormat)
 * @returns {string} Chuỗi thời gian đã định dạng
 */
export const formatVietnameseTime = (dateTime, options = {}) => {
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    ...options
  }).format(date);
};

/**
 * Định dạng ngày tháng theo múi giờ Việt Nam
 * @param {Date|string} dateTime - Thời gian cần định dạng
 * @returns {string} Chuỗi ngày tháng đã định dạng (DD/MM/YYYY)
 */
export const formatVietnameseDate = (dateTime) => {
  return formatVietnameseTime(dateTime, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Định dạng thời gian theo kiểu "Hôm qua lúc 14:14"
 * @param {Date|string} dateTime - Thời gian cần định dạng
 * @returns {string} Chuỗi thời gian đã định dạng
 */
export const formatPostTime = (dateTime) => {
  if (!dateTime) return "Unknown date";

  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  const now = new Date();

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    // Nếu là hôm nay → hiển thị thời gian tương đối
    return getRelativeTime(date, true); // ví dụ: "2 giờ trước"
  } else {
    // Nếu là ngày khác → hiển thị dạng "26 tháng 6 lúc 14:32"
    const day = date.getDate();
    const month = date.getMonth() + 1; // tháng bắt đầu từ 0
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} tháng ${month} lúc ${hours}:${minutes}`;
  }
};