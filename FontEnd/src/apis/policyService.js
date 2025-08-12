import axiosClient from '@/config/axiosClient';

// ===== POLICY TYPES =====

export const getAllPolicyTypes = async () => {
    try {
        const response = await axiosClient.get('/api/policy-types');
        return response;
    } catch (error) {
        throw error;
    }
};

export const getPolicyTypeById = async (id) => {
    try {
        const response = await axiosClient.get(`/api/policy-types/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const createPolicyType = async (policyTypeData) => {
    try {
        const response = await axiosClient.post('/api/policy-types', policyTypeData);
        return response;
    } catch (error) {
        throw error;
    }
};

export const updatePolicyType = async (id, policyTypeData) => {
    try {
        const response = await axiosClient.put(`/api/policy-types/${id}`, policyTypeData);
        return response;
    } catch (error) {
        throw error;
    }
};

export const deletePolicyType = async (id) => {
    try {
        const response = await axiosClient.delete(`/api/policy-types/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// ===== POLICIES =====

export const getAllPolicies = async () => {
    try {
        const response = await axiosClient.get('/api/policies');
        return response;
    } catch (error) {
        throw error;
    }
};

export const getPolicyById = async (id) => {
    try {
        const response = await axiosClient.get(`/api/policies/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const createPolicy = async (policyData) => {
    try {
        const response = await axiosClient.post('/api/policies', policyData);
        return response;
    } catch (error) {
        throw error;
    }
};

export const updatePolicy = async (id, policyData) => {
    try {
        const response = await axiosClient.put(`/api/policies/${id}`, policyData);
        return response;
    } catch (error) {
        throw error;
    }
};

export const deletePolicy = async (id) => {
    try {
        const response = await axiosClient.delete(`/api/policies/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const getPoliciesByPolicyType = async (policyTypeId) => {
    try {
        const response = await axiosClient.get(`/api/policy-types/${policyTypeId}/policies`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const updatePolicyStatus = async (id, isActive) => {
    try {
        const response = await axiosClient.put(`/api/update-policy-status/${id}`, null, {
            params: { isActive }
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export default {
    // Policy Types
    getAllPolicyTypes,
    getPolicyTypeById,
    createPolicyType,
    updatePolicyType,
    deletePolicyType,

    // Policies
    getAllPolicies,
    getPolicyById,
    createPolicy,
    updatePolicy,
    deletePolicy,
    getPoliciesByPolicyType,
    updatePolicyStatus
}; 
