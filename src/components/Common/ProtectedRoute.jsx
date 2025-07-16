import { Navigate, useLocation } from 'react-router-dom';
import authService from '@/apis/authService';

/**
 * Component bảo vệ route, chỉ cho phép truy cập khi đã đăng nhập
 * Nếu chưa đăng nhập, sẽ chuyển hướng đến trang đăng nhập
 */
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
        // Chuyển hướng đến trang đăng nhập và lưu URL hiện tại để có thể quay lại sau khi đăng nhập
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
};

export default ProtectedRoute; 