import axiosClient from "./axiosClient";
import Cookies from "js-cookie";

export const login = async (formData) => {
    const urlApi = `api/Auth/Login`;
    try {
        const response = await axiosClient.post(urlApi, formData);
        if (response.accessToken) {
            Cookies.set("accessToken", response.accessToken, { secure: true });
            // Note: refreshToken is now handled by HTTP-only cookie from the backend
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
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login';
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
    logout
};