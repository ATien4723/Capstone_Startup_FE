import React, { useState, useEffect } from 'react';
import { getCvsByStartup, responseCandidateCV } from '@/apis/cvService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const CV = () => {
    const [cvs, setCvs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [startupId, setStartupId] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [modalData, setModalData] = useState(null);
    const [positions, setPositions] = useState([
        { id: 0, name: 'Tất cả vị trí' },
        { id: 1, name: 'Lập trình viên' },
        { id: 2, name: 'Nhà thiết kế' },
        { id: 3, name: 'Quản lý dự án' }
    ]);

    // Hàm để load danh sách CV
    const loadCVs = async () => {
        if (!startupId) return;

        setLoading(true);
        try {
            const response = await getCvsByStartup(startupId, selectedPosition, page, 5);
            setCvs(response.items || []);
            setTotalPages(response.totalPages || 1);
        } catch (error) {
            console.error('Lỗi khi tải danh sách CV:', error);
            toast.error('Không thể tải danh sách CV');
        } finally {
            setLoading(false);
        }
    };

    // Tải lại danh sách CV khi các yếu tố thay đổi
    useEffect(() => {
        // Giả lập ID startup để demo - trong thực tế sẽ lấy từ context hoặc params
        setStartupId(1);
    }, []);

    useEffect(() => {
        loadCVs();
    }, [startupId, selectedPosition, page]);

    // Xử lý khi phản hồi CV
    const handleResponse = async (candidateCVId, status) => {
        try {
            await responseCandidateCV(candidateCVId, status);
            toast.success(`Đã ${status === 'Approved' ? 'chấp nhận' : 'từ chối'} CV thành công`);
            // Tải lại danh sách CV
            loadCVs();
        } catch (error) {
            console.error('Lỗi khi phản hồi CV:', error);
            toast.error('Có lỗi xảy ra khi phản hồi CV');
        }
    };

    // Hàm hiển thị modal đánh giá CV
    const openEvaluationModal = (cv) => {
        setModalData(cv);
    };

    // Đóng modal
    const closeModal = () => {
        setModalData(null);
    };

    // Hàm định dạng ngày
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return format(date, 'dd/MM/yyyy HH:mm');
        } catch (error) {
            return dateString;
        }
    };

    // Lọc CV theo tab
    const filteredCVs = activeTab === 'all'
        ? cvs
        : cvs.filter(cv => cv.status.toLowerCase() === activeTab);

    // Hàm tạo biểu đồ đánh giá
    const renderEvaluationBar = (score) => {
        // Lấy số điểm từ chuỗi đánh giá (giả sử định dạng "[X] Text...")
        const scoreValue = parseInt(score?.match(/\[(\d+)\]/)?.[1] || 0);

        // Màu sắc dựa trên điểm số
        let color = 'bg-red-500';
        if (scoreValue > 7) color = 'bg-green-500';
        else if (scoreValue > 4) color = 'bg-yellow-500';

        return (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                    className={`h-2.5 rounded-full ${color}`}
                    style={{ width: `${(scoreValue / 10) * 100}%` }}
                ></div>
            </div>
        );
    };

    // Component Modal Đánh giá CV
    const EvaluationModal = () => {
        if (!modalData || !modalData.cvRequirementEvaluation) return null;

        const evaluation = modalData.cvRequirementEvaluation;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    {/* Header Modal */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Đánh giá chi tiết</h3>
                            <p className="text-gray-600">{modalData.fullName || modalData.accountName} - {modalData.positionRequirement || modalData.positionName || 'Chưa xác định'}</p>
                        </div>
                        <button
                            onClick={closeModal}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body Modal */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-medium text-gray-800">Kỹ năng kỹ thuật</h4>
                                    <span className="text-xl font-bold text-gray-800">{evaluation.evaluation_TechSkills?.match(/\[(\d+)\]/)?.[1] || '?'}/10</span>
                                </div>
                                {renderEvaluationBar(evaluation.evaluation_TechSkills)}
                                <p className="text-gray-700 mt-3">{evaluation.evaluation_TechSkills?.replace(/\[\d+\]\s*/, '')}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-medium text-gray-800">Kinh nghiệm</h4>
                                    <span className="text-xl font-bold text-gray-800">{evaluation.evaluation_Experience?.match(/\[(\d+)\]/)?.[1] || '?'}/10</span>
                                </div>
                                {renderEvaluationBar(evaluation.evaluation_Experience)}
                                <p className="text-gray-700 mt-3">{evaluation.evaluation_Experience?.replace(/\[\d+\]\s*/, '')}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-medium text-gray-800">Kỹ năng mềm</h4>
                                    <span className="text-xl font-bold text-gray-800">{evaluation.evaluation_SoftSkills?.match(/\[(\d+)\]/)?.[1] || '?'}/10</span>
                                </div>
                                {renderEvaluationBar(evaluation.evaluation_SoftSkills)}
                                <p className="text-gray-700 mt-3">{evaluation.evaluation_SoftSkills?.replace(/\[\d+\]\s*/, '')}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-medium text-gray-800">Đánh giá tổng thể</h4>
                                    <span className="text-xl font-bold text-gray-800">{evaluation.evaluation_OverallSummary?.match(/\[(\d+)\]/)?.[1] || '?'}/10</span>
                                </div>
                                {renderEvaluationBar(evaluation.evaluation_OverallSummary)}
                                <p className="text-gray-700 mt-3">{evaluation.evaluation_OverallSummary?.replace(/\[\d+\]\s*/, '')}</p>
                            </div>
                        </div>

                        {/* Chart summary */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                            <h4 className="text-lg font-medium text-gray-800 mb-4">Biểu đồ đánh giá</h4>
                            <div className="flex flex-wrap gap-2">
                                {['evaluation_TechSkills', 'evaluation_Experience', 'evaluation_SoftSkills', 'evaluation_OverallSummary'].map((key, index) => {
                                    const score = parseInt(evaluation[key]?.match(/\[(\d+)\]/)?.[1] || 0);
                                    let color = 'bg-red-500';
                                    if (score > 7) color = 'bg-green-500';
                                    else if (score > 4) color = 'bg-yellow-500';

                                    const labels = ['Kỹ thuật', 'Kinh nghiệm', 'Kỹ năng mềm', 'Tổng thể'];

                                    return (
                                        <div key={key} className="flex-1 min-w-[120px]">
                                            <div className="text-center mb-1 text-sm font-medium text-gray-700">{labels[index]}</div>
                                            <div className="h-24 w-full bg-gray-200 rounded-t-lg relative">
                                                <div
                                                    className={`absolute bottom-0 w-full ${color} rounded-t-lg transition-all duration-500 ease-out`}
                                                    style={{ height: `${score * 10}%` }}>
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                                                    {score}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom buttons */}
                        <div className="flex justify-end space-x-2">
                            <a
                                href={modalData.cvurl || modalData.cvFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Xem CV
                            </a>
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý CV</h1>
                <div className="flex items-center">
                    <label className="mr-2 text-gray-700">Lọc theo vị trí:</label>
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(Number(e.target.value))}
                    >
                        {positions.map(pos => (
                            <option key={pos.id} value={pos.id}>
                                {pos.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="border-b border-gray-200 mb-6">
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('all')}
                >
                    Tất cả
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Đang chờ
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'approved' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('approved')}
                >
                    Đã chấp nhận
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'rejected' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    Đã từ chối
                </button>
            </div>

            {/* Hiển thị danh sách CV */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredCVs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCVs.map(cv => (
                        <div key={cv.candidateCV_ID || cv.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
                            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">{cv.fullName || cv.accountName}</h2>
                                    <p className="text-gray-500 text-sm">{cv.email || 'Email không có'}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full
                                    ${cv.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        cv.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'}`}
                                >
                                    {cv.status === 'Pending' ? 'Đang chờ' :
                                        cv.status === 'Approved' ? 'Đã chấp nhận' : 'Đã từ chối'}
                                </span>
                            </div>

                            <div className="px-6 py-4">
                                <div className="flex items-center mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                                    </svg>
                                    <span className="text-gray-700 font-medium">Vị trí: {cv.positionRequirement || cv.positionName || 'Chưa xác định'}</span>
                                </div>

                                <div className="flex items-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-500 text-sm">{formatDate(cv.createAt)}</span>
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <a
                                        href={cv.cvurl || cv.cvFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                        Xem CV
                                    </a>

                                    {cv.status === 'Pending' && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <button
                                                onClick={() => handleResponse(cv.candidateCV_ID || cv.id, 'Approved')}
                                                className="flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Chấp nhận
                                            </button>

                                            <button
                                                onClick={() => handleResponse(cv.candidateCV_ID || cv.id, 'Rejected')}
                                                className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                                Từ chối
                                            </button>
                                        </div>
                                    )}

                                    {cv.cvRequirementEvaluation && (
                                        <button
                                            onClick={() => openEvaluationModal(cv)}
                                            className="flex items-center justify-center px-4 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors mt-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                            </svg>
                                            Xem đánh giá
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-medium text-gray-700 mb-1">Không có dữ liệu</h3>
                    <p className="text-gray-500">Hiện tại chưa có CV nào trong danh sách.</p>
                </div>
            )}

            {/* Phân trang */}
            {filteredCVs.length > 0 && (
                <div className="flex justify-center mt-8">
                    <nav className="flex items-center space-x-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={`px-4 py-2 rounded-md ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <div className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700">
                            Trang {page} / {totalPages}
                        </div>

                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= totalPages}
                            className={`px-4 py-2 rounded-md ${page >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </nav>
                </div>
            )}

            {/* Modal đánh giá CV */}
            {modalData && <EvaluationModal />}
        </div>
    );
};

export default CV; 