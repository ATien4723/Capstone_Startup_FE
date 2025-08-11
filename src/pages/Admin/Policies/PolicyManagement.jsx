
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSearch, faEye, faToggleOn, faToggleOff, faFileAlt, faTags } from '@fortawesome/free-solid-svg-icons';
import {
    getAllPolicies,
    getAllPolicyTypes,
    createPolicy,
    updatePolicy,
    deletePolicy,
    updatePolicyStatus,
    createPolicyType,
    updatePolicyType,
    deletePolicyType
} from '@/apis/policyService';

const PolicyManagement = () => {
    const [policies, setPolicies] = useState([]);
    const [policyTypes, setPolicyTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [editingPolicyType, setEditingPolicyType] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [formData, setFormData] = useState({
        description: '',
        policyTypeId: '',
        isActive: true
    });
    const [typeFormData, setTypeFormData] = useState({
        typeName: ''
    });
    const [activeTab, setActiveTab] = useState('policies');
    const [confirmState, setConfirmState] = useState({
        open: false,
        entity: null, // 'policy' or 'policyType'
        id: null,
        message: ''
    });


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [policiesResponse, typesResponse] = await Promise.all([
                getAllPolicies(),
                getAllPolicyTypes()
            ]);
            // console.log('Policies:', policiesResponse);
            // console.log('Policy Types:', typesResponse);
            setPolicies(policiesResponse || []);
            setPolicyTypes(typesResponse || []);
        } catch (error) {
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                description: formData.description,
                policyTypeId: parseInt(formData.policyTypeId),
                isActive: formData.isActive
            };

            if (editingPolicy) {
                await updatePolicy(editingPolicy.policyId, submitData);
                toast.success('Policy updated successfully');
            } else {
                await createPolicy(submitData);
                toast.success('Policy created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleTypeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPolicyType) {
                await updatePolicyType(editingPolicyType.policyTypeId, typeFormData);
                toast.success('Policy type updated successfully');
            } else {
                await createPolicyType(typeFormData);
                toast.success('Policy type created successfully');
            }
            setShowTypeModal(false);
            resetTypeForm();
            fetchData();
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleEdit = (policy) => {
        setEditingPolicy(policy);
        setFormData({
            description: policy.description,
            policyTypeId: policy.policyTypeId,
            isActive: policy.isActive
        });
        setShowModal(true);
    };

    const handleEditType = (policyType) => {
        setEditingPolicyType(policyType);
        setTypeFormData({
            typeName: policyType.typeName
        });
        setShowTypeModal(true);
    };

    const handleDelete = (id) => {
        setConfirmState({
            open: true,
            entity: 'policy',
            id,
            message: 'Are you sure you want to delete this policy?'
        });
    };

    const handleDeleteType = (policyTypeId) => {
        setConfirmState({
            open: true,
            entity: 'policyType',
            id: policyTypeId,
            message: 'Are you sure you want to delete this policy type?'
        });
    };

    const handleToggleStatus = async (policy) => {
        try {
            await updatePolicyStatus(policy.policyId, !policy.isActive);
            // toast.success(`${!policy.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} chính sách thành công`);
            fetchData();
        } catch (error) {
            toast.error('Error updating status');
        }
    };

    const resetForm = () => {
        setFormData({
            description: '',
            policyTypeId: '',
            isActive: true
        });
        setEditingPolicy(null);
    };

    const resetTypeForm = () => {
        setTypeFormData({
            typeName: ''
        });
        setEditingPolicyType(null);
    };

    const filteredPolicies = policies.filter(policy => {
        const matchesSearch = !searchTerm || policy.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !selectedType || policy.policyTypeId?.toString() === selectedType;
        // console.log('Policy:', policy.policyId, 'Search match:', matchesSearch, 'Type match:', matchesType);
        return matchesSearch && matchesType;
    });

    // console.log('All policies:', policies);
    // console.log('Search term:', searchTerm);
    // console.log('Selected type:', selectedType);
    // console.log('Filtered policies:', filteredPolicies);

    const getPolicyTypeName = (policyTypeId) => {
        const type = policyTypes.find(t => t.policyTypeId === policyTypeId);
        return type?.typeName || 'Unknown';
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Policy Management</h1>
                <button
                    onClick={() => activeTab === 'policies' ? setShowModal(true) : setShowTypeModal(true)}
                    className={`${activeTab === 'policies'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-200'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200'
                        } text-white px-6 py-3 rounded-xl flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
                >
                    <FontAwesomeIcon icon={faPlus} className="text-lg" />
                    {activeTab === 'policies' ? 'Add Policy' : 'Add Policy Type'}
                </button>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('policies')}
                            className={`py-3 px-6 border-b-3 font-semibold text-sm rounded-t-lg transition-all duration-200 ${activeTab === 'policies'
                                ? 'border-purple-500 text-purple-600 bg-purple-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                            Policies
                        </button>
                        <button
                            onClick={() => setActiveTab('types')}
                            className={`py-3 px-6 border-b-3 font-semibold text-sm rounded-t-lg transition-all duration-200 ${activeTab === 'types'
                                ? 'border-blue-500 text-blue-600 bg-blue-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <FontAwesomeIcon icon={faTags} className="mr-2" />
                            Policy Types
                        </button>
                    </nav>
                </div>
            </div>

            {activeTab === 'policies' ? (
                <>
                    {/* Search và Filter cho Policies */}
                    <div className="mb-4 flex gap-4">
                        <div className="flex-1 relative">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search policies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
                            />
                        </div>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">All policy types</option>
                            {policyTypes.map(type => (
                                <option key={type.policyTypeId} value={type.policyTypeId}>{type.typeName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Bảng Policies */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center">Loading...</td>
                                    </tr>
                                ) : filteredPolicies.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No data</td>
                                    </tr>
                                ) : (
                                    filteredPolicies.map((policy) => (
                                        <tr key={policy.policyId}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{policy.policyId}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                <div className="max-w-xs truncate">{policy.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {getPolicyTypeName(policy.policyTypeId)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(policy.createAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${policy.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {policy.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(policy)}
                                                        className={`p-2 rounded-lg transition-all duration-200 ${policy.isActive
                                                            ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                            }`}
                                                        title={policy.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <FontAwesomeIcon icon={policy.isActive ? faToggleOff : faToggleOn} className="text-lg" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(policy)}
                                                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                        title="Edit"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(policy.policyId)}
                                                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                        title="Delete"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <>
                    {/* Bảng Policy Types */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center">Loading...</td>
                                    </tr>
                                ) : policyTypes.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No data</td>
                                    </tr>
                                ) : (
                                    policyTypes.map((type) => (
                                        <tr key={type.policyTypeId}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type.policyTypeId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.typeName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditType(type)}
                                                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteType(type.policyTypeId)}
                                                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                        title="Xóa"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingPolicy ? 'Edit Policy' : 'Add New Policy'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="6"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Policy Type *
                                </label>
                                <select
                                    required
                                    value={formData.policyTypeId}
                                    onChange={(e) => setFormData({ ...formData, policyTypeId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Select policy type</option>
                                    {policyTypes.map(type => (
                                        <option key={type.policyTypeId} value={type.policyTypeId}>{type.typeName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Activate</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    {editingPolicy ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Policy Type Modal */}
            {showTypeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingPolicyType ? 'Edit Policy Type' : 'Add New Policy Type'}
                        </h2>
                        <form onSubmit={handleTypeSubmit}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Policy Type Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={typeFormData.typeName}
                                    onChange={(e) => setTypeFormData({ ...typeFormData, typeName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTypeModal(false);
                                        resetTypeForm();
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingPolicyType ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmState.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">{confirmState.message}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                onClick={() => setConfirmState({ open: false, entity: null, id: null, message: '' })}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                onClick={async () => {
                                    try {
                                        if (confirmState.entity === 'policy') {
                                            await deletePolicy(confirmState.id);
                                            toast.success('Policy deleted successfully');
                                        } else if (confirmState.entity === 'policyType') {
                                            await deletePolicyType(confirmState.id);
                                            toast.success('Policy type deleted successfully');
                                        }
                                        setConfirmState({ open: false, entity: null, id: null, message: '' });
                                        fetchData();
                                    } catch (error) {
                                        toast.error('Error deleting');
                                        setConfirmState({ open: false, entity: null, id: null, message: '' });
                                    }
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );


};

export default PolicyManagement;





















