import axiosClient from "./axiosClient";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

// Hàm giải mã JWT token để lấy thông tin người dùng
export const getUserInfoFromToken = () => {
    try {
        const token = Cookies.get("accessToken");
        if (!token) return null;

        const decodedToken = jwtDecode(token);
        return {
            userId: decodedToken.nameid || decodedToken.sub || null,
            email: decodedToken.email || null,
            role: decodedToken.role || null,
            exp: decodedToken.exp || null,
            // Thêm các trường khác nếu cần
        };
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};

// Hàm lấy ID người dùng từ token
export const getUserId = () => {
    const userInfo = getUserInfoFromToken();
    return userInfo ? userInfo.userId : null;
};

export const login = async (formData) => {
    const urlApi = `api/Auth/Login`;
    try {
        const response = await axiosClient.post(urlApi, formData);
        if (response.accessToken) {
            Cookies.set("accessToken", response.accessToken, { secure: true });
            // Không lưu userId vào localStorage
        }
        return response;
    } catch (error) {
        throw error;
    }
};

export const loginWithGoogle = async (googleToken) => {
    const urlApi = `api/Auth/Login-google`;
    try {
        const response = await axiosClient.post(urlApi, { googleToken });
        if (response.accessToken) {
            Cookies.set("accessToken", response.accessToken, { secure: true });
            // Không lưu userId vào localStorage
        }
        return response;
    } catch (error) {
        throw error;
    }
};

export const register = async (userData) => {
    const urlApi = `api/Auth/Register`;
    try {
        const response = await axiosClient.post(urlApi, userData);
        return response;
    } catch (error) {
        throw error;
    }
};

export const verifyOtp = async (email, otp) => {
    const urlApi = `api/Auth/VerifyOtp`;
    try {
        const response = await axiosClient.post(urlApi, { email, otp });
        return response;
    } catch (error) {
        throw error;
    }
};

// export const refreshToken = async () => {
//     const urlApi = `api/Auth/RefreshToken`;
//     try {
//         const response = await axiosClient.post(urlApi);
//         return response;
//     } catch (error) {
//         throw error;
//     }
// };


// Forget Password APIs
export const sendOTP = async (email) => {
    const urlApi = `api/Auth/SendOTP`;
    try {
        const response = await axiosClient.post(urlApi, { email });
        return response;
    } catch (error) {
        throw error;
    }
};

export const verifyOtpForgetPassword = async (email, otp) => {
    const urlApi = `api/Auth/VerifyOtp-Forgetpassword`;
    try {
        const response = await axiosClient.post(urlApi, { email, otp });
        return response;
    } catch (error) {
        throw error;
    }
};

export const resetPassword = async (email, newPassword, confirmPassword) => {
    const urlApi = `api/Auth/forget-password`;
    try {
        const response = await axiosClient.put(urlApi, {
            email,
            newPassword,
            confirmPassword
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const logout = async () => {
    try {
        Cookies.remove("accessToken");
        // Dọn dẹp localStorage
        cleanupStorage();
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login';
    }
};

// Thêm hàm này để dọn dẹp localStorage
export const cleanupStorage = () => {
    // Xóa tất cả các key liên quan đến xác thực
    const keysToRemove = ['token'];
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
        }
    });
};


// Hàm kiểm tra người dùng đã đăng nhập chưa
export const isAuthenticated = () => {
    try {
        const token = Cookies.get("accessToken");
        if (!token) return false;

        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        // Kiểm tra token có hợp lệ và chưa hết hạn
        return decodedToken && decodedToken.exp > currentTime;
    } catch (error) {
        return false;
    }
};



export default {
    login,
    loginWithGoogle,
    register,
    verifyOtp,
    sendOTP,
    verifyOtpForgetPassword,
    resetPassword,
    logout,
    getUserInfoFromToken,
    getUserId,
    cleanupStorage,
    isAuthenticated
};



