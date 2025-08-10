import axiosClient from '@/config/axiosClient';

// Simple in-memory cache for account info
const accountInfoCache = {};

export const getAccountInfo = async (accountId, forceRefresh = false) => {
    if (!forceRefresh && accountInfoCache[accountId]) {
        return accountInfoCache[accountId];
    }
    try {
        const response = await axiosClient.get(`api/Account/get-account-info/${accountId}`);
        accountInfoCache[accountId] = response;
        return response;
    } catch (error) {
        throw error;
    }
};

export const getFollowing = async (accountId) => {
    try {
        const response = await axiosClient.get(`api/Account/get-following/${accountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const getFollowers = async (accountId) => {
    try {
        const response = await axiosClient.get(`api/Account/get-follower/${accountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const updateProfile = async (accountId, profileData) => {
    try {
        const response = await axiosClient.put(`api/Account/update-profile/${accountId}`, profileData);
        return response;
    } catch (error) {
        throw error;
    }
};

export const updateBio = async (accountId, bioData) => {
    try {
        const response = await axiosClient.put(`api/Account/update-bio/${accountId}`, bioData);
        return response;
    } catch (error) {
        throw error;
    }
};

export const changePassword = async (accountId, changePasswordDTO) => {
    try {
        const response = await axiosClient.put(`api/Account/change-password/${accountId}`, changePasswordDTO);
        return response;
    } catch (error) {
        throw error;
    }
};

// Thêm API xác thực CCCD
export const verifyCCCD = async (formData) => {
    try {
        const response = await axiosClient.post('api/Account/verify-cccd', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
};

// Thêm API follow
export const followUser = async (followerAccountId, followingAccountId) => {
    try {
        const request = {
            followerAccountId: followerAccountId,
            followingAccountId: followingAccountId
        };
        const response = await axiosClient.post('api/Account/follow', request);
        return response;
    } catch (error) {
        throw error;
    }
};

// Thêm API unfollow
export const unfollowUser = async (followerAccountId, followingAccountId) => {
    try {
        const request = {
            followerAccountId: followerAccountId,
            followingAccountId: followingAccountId
        };
        const response = await axiosClient.post('api/Account/unfollow', request);
        return response;
    } catch (error) {
        throw error;
    }
};

// Thêm API kiểm tra trạng thái follow
export const checkIsFollowing = async (followerAccountId, followingAccountId) => {
    try {
        const response = await axiosClient.get(`api/Account/is-following?followerAccountId=${followerAccountId}&followingAccountId=${followingAccountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Thêm API để cập nhật trạng thái xác thực tài khoản
export const setStatusVerified = async (accountId) => {
    try {
        const response = await axiosClient.post(`api/Auth/SetStatusVerified?accountId=${accountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// API gợi ý tài khoản
export const recommendAccounts = async (currentAccountId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get(`api/Account/recommend`, {
            params: {
                currentAccountId,
                pageNumber,
                pageSize
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
};

// API chặn người dùng
export const blockAccount = async (accountId, blockedId) => {
    try {
        const response = await axiosClient.post('api/Account/block', null, {
            params: {
                accountId,
                blockedId
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
};

// API bỏ chặn người dùng
export const unblockAccount = async (accountId, blockedId) => {
    try {
        const response = await axiosClient.post('api/Account/unblock', null, {
            params: {
                accountId,
                blockedId
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
};

// API lấy danh sách tài khoản đã chặn
export const getBlockedAccounts = async (accountId) => {
    try {
        const response = await axiosClient.get(`api/Account/blocked-list/${accountId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// API tìm kiếm tài khoản
export const searchAccounts = async (searchText, currentAccountId, pageNumber = 1, pageSize = 10) => {
    try {
        const response = await axiosClient.get('api/Account/search-account', {
            params: {
                searchText,
                currentAccountId,
                pageNumber,
                pageSize
            }
        });
        return response;
    } catch (error) {
        console.error('Search API error:', error);
        throw error;
    }
};

// API: Lấy tất cả tài khoản
export const getAllAccounts = async () => {
    try {
        const response = await axiosClient.get('api/Account/GetAllAccount');
        return response;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách tài khoản:', error);
        throw error;
    }
};
