import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPolicyById } from '@/apis/policyService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCalendarAlt, faSpinner, faTags, faExclamationCircle, faHome } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const PolicyDetail = () => {
    const { id } = useParams();
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [policyType, setPolicyType] = useState(null);

    // Hàm trích xuất tiêu đề từ description
    const extractTitle = (description) => {
        if (!description) return 'Chính sách không có tiêu đề';

        // Lấy dòng đầu tiên làm tiêu đề
        const firstLine = description.split('.')[0].trim();
        return firstLine || 'Chính sách';
    };

    // Hàm trích xuất nội dung từ description (bỏ phần tiêu đề)
    const extractContent = (description) => {
        if (!description) return '';

        // Lấy phần còn lại sau dòng đầu tiên
        const lines = description.split('.');
        if (lines.length <= 1) return description;

        return lines.slice(1).join('.').trim();
    };

    useEffect(() => {
        const fetchPolicyDetail = async () => {
            try {
                setLoading(true);
                const data = await getPolicyById(id);
                console.log('Policy detail:', data);
                setPolicy(data);

                // Nếu cần, bạn có thể gọi API để lấy thông tin chi tiết về loại chính sách
                // const typeData = await getPolicyTypeById(data.policyTypeId);
                // setPolicyType(typeData);
            } catch (error) {
                console.error('Lỗi khi lấy chi tiết chính sách:', error);
                setError('Không thể tải thông tin chính sách. Vui lòng thử lại sau.');
                toast.error('Có lỗi xảy ra khi tải chi tiết chính sách');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPolicyDetail();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <FontAwesomeIcon icon={faSpinner} spin className="text-blue-600 text-4xl" />
            </div>
        );
    }

    if (error || !policy) {
        return (
            <div className="container mx-auto px-4 py-8 mt-16">
                <div className="max-w-3xl mx-auto bg-red-50 text-red-800 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                        <FontAwesomeIcon icon={faExclamationCircle} className="text-red-600 mr-2" />
                        <h2 className="text-xl font-bold">Lỗi</h2>
                    </div>
                    <p>{error || 'Không tìm thấy chính sách này.'}</p>
                    <div className="mt-4">
                        <Link to="/policy" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                            Quay lại danh sách chính sách
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const title = policy.title || extractTitle(policy.description);
    const content = policy.content || extractContent(policy.description);

    return (
        <div className="container mx-auto px-4 py-8 mt-16">
            <div className="max-w-4xl mx-auto">
                {/* Đường dẫn điều hướng và nút quay về trang chủ */}
                <div className="flex justify-between items-center mb-6">
                    <Link to="/policy" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                        Quay lại danh sách chính sách
                    </Link>
                    <Link to="/home" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300">
                        <FontAwesomeIcon icon={faHome} className="mr-2" />
                        <span>Quay về trang chủ</span>
                    </Link>
                </div>

                {/* Tiêu đề và trạng thái */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                            {policy.isActive ? (
                                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                                    Đang áp dụng
                                </span>
                            ) : (
                                <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full flex items-center">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                                    Không áp dụng
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className="p-6">
                        {policy.description && (
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-700 mb-2">Mô tả</h2>
                                <p className="text-gray-600">{policy.description}</p>
                            </div>
                        )}

                        {/* Thông tin meta */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                                <span>Cập nhật: {new Date(policy.updatedAt || policy.createAt || policy.createdAt || new Date()).toLocaleDateString('vi-VN')}</span>
                            </div>
                            {policy.policyTypeName && (
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faTags} className="mr-1" />
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                        {policy.policyTypeName}
                                    </span>
                                </div>
                            )}
                            {policy.policyTypeId && !policy.policyTypeName && (
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faTags} className="mr-1" />
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                        Loại ID: {policy.policyTypeId}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Nội dung chính */}
                        <div className="border-t border-gray-100 pt-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Nội dung chính sách</h2>
                            <div className="prose max-w-none">
                                {policy.content ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: policy.content }}
                                        className="policy-content bg-gray-50 p-4 rounded-lg border border-gray-200"
                                    />
                                ) : (
                                    <div className="policy-content bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-line">
                                        {content}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Các tệp đính kèm nếu có */}
                        {policy.attachments && policy.attachments.length > 0 && (
                            <div className="mt-8 border-t border-gray-100 pt-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-3">Tệp đính kèm</h3>
                                <ul className="space-y-2">
                                    {policy.attachments.map((attachment, index) => (
                                        <li key={index} className="flex items-center bg-gray-50 p-2 rounded-md border border-gray-200">
                                            <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {attachment.name || `Tệp đính kèm ${index + 1}`}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolicyDetail; 