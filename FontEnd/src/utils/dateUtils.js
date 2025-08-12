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

  const suffix = addSuffix ? ' ago' : '';

  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} minutes${suffix}`;
  } else if (diffHour < 24) {
    return `${diffHour} hours${suffix}`;
  } else if (diffDay < 7) {
    return `${diffDay} days${suffix}`;
  } else if (diffMonth < 1) {
    // Nếu chưa đủ 1 tháng, hiển thị theo tuần
    return `${diffWeek} weeks${suffix}`;
  } else if (diffMonth < 12) {
    return `${diffMonth} months${suffix}`;
  } else {
    return `${diffYear} years${suffix}`;
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
    // Nếu là ngày khác → hiển thị dạng "July 17 at 11:38"
    const day = date.getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const month = monthNames[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month} ${day} at ${hours}:${minutes}`;
  }
};

/**
 * Định dạng thời hạn từ dueDate đến hiện tại
 * @param {Date|string} dueDate - Ngày hết hạn
 * @returns {string} Chuỗi thời hạn (ví dụ: "3 tháng", "2 năm", "5 ngày", "2 giờ" hoặc "Hết hạn")
 */
export const formatDuration = (dueDate) => {
  if (!dueDate) return "undefined";

  let due;
  try {
    // Hỗ trợ nhiều định dạng ngày tháng
    if (typeof dueDate === 'string' && dueDate.includes('/')) {
      // Nếu là định dạng DD/MM/YYYY
      const parts = dueDate.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Tháng trong JS bắt đầu từ 0
        const year = parseInt(parts[2], 10);
        due = new Date(year, month, day);
      } else {
        due = new Date(dueDate);
      }
    } else {
      due = new Date(dueDate);
    }
  } catch (error) {
    console.error("Date conversion error:", error);
    return "undefined";
  }

  const now = new Date();

  // console.log("Debug formatDuration:");
  // console.log("- Due date:", due, "Timestamp:", due.getTime());
  // console.log("- Now:", now, "Timestamp:", now.getTime());
  // console.log("- Difference (milliseconds):", due.getTime() - now.getTime());
  // console.log("- Is due before now:", due.getTime() < now.getTime());

  // Nếu dueDate không hợp lệ
  if (isNaN(due.getTime())) {
    console.error("Invalid date:", dueDate);
    return "undefined";
  }

  // So sánh thời gian - kiểm tra xem deadline đã qua chưa
  if (due.getTime() <= now.getTime()) {
    return "Expired";
  }

  // Tính khoảng cách thời gian (milliseconds)
  const diffMs = due.getTime() - now.getTime();

  // Tính các đơn vị thời gian
  const msInSecond = 1000;
  const msInMinute = msInSecond * 60;
  const msInHour = msInMinute * 60;
  const msInDay = msInHour * 24;
  const msInMonth = msInDay * 30; // Xấp xỉ
  const msInYear = msInDay * 365; // Xấp xỉ

  // Tính số năm
  const yearDiff = due.getFullYear() - now.getFullYear();

  // Tính số tháng
  let monthDiff = (due.getMonth() + 12 * yearDiff) - now.getMonth();

  // Điều chỉnh tháng nếu ngày trong tháng không đủ
  if (due.getDate() < now.getDate()) {
    monthDiff -= 1;
  }

  // Debug thêm thông tin tính toán
  // console.log("- Year diff:", yearDiff);
  // console.log("- Month diff:", monthDiff);
  // console.log("- Day diff:", due.getDate() - now.getDate());

  // Tính số ngày còn lại
  const dayDiff = Math.floor(diffMs / msInDay);
  // Tính số giờ còn lại (khi ít hơn 1 ngày)
  const hourDiff = Math.floor((diffMs % msInDay) / msInHour);
  // Tính số phút còn lại (khi ít hơn 1 giờ)
  const minuteDiff = Math.floor((diffMs % msInHour) / msInMinute);
  // Tính số giây còn lại (khi ít hơn 1 phút)
  const secondDiff = Math.floor((diffMs % msInMinute) / msInSecond);

  if (monthDiff >= 12) {
    const years = Math.floor(monthDiff / 12);
    return `${years} years`;
  } else if (monthDiff > 0) {
    return `${monthDiff} months`;
  } else if (dayDiff > 0) {
    return `${dayDiff} days`;
  } else if (hourDiff > 0) {
    return `${hourDiff} hours`;
  } else if (minuteDiff > 0) {
    return `${minuteDiff} minutes`;
  } else if (secondDiff > 0) {
    return `${secondDiff} seconds`;
  } else {
    return "Expired";
  }
};