import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faEdit,
    faTrash,
    faEye,
    faPlus,
    faToggleOn,
    faToggleOff
} from '@fortawesome/free-solid-svg-icons';

const PolicyList = () => {
    const [policies, setPolicies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [policyTypes, setPolicyTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentPolicy, setCurrentPolicy] = useState(null);

    // Giả lập lấy dữ liệu từ API
    useEffect(() => {
        const fetchData = () => {
            setLoading(true);
            // Giả lập dữ liệu loại chính sách
            const mockPolicyTypes = [
                { id: 1, name: 'Điều khoản sử dụng' },
                { id: 2, name: 'Chính sách bảo mật' },
                { id: 3, name: 'Quy định về nội dung' },
                { id: 4, name: 'Chính sách startup' }
            ];

            // Giả lập dữ liệu chính sách
            const mockPolicies = Array.from({ length: 20 }, (_, i) => ({
                id: i + 1,
                title: `Chính sách ${i + 1}`,
                type: mockPolicyTypes[i % mockPolicyTypes.length],
                version: `1.${i % 5}`,
                isActive: i % 3 !== 0,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString('vi-VN'),
                updatedAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toLocaleDateString('vi-VN'),
                content: `Nội dung chính sách ${i + 1}. Đây là một đoạn văn bản mẫu cho chính sách này. Trong thực tế, nội dung này sẽ dài và chi tiết hơn nhiều.`
            }));

            // Lọc chính sách theo tìm kiếm và loại
            const filteredPolicies = mockPolicies.filter(policy => {
                const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = selectedType === 'all' || policy.type.id === parseInt(selectedType);
                return matchesSearch && matchesType;
            });

            setPolicyTypes(mockPolicyTypes);
            setPolicies(filteredPolicies);
            setLoading(false);
        };

        fetchData();
    }, [searchTerm, selectedType]);

    const handleToggleStatus = (policyId) => {
        setPolicies(policies.map(policy =>
            policy.id === policyId ? { ...policy, isActive: !policy.isActive } : policy
        ));
    };

    const handleViewPolicy = (policy) => {
        setCurrentPolicy(policy);
        setShowModal(true);
    };

    const handleDeletePolicy = (policyId) => {
        // Giả lập xóa chính sách
        setPolicies(policies.filter(policy => policy.id !== policyId));
    };

    return (
        <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản Lý Chính Sách</h1>

            {/* Thanh công cụ và tìm kiếm */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
                    <div className="w-full md:w-1/3 relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm chính sách..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
                    </div>

                    <div className="flex space-x-4">
                        <select
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">Tất cả loại chính sách</option>
                            {policyTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>

                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition-colors">
                            <FontAwesomeIcon icon={faPlus} className="mr-2" />
                            Thêm chính sách mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Danh sách chính sách */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phiên bản</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cập nhật</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : policies.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Không tìm thấy chính sách nào
                                    </td>
                                </tr>
                            ) : (
                                policies.map(policy => (
                                    <tr key={policy.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {policy.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {policy.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                {policy.type.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {policy.version}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${policy.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {policy.isActive ? 'Đang kích hoạt' : 'Đã vô hiệu hóa'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {policy.createdAt}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {policy.updatedAt}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex justify-center space-x-3">
                                                <button
                                                    onClick={() => handleViewPolicy(policy)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button className="text-indigo-600 hover:text-indigo-900">
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(policy.id)}
                                                    className={policy.isActive ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"}
                                                >
                                                    <FontAwesomeIcon icon={policy.isActive ? faToggleOff : faToggleOn} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePolicy(policy.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal xem chính sách */}
            {showModal && currentPolicy && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4">
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800">{currentPolicy.title}</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                        <div className="px-6 py-4 max-h-96 overflow-y-auto">
                            <div className="mb-4">
                                <span className="text-sm font-semibold text-gray-500">Loại: </span>
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                    {currentPolicy.type.name}
                                </span>
                            </div>
                            <div className="mb-4">
                                <span className="text-sm font-semibold text-gray-500">Phiên bản: </span>
                                {currentPolicy.version}
                            </div>
                            <div className="mb-4">
                                <span className="text-sm font-semibold text-gray-500">Trạng thái: </span>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${currentPolicy.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {currentPolicy.isActive ? 'Đang kích hoạt' : 'Đã vô hiệu hóa'}
                                </span>
                            </div>
                            <div className="mb-4">
                                <h4 className="text-lg font-semibold mb-2">Nội dung chính sách:</h4>
                                <p className="text-gray-700 whitespace-pre-line">{currentPolicy.content}</p>
                            </div>
                        </div>
                        <div className="px-6 py-3 border-t flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PolicyList; 