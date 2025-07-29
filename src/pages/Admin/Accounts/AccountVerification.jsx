import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faCheckCircle,
    faTimesCircle,
    faIdCard,
    faShieldAlt,
    faEye,
    faDownload
} from '@fortawesome/free-solid-svg-icons';

const AccountVerification = () => {
    const [verificationRequests, setVerificationRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected'

    useEffect(() => {
        // Giả lập lấy dữ liệu từ API
        const fetchVerificationRequests = () => {
            setLoading(true);
            setTimeout(() => {
                const mockRequests = Array.from({ length: 20 }, (_, i) => ({
                    id: i + 1,
                    accountId: 1000 + i,
                    fullName: `Người dùng ${i + 1}`,
                    email: `user${i + 1}@example.com`,
                    idCardNumber: `0${Math.floor(Math.random() * 10000000000)}`,
                    idCardFrontImage: 'https://via.placeholder.com/500x300?text=ID+Card+Front',
                    idCardBackImage: 'https://via.placeholder.com/500x300?text=ID+Card+Back',
                    selfieWithIdCard: 'https://via.placeholder.com/500x300?text=Selfie+With+ID',
                    status: i % 3 === 0 ? 'approved' : i % 3 === 1 ? 'rejected' : 'pending',
                    submittedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString('vi-VN'),
                    reviewedAt: i % 3 !== 2 ? new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toLocaleDateString('vi-VN') : null,
                    reviewedBy: i % 3 !== 2 ? 'Admin1' : null,
                    rejectReason: i % 3 === 1 ? 'Hình ảnh CCCD không rõ ràng' : null
                }));

                // Lọc yêu cầu xác thực theo trạng thái và tìm kiếm
                const filteredRequests = mockRequests.filter(request => {
                    const matchesSearch =
                        request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        request.idCardNumber.includes(searchTerm);

                    const matchesFilter = filter === 'all' || request.status === filter;

                    return matchesSearch && matchesFilter;
                });

                setVerificationRequests(filteredRequests);
                setLoading(false);
            }, 500);
        };

        fetchVerificationRequests();
    }, [searchTerm, filter]);

    const handleViewRequest = (request) => {
        setSelectedRequest(request);
        setShowModal(true);
    };

    const handleApprove = (id) => {
        setVerificationRequests(verificationRequests.map(request =>
            request.id === id
                ? {
                    ...request,
                    status: 'approved',
                    reviewedAt: new Date().toLocaleDateString('vi-VN'),
                    reviewedBy: 'Current Admin',
                    rejectReason: null
                }
                : request
        ));
        if (selectedRequest && selectedRequest.id === id) {
            setSelectedRequest({
                ...selectedRequest,
                status: 'approved',
                reviewedAt: new Date().toLocaleDateString('vi-VN'),
                reviewedBy: 'Current Admin',
                rejectReason: null
            });
        }
    };

    const handleReject = (id, reason = 'Hình ảnh không hợp lệ') => {
        setVerificationRequests(verificationRequests.map(request =>
            request.id === id
                ? {
                    ...request,
                    status: 'rejected',
                    reviewedAt: new Date().toLocaleDateString('vi-VN'),
                    reviewedBy: 'Current Admin',
                    rejectReason: reason
                }
                : request
        ));
        if (selectedRequest && selectedRequest.id === id) {
            setSelectedRequest({
                ...selectedRequest,
                status: 'rejected',
                reviewedAt: new Date().toLocaleDateString('vi-VN'),
                reviewedBy: 'Current Admin',
                rejectReason: reason
            });
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Đã xác thực
                    </span>
                );
            case 'rejected':
                return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Đã từ chối
                    </span>
                );
            case 'pending':
                return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Đang chờ
                    </span>
                );
            default:
                return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Không xác định
                    </span>
                );
        }
    };

    return (
        <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Xác Thực Tài Khoản</h1>

            {/* Bộ lọc và tìm kiếm */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
                    <div className="w-full md:w-1/3 relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email, CCCD..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
                    </div>

                    <div className="flex space-x-4">
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">Tất cả yêu cầu</option>
                            <option value="pending">Đang chờ xác thực</option>
                            <option value="approved">Đã xác thực</option>
                            <option value="rejected">Đã từ chối</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Danh sách yêu cầu xác thực */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số CCCD</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày yêu cầu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : verificationRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Không tìm thấy yêu cầu xác thực nào
                                    </td>
                                </tr>
                            ) : (
                                verificationRequests.map(request => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {request.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {request.fullName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {request.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {request.idCardNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {request.submittedAt}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex justify-center space-x-3">
                                                <button
                                                    onClick={() => handleViewRequest(request)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Xem chi tiết"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                {request.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(request.id)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Xác thực"
                                                        >
                                                            <FontAwesomeIcon icon={faCheckCircle} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Từ chối"
                                                        >
                                                            <FontAwesomeIcon icon={faTimesCircle} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal xem chi tiết */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4">
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800">Chi Tiết Yêu Cầu Xác Thực</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                        <div className="px-6 py-4 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <h4 className="text-lg font-semibold mb-3">Thông tin tài khoản</h4>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-500">Họ tên: </span>
                                            <span>{selectedRequest.fullName}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-gray-500">Email: </span>
                                            <span>{selectedRequest.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-gray-500">Số CCCD: </span>
                                            <span>{selectedRequest.idCardNumber}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-gray-500">Ngày yêu cầu: </span>
                                            <span>{selectedRequest.submittedAt}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-gray-500">Trạng thái: </span>
                                            {getStatusBadge(selectedRequest.status)}
                                        </div>
                                        {selectedRequest.reviewedAt && (
                                            <div>
                                                <span className="text-sm font-semibold text-gray-500">Ngày xét duyệt: </span>
                                                <span>{selectedRequest.reviewedAt}</span>
                                            </div>
                                        )}
                                        {selectedRequest.reviewedBy && (
                                            <div>
                                                <span className="text-sm font-semibold text-gray-500">Người xét duyệt: </span>
                                                <span>{selectedRequest.reviewedBy}</span>
                                            </div>
                                        )}
                                        {selectedRequest.rejectReason && (
                                            <div>
                                                <span className="text-sm font-semibold text-gray-500">Lý do từ chối: </span>
                                                <span>{selectedRequest.rejectReason}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold mb-3">Hình ảnh xác thực</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Mặt trước CCCD</h5>
                                            <img src={selectedRequest.idCardFrontImage} alt="CCCD Mặt trước" className="w-full h-32 object-cover rounded-lg" />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Mặt sau CCCD</h5>
                                            <img src={selectedRequest.idCardBackImage} alt="CCCD Mặt sau" className="w-full h-32 object-cover rounded-lg" />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Ảnh chân dung cùng CCCD</h5>
                                            <img src={selectedRequest.selfieWithIdCard} alt="Ảnh chân dung với CCCD" className="w-full h-32 object-cover rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-3 border-t flex justify-between">
                            <div>
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mr-2"
                                >
                                    <FontAwesomeIcon icon={faDownload} className="mr-1" />
                                    Tải xuống tất cả ảnh
                                </button>
                            </div>

                            <div>
                                {selectedRequest.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleReject(selectedRequest.id)}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mr-2"
                                        >
                                            <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
                                            Từ chối
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedRequest.id)}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                        >
                                            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                            Xác thực
                                        </button>
                                    </>
                                )}
                                {selectedRequest.status !== 'pending' && (
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                    >
                                        Đóng
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountVerification; 