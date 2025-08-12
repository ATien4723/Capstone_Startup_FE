import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAuthenticated } from '@/apis/authService';

/**
 * Component bảo vệ route, kiểm tra quyền truy cập
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Component con được bảo vệ
 * @param {boolean} props.requireStartup - Có yêu cầu người dùng là thành viên startup hay không
 * @param {boolean} props.preventIfMember - Ngăn chặn thành viên startup truy cập (dùng cho trang CreateStartup)
 */
const ProtectedRoute = ({ children, requireStartup = false, preventIfMember = false }) => {
    const location = useLocation();
    const { isMember, loading, isReady, isAdmin } = useAuth();
    const isUserAuthenticated = isAuthenticated(); // Sử dụng trực tiếp từ authService

    // Hiển thị loading khi đang kiểm tra xác thực
    if (!isReady || (loading && (requireStartup || preventIfMember))) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <div className="text-lg text-gray-700">Đang kiểm tra quyền truy cập...</div>
                </div>
            </div>
        );
    }

    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    if (!isUserAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Nếu route yêu cầu quyền startup và người dùng không phải là thành viên startup
    // Nhưng admin có thể truy cập mọi nơi
    if (requireStartup && !isMember && !isAdmin) {
        return <Navigate to="/create-startup" state={{ from: location.pathname }} replace />;
    }

    // Nếu route cấm người dùng là thành viên startup (trang CreateStartup)
    // Admin cũng không được tạo startup
    if (preventIfMember && (isMember || isAdmin)) {
        return <Navigate to={isAdmin ? "/admin" : "/me/dashboard"} replace />;
    }

    return children;
};

export default ProtectedRoute;