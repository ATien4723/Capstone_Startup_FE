import axios from "axios";
import Cookies from "js-cookie";

export const URL_API = "http://localhost:5070/";

const axiosClient = axios.create({
    baseURL: URL_API,
    withCredentials: true
});

// Request interceptor
axiosClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get("accessToken");
        if (token && !config.url?.includes('RefreshToken')) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return error?.response || Promise.reject(error);
    }
);

// Response interceptor
axiosClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // Kiểm tra nếu lỗi 401 và chưa thử refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            //Kiểm tra refreshToken trước khi thực hiện refresh
            const hasRefreshToken = Cookies.get("refreshToken");
            if (!hasRefreshToken) {
                Cookies.remove("accessToken");
                return Promise.reject(error.response?.data || error);
            }

            try {
                const response = await axiosClient.post("api/Auth/RefreshToken");
                const newAccessToken = response.accessToken;

                Cookies.set("accessToken", newAccessToken);

                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);
            } catch (refreshError) {
                Cookies.remove("accessToken");
                Cookies.remove("refreshToken");
                window.location.href = '/login';
                return Promise.reject(refreshError?.response?.data || refreshError);
            }
        }

        return Promise.reject(error);
        // return Promise.reject(error?.response?.data || error);
    }
);

export default axiosClient; 