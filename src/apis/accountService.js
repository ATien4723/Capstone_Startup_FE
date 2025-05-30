import axiosClient from './axiosClient';

export const getAccountInfo = async (accountId) => {
    try {
        const response = await axiosClient.get(`api/Account/get-account-info/${accountId}`);
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
        const response = await axiosClient.post('api/Account/verify-cccd-full', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
};
