import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAuthenticated } from '@/apis/authService';
import { checkCanPost, checkCanManageMember, canManageStartupChat } from '@/apis/permissionService';

/**
 * Component kiểm tra quyền truy cập dựa trên quyền cụ thể
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Component con được bảo vệ
 * @param {boolean} props.requirePostPermission - Yêu cầu quyền đăng bài
 * @param {boolean} props.requireMemberManagement - Yêu cầu quyền quản lý thành viên
 * @param {boolean} props.requireStartupChatPermission - Yêu cầu quyền quản lý Startup Chat
 * @param {boolean} props.requireAdmin - Yêu cầu quyền admin
 */
const PermissionRoute = ({
    children,
    requirePostPermission = false,
    requireMemberManagement = false,
    requireStartupChatPermission = false,
    requireAdmin = false
}) => {
    const location = useLocation();
    const { user, isReady, isAdmin } = useAuth();
    const [hasPermission, setHasPermission] = useState(true);
    const [loading, setLoading] = useState(true);
    const isUserAuthenticated = isAuthenticated();

    useEffect(() => {
        const checkPermissions = async () => {
            if (!isUserAuthenticated || !user) {
                setHasPermission(false);
                setLoading(false);
                return;
            }

            try {
                let permissionGranted = true;

                // Kiểm tra quyền đăng bài
                if (requirePostPermission) {
                    const postPermission = await checkCanPost(user.id);
                    console.log('Phản hồi API đăng bài:', postPermission);
                    if (postPermission === false) {
                        permissionGranted = false;
                    }
                }

                // Kiểm tra quyền quản lý Startup Chat
                if (requireStartupChatPermission) {
                    const startupChatPermission = await canManageStartupChat(user.id);
                    console.log('Phản hồi API quản lý Startup Chat:', startupChatPermission);
                    if (startupChatPermission === false) {
                        permissionGranted = false;
                    }
                }

                // // Kiểm tra quyền quản lý thành viên
                // if (requireMemberManagement) {
                //     const memberPermission = await checkCanManageMember(user.id);
                //     console.log('Phản hồi API quản lý thành viên:', memberPermission);
                //     if (memberPermission === false) {
                //         permissionGranted = false;
                //     }
                // }

                // Kiểm tra quyền admin
                if (requireAdmin) {
                    console.log('Kiểm tra quyền admin:', isAdmin, 'User role:', user?.role);
                    if (!isAdmin) {
                        permissionGranted = false;
                    }
                }

                setHasPermission(permissionGranted);
            } catch (error) {
                console.error('Lỗi khi kiểm tra quyền:', error);
                setHasPermission(false);
            } finally {
                setLoading(false);
            }
        };

        if (isReady && (requirePostPermission || requireMemberManagement || requireStartupChatPermission || requireAdmin)) {
            checkPermissions();
        } else if (!requirePostPermission && !requireMemberManagement && !requireStartupChatPermission && !requireAdmin) {
            setLoading(false);
        }
    }, [isReady, user, requirePostPermission, requireMemberManagement, requireAdmin, isUserAuthenticated, requireStartupChatPermission]);

    // Hiển thị loading khi đang kiểm tra quyền
    if (loading) {
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

    // Nếu không có quyền, chuyển hướng đến trang từ chối truy cập
    if (!hasPermission) {
        // Kiểm tra nếu là admin route thì chuyển đến trang admin access denied
        const isAdminRoute = location.pathname.startsWith('/admin');
        const redirectPath = isAdminRoute ? '/admin-access-denied' : '/access-denied';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default PermissionRoute; 