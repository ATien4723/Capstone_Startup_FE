import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPolicies, getPoliciesByPolicyType, getAllPolicyTypes } from '@/apis/policyService';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faExternalLinkAlt, faSpinner, faHome, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Navbar from '@/components/Navbar/Navbar';
const Policy = () => {
    const [policies, setPolicies] = useState([]);
    const [policyTypes, setPolicyTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPolicies, setFilteredPolicies] = useState([]);

    // Fetch policies và policy types khi component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [policiesData, policyTypesData] = await Promise.all([
                    getAllPolicies(),
                    getAllPolicyTypes()
                ]);
                setPolicies(policiesData || []);
                setFilteredPolicies(policiesData || []);
                setPolicyTypes(policyTypesData || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Unable to load policy data. Please try again later.');
                toast.error('An error occurred while loading policy data');
                // Đặt giá trị mặc định cho mảng để tránh lỗi
                setPolicies([]);
                setFilteredPolicies([]);
                setPolicyTypes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Lọc policies khi người dùng thay đổi loại chính sách hoặc tìm kiếm
    useEffect(() => {
        const filterPolicies = async () => {
            try {
                setLoading(true);
                let filteredData = [];

                // Nếu có loại chính sách được chọn
                if (selectedType) {
                    filteredData = await getPoliciesByPolicyType(selectedType);
                } else {
                    filteredData = [...policies];
                }

                // Lọc theo từ khóa tìm kiếm nếu có
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    filteredData = filteredData.filter(
                        policy =>
                            policy.title?.toLowerCase().includes(term) ||
                            policy.content?.toLowerCase().includes(term) ||
                            policy.description?.toLowerCase().includes(term)
                    );
                }

                setFilteredPolicies(filteredData);
            } catch (error) {
                console.error('Error filtering policies:', error);
                toast.error('An error occurred while filtering data');
            } finally {
                setLoading(false);
            }
        };

        if (policies.length > 0) {
            filterPolicies();
        }
    }, [selectedType, searchTerm, policies]);

    const handleTypeChange = async (typeId) => {
        setSelectedType(typeId === selectedType ? null : typeId);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Render loading state
    if (loading && !filteredPolicies.length) {
        return (
            <div className="flex justify-center items-center h-screen">
                <FontAwesomeIcon icon={faSpinner} spin className="text-blue-600 text-4xl" />
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg mx-auto my-8 max-w-4xl">
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (

        <div className="container mx-auto px-4 py-8 mt-16">
            <Navbar />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Company Policies</h1>
                {/* <Link to="/home" className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300">
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    <span>Back to Home</span>
                </Link> */}
            </div>

            {/* Thanh tìm kiếm và bộ lọc */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search policies..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>

                    {/* <div className="flex items-center">
                        <span className="mr-2 text-gray-600">
                            <FontAwesomeIcon icon={faFilter} />
                        </span>
                        <span className="mr-2 text-gray-600">Filter by:</span>
                        <div className="flex flex-wrap gap-2">
                            {policyTypes && policyTypes.length > 0 ? policyTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeChange(type.id)}
                                    className={`px-3 py-1 rounded-full text-sm ${selectedType === type.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {type.name}
                                </button>
                            )) : null}
                        </div>
                    </div> */}
                </div>
            </div>

            {/* Hiển thị kết quả tìm kiếm */}
            {loading && (
                <div className="text-center py-4">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-blue-600 text-2xl" />
                </div>
            )}

            {!loading && filteredPolicies.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 p-4 rounded-lg text-center">
                    No policies found matching the search criteria
                </div>
            )}

            {/* Danh sách chính sách */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPolicies.map((policy) => (
                    <div
                        key={policy.id}
                        className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${policy.isActive ? 'border-green-500' : 'border-gray-300'
                            } transition-transform hover:scale-[1.01]`}
                    >
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-gray-800">{policy.title}</h3>
                                {policy.isActive ? (
                                    <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
                                        Active
                                    </span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded-full">
                                        Inactive
                                    </span>
                                )}
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                {policy.description}
                            </p>

                            <div className="flex items-center text-xs text-gray-500 mb-4">
                                <span className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 mr-2">
                                    {policyTypes && policyTypes.length > 0 && policy.policyTypeId
                                        ? policyTypes.find(type => type.id === policy.policyTypeId)?.name || 'Policy type undefined'
                                        : 'Policy type undefined'}
                                </span>
                                <span>
                                    Date: {new Date(policy.createAt).toLocaleDateString('vi-VN')}
                                </span>
                            </div>

                            <Link
                                to={`/policy/${policy.policyId}`}
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                            >
                                View Details <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-xs" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Policy; 