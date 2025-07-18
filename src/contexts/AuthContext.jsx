import React, { createContext, useState, useEffect, useContext } from 'react';
import { checkMembership } from '@/apis/startupService';
import { getUserId, getUserInfoFromToken, isAuthenticated } from '@/apis/authService';
import * as authService from '@/apis/authService';

// Tạo context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isMember, setIsMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [membershipChecked, setMembershipChecked] = useState(false);

    // Khởi tạo người dùng từ token - chỉ chạy một lần khi component mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (isAuthenticated()) {
                    const userInfo = getUserInfoFromToken();
                    const userId = getUserId();
                    console.log('userId trong useEffect:', userId);
                    if (userId) {
                        setUser({
                            id: userId,
                            ...userInfo
                        });
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Lỗi khi khởi tạo xác thực:', error);
                setUser(null);
            } finally {
                setAuthChecked(true);
            }
        };

        initAuth();
    }, []); // Empty dependency array ensures this runs only once

    // Kiểm tra membership khi người dùng đã xác thực
    useEffect(() => {
        // Tránh kiểm tra membership khi chưa kiểm tra auth hoặc user là null
        if (!authChecked || user === null) {
            if (authChecked) {
                // Nếu đã kiểm tra auth nhưng user là null
                setIsMember(false);
                setMembershipChecked(true);
                setLoading(false);
            }
            return;
        }

        // Hàm kiểm tra membership - cẩn thận với vòng lặp vô hạn
        const checkUserMembership = async () => {
            try {
                setLoading(true);
                const userId = user.id;
                if (!userId) {
                    setIsMember(false);
                    return;
                }

                const result = await checkMembership(userId);
                console.log('API trả về:', result);
                setIsMember(result.isMember === true);
            } catch (err) {
                console.error('Lỗi khi kiểm tra membership:', err);
                setIsMember(false);
            } finally {
                setLoading(false);
                setMembershipChecked(true);
            }
        };

        // Chỉ kiểm tra membership khi có user.id
        if (user && user.id) {
            checkUserMembership();
        }
    }, [authChecked, user]); // Chỉ chạy lại khi authChecked hoặc user thay đổi

    // Hàm refresh membership
    const refreshMembership = async () => {
        if (!user || !user.id) return;

        try {
            setLoading(true);
            const result = await checkMembership(user.id);
            setIsMember(result.isMember === true);
        } catch (err) {
            console.error('Lỗi khi làm mới membership:', err);
        } finally {
            setLoading(false);
        }
    };

    // Thêm hàm login vào context
    const login = async (values) => {
        try {
            const response = await authService.login(values);
            if (response && response.accessToken) {
                // Lấy thông tin người dùng từ token mới
                const userInfo = getUserInfoFromToken();
                const userId = getUserId();

                // Cập nhật user state trong context
                if (userId) {
                    setUser({
                        id: userId,
                        ...userInfo
                    });
                }
                return response;
            }
            return null;
        } catch (error) {
            console.error('Lỗi đăng nhập trong context:', error);
            throw error;
        }
    };

    // Kiểm tra nếu đã sẵn sàng (cả auth và membership đã được kiểm tra)
    const isReady = authChecked && membershipChecked;

    // Tạo giá trị ổn định cho value để tránh render lại không cần thiết
    const value = {
        user,
        isAuthenticated: !!user,
        isMember,
        loading,
        isReady,
        refreshMembership,
        login  // Thêm login vào context
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook để sử dụng context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được sử dụng trong AuthProvider');
    }
    return context;
}; 