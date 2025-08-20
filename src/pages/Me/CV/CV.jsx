import React, { useState, useEffect } from 'react';
import { getCvsByStartup, responseCandidateCV } from '@/apis/cvService';
import { getStartupIdByAccountId } from '@/apis/startupService';
import { getUserId } from '@/apis/authService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const CV = () => {
    const [cvs, setCvs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [startupId, setStartupId] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [modalData, setModalData] = useState(null);
    const [positions, setPositions] = useState(['all']);
    const [cvModalOpen, setCvModalOpen] = useState(false);
    const [currentCvUrl, setCurrentCvUrl] = useState('');

    // Hàm để load danh sách CV
    const loadCVs = async () => {
        if (!startupId) return;

        setLoading(true);
        try {
            const response = await getCvsByStartup(startupId, 0, page, 5);
            setCvs(response.items || []);
            setTotalPages(response.totalPages || 1);

            // Lấy danh sách các positionRequirement duy nhất
            const uniquePositions = ['all'];
            response.items?.forEach(cv => {
                if (cv.positionRequirement && !uniquePositions.includes(cv.positionRequirement)) {
                    uniquePositions.push(cv.positionRequirement);
                }
            });
            setPositions(uniquePositions);
        } catch (error) {
            console.error('Lỗi khi tải danh sách CV:', error);
            toast.error('Unable to load CV list');
        } finally {
            setLoading(false);
        }
    };

    // Lấy startupId từ API
    useEffect(() => {
        const fetchStartupId = async () => {
            try {
                const accountId = await getUserId();
                if (accountId) {
                    const response = await getStartupIdByAccountId(accountId);
                    if (response) {
                        setStartupId(response);
                        // console.log('Đã lấy startupId từ API:', response);
                    } else {
                        console.error('Không tìm thấy startup cho tài khoản này');
                    }
                } else {
                    console.error('Không thể xác định người dùng hiện tại');
                }
            } catch (error) {
                console.error('Lỗi khi lấy startupId:', error);
            }
        };

        fetchStartupId();
    }, []);

    // Tải lại danh sách CV khi các yếu tố thay đổi
    useEffect(() => {
        loadCVs();
    }, [startupId, page]);

    // Xử lý khi phản hồi CV
    const handleResponse = async (candidateCVId, status) => {
        try {
            await responseCandidateCV(candidateCVId, status);
            toast.success(`CV ${status === 'Approved' ? 'approved' : 'rejected'} successfully`);
            // Tải lại danh sách CV
            loadCVs();
        } catch (error) {
            console.error('Lỗi khi phản hồi CV:', error);
            toast.error('An error occurred while responding to CV');
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

    // Hàm mở modal xem CV
    const openCvModal = (url) => {
        setCurrentCvUrl(url);
        setCvModalOpen(true);
    };

    // Đóng modal xem CV
    const closeCvModal = () => {
        setCvModalOpen(false);
        setCurrentCvUrl('');
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

    // Lọc CV theo tab và positionRequirement
    const filteredCVs = cvs
        .filter(cv => activeTab === 'all' || cv.status.toLowerCase() === activeTab)
        .filter(cv => selectedPosition === 'all' || cv.positionRequirement === selectedPosition);

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
                            <h3 className="text-xl font-bold text-gray-800">Detailed Evaluation</h3>
                            <p className="text-gray-600">{modalData.fullName || modalData.accountName} - {modalData.positionRequirement || modalData.positionName || 'Not specified'}</p>
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
                                    <h4 className="text-lg font-medium text-gray-800">Technical Skills</h4>
                                    <span className="text-xl font-bold text-gray-800">{evaluation.evaluation_TechSkills?.match(/\[(\d+)\]/)?.[1] || '?'}/10</span>
                                </div>
                                {renderEvaluationBar(evaluation.evaluation_TechSkills)}
                                <p className="text-gray-700 mt-3">{evaluation.evaluation_TechSkills?.replace(/\[\d+\]\s*/, '')}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-medium text-gray-800">Experience</h4>
                                    <span className="text-xl font-bold text-gray-800">{evaluation.evaluation_Experience?.match(/\[(\d+)\]/)?.[1] || '?'}/10</span>
                                </div>
                                {renderEvaluationBar(evaluation.evaluation_Experience)}
                                <p className="text-gray-700 mt-3">{evaluation.evaluation_Experience?.replace(/\[\d+\]\s*/, '')}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-medium text-gray-800">Soft Skills</h4>
                                    <span className="text-xl font-bold text-gray-800">{evaluation.evaluation_SoftSkills?.match(/\[(\d+)\]/)?.[1] || '?'}/10</span>
                                </div>
                                {renderEvaluationBar(evaluation.evaluation_SoftSkills)}
                                <p className="text-gray-700 mt-3">{evaluation.evaluation_SoftSkills?.replace(/\[\d+\]\s*/, '')}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-lg font-medium text-gray-800">Overall Assessment</h4>
                                    <span className="text-xl font-bold text-gray-800">{evaluation.evaluation_OverallSummary?.match(/\[(\d+)\]/)?.[1] || '?'}/10</span>
                                </div>
                                {renderEvaluationBar(evaluation.evaluation_OverallSummary)}
                                <p className="text-gray-700 mt-3">{evaluation.evaluation_OverallSummary?.replace(/\[\d+\]\s*/, '')}</p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Component Modal xem CV
    const CvViewerModal = () => {
        if (!cvModalOpen || !currentCvUrl) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">CV Viewer</h3>
                        <button
                            onClick={closeCvModal}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* PDF Viewer */}
                    <div className="flex-1 overflow-hidden">
                        <iframe
                            src={currentCvUrl}
                            className="w-full h-full"
                            title="CV Viewer"
                        ></iframe>
                    </div>

                    {/* Bottom buttons */}
                    <div className="p-4 border-t border-gray-200 flex justify-between">
                        <a
                            href={currentCvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Open in new tab
                        </a>
                        <button
                            onClick={closeCvModal}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">CV Management</h1>
                <div className="flex items-center">
                    <label className="mr-2 text-gray-700">Filter by position:</label>
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                    >
                        {positions.map((pos, index) => (
                            <option key={index} value={pos}>
                                {pos === 'all' ? 'All positions' : pos}
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
                    All
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'approved' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('approved')}
                >
                    Approved
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'rejected' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    Rejected
                </button>
            </div>

            {/* Hiển thị danh sách CV */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredCVs.length > 0 ? (
                <div className="flex flex-col space-y-4">
                    {filteredCVs.map(cv => (
                        <div key={cv.candidateCV_ID || cv.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
                            <div className="px-6 py-4 flex flex-wrap md:flex-nowrap items-center border-b border-gray-100">
                                <div className="w-full md:w-1/3 flex items-center mb-3 md:mb-0">
                                    <div className="bg-blue-50 rounded-full p-2 mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800">{cv.fullName || cv.accountName}</h2>
                                        <p className="text-gray-500 text-sm">{cv.email || 'No email'}</p>
                                    </div>
                                </div>

                                <div className="w-full md:w-1/3 flex flex-wrap md:justify-center mb-3 md:mb-0">
                                    <div className="flex items-center mr-4 mb-2 md:mb-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                                        </svg>
                                        <span className="text-gray-700 font-medium">Position: {cv.positionRequirement || cv.positionName || 'Not specified'}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-700 font-medium">Applied: {formatDate(cv.createAt)}</span>
                                    </div>
                                </div>

                                <div className="w-full md:w-1/3 flex md:justify-end items-center">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full mr-2
                                        ${cv.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            cv.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'}`}
                                    >
                                        {cv.status === 'Pending' ? 'Pending' :
                                            cv.status === 'Approved' ? 'Approved' : 'Rejected'}
                                    </span>
                                </div>
                            </div>

                            <div className="px-6 py-4 flex flex-wrap md:flex-nowrap justify-between items-center">
                                <div className="w-full md:w-auto flex space-x-2 mb-3 md:mb-0">
                                    <button
                                        onClick={() => openCvModal(cv.cvurl || cv.cvFileUrl)}
                                        className="flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                        View CV
                                    </button>

                                    {cv.cvRequirementEvaluation && (
                                        <button
                                            onClick={() => openEvaluationModal(cv)}
                                            className="flex items-center justify-center px-4 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                            View Evaluation
                                        </button>
                                    )}
                                </div>

                                {cv.status === 'Pending' && (
                                    <div className="w-full md:w-auto flex space-x-2">
                                        <button
                                            onClick={() => handleResponse(cv.candidateCV_ID || cv.id, 'Approved')}
                                            className="flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Approve
                                        </button>

                                        <button
                                            onClick={() => handleResponse(cv.candidateCV_ID || cv.id, 'Rejected')}
                                            className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-medium text-gray-700 mb-1">No data available</h3>
                    <p className="text-gray-500">There are currently no CVs in the list.</p>
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
                            Page {page} / {totalPages}
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

            {/* Modal xem CV */}
            <CvViewerModal />
        </div>
    );
};

export default CV; 
