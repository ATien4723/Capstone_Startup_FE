import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBriefcase, faLocationDot, faClock, faCalendarAlt, faMoneyBillWave,
    faBuilding, faGraduationCap, faLanguage, faCheckCircle, faUserPlus,
    faBookmark, faShareAlt, faArrowLeft, faSpinner, faClock as faClockSolid, faInfoCircle,
    faStar, faUserTie, faChevronRight, faFileUpload, faTimes, faCheck, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getInternshipPostDetail } from '@/apis/postService';
import { formatVietnameseDate } from '@/utils/dateUtils';
import { applyCv, checkSubmittedCV, getTopCVSubmittedInternshipPosts } from '@/apis/cvService';
import { toast } from 'react-toastify';
import { getUserId } from '@/apis/authService';

const InternshipDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [cvFile, setCvFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [fileName, setFileName] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [similarJobs, setSimilarJobs] = useState([]);
    const [loadingSimilarJobs, setLoadingSimilarJobs] = useState(false);

    useEffect(() => {
        const fetchPostDetail = async () => {
            try {
                setLoading(true);
                const response = await getInternshipPostDetail(id);
                setPost(response);
            } catch (err) {
                console.error('Lỗi khi lấy chi tiết bài đăng:', err);
                setError('Không thể tải thông tin bài đăng. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        const fetchSubmissionStatus = async () => {
            try {
                const accountId = getUserId();
                if (accountId && id) {
                    const response = await checkSubmittedCV(accountId, id);
                    setHasSubmitted(response);
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra trạng thái nộp CV:', error);
            }
        };

        const fetchSimilarJobs = async () => {
            try {
                setLoadingSimilarJobs(true);
                const response = await getTopCVSubmittedInternshipPosts(3);
                setSimilarJobs(response);
            } catch (error) {
                console.error('Lỗi khi lấy danh sách việc làm tương tự:', error);
                setSimilarJobs([]);
            } finally {
                setLoadingSimilarJobs(false);
            }
        };

        if (id) {
            fetchPostDetail();
            fetchSubmissionStatus();
        }

        fetchSimilarJobs();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return formatVietnameseDate(dateString);
        } catch (error) {
            return dateString;
        }
    };

    const handleApply = () => {
        // Kiểm tra nếu đã hết hạn
        if (isDeadlinePassed(post?.deadline)) {
            toast.error('Đã hết hạn nộp CV cho vị trí này');
            return;
        }

        // const accountId = getUserId();
        // if (!accountId) {
        //     toast.error('Vui lòng đăng nhập để nộp CV');
        //     navigate('/login');
        //     return;
        // }

        // if (hasSubmitted) {
        //     toast.info('Bạn đã nộp CV cho vị trí này');
        //     return;
        // }

        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCvFile(file);
            setFileName(file.name);
        }
    };

    const handleSubmitCV = async (e) => {
        e.preventDefault();

        if (!cvFile) {
            toast.error('Vui lòng chọn file CV để nộp');
            return;
        }

        try {
            setSubmitting(true);
            const accountId = getUserId();

            if (!accountId) {
                toast.error('Vui lòng đăng nhập để nộp CV');
                navigate('/login');
                return;
            }

            const cvData = {
                accountId: accountId,
                internshipId: post?.internshipId || id,
                positionId: post?.positionId || 0,
                cvFile: cvFile
            };

            const response = await applyCv(cvData);
            toast.success('Nộp CV thành công!');
            setShowModal(false);
            setCvFile(null);
            setFileName('');
            setHasSubmitted(true); // Cập nhật trạng thái đã nộp
        } catch (error) {
            console.error('Lỗi khi nộp CV:', error);
            toast.error('Có lỗi xảy ra khi nộp CV. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCvFile(null);
        setFileName('');
    };

    const handleSave = () => {
        // Xử lý khi người dùng lưu bài đăng
        alert('Chức năng lưu bài đăng đang được phát triển');
    };

    const handleShare = () => {
        // Xử lý khi người dùng chia sẻ bài đăng
        alert('Chức năng chia sẻ đang được phát triển');
    };

    // Kiểm tra nếu đã hết hạn nộp
    const isDeadlinePassed = (deadlineDate) => {
        if (!deadlineDate) return false;
        const deadline = new Date(deadlineDate);
        const today = new Date();
        return deadline < today;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 py-16 flex justify-center items-center">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-50">
                            <FontAwesomeIcon icon={faSpinner} className="text-3xl text-blue-600 animate-spin" />
                        </div>
                        <p className="text-lg text-gray-700 font-medium">Đang tải thông tin bài đăng...</p>
                        <p className="text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-50">
                            <FontAwesomeIcon icon={faInfoCircle} className="text-3xl text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center mx-auto"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Dữ liệu mẫu khi chưa có API hoặc API chưa trả về đủ thông tin
    const jobData = post || {
        title: "Loading...",
        company: "Loading...",
        logo: "https://via.placeholder.com/100",
        location: "Loading...",
        salary: "Loading...",
        experience: "No requirements",
        deadline: "Loading...",
        type: "Internship",
        description: "Loading...",
        requirements: ["Loading..."],
        responsibilities: ["Loading..."],
        benefits: ["Loading..."],
        workLocations: ["Loading..."],
        createdAt: new Date().toISOString(),
        views: 0,
        applications: 0
    };

    const formatRequirementAsList = (requirementText) => {
        if (!requirementText) return ["No specific requirements"];
        return requirementText.split('\n').filter(item => item.trim() !== '');
    };

    const formatBenefitsAsList = (benefitsText) => {
        if (!benefitsText) return ["Không có quyền lợi được liệt kê"];
        return benefitsText.split('\n').filter(item => item.trim() !== '');
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'closed':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}

                {/* <nav className="flex mt-10 py-3 px-5 text-gray-700 rounded-lg bg-gray-50 border border-gray-200 mb-6 shadow-sm">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        <li className="inline-flex items-center">
                            <Link to="/" className="text-gray-700 hover:text-blue-600 inline-flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                </svg>
                                Trang chủ
                            </Link>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-gray-400" size="xs" />
                                <Link to="/startups" className="text-gray-700 hover:text-blue-600">
                                    Startups
                                </Link>
                            </div>
                        </li>
                        <li aria-current="page">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-gray-400" size="xs" />
                                <span className="text-gray-500 truncate max-w-[200px]">{post?.positionTitle || "Chi tiết thực tập"}</span>
                            </div>
                        </li>
                    </ol> */}
                <nav className="flex mt-10 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition duration-300"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                        Quay lại
                    </button>
                </nav>

                {/* Job Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 transform transition duration-300 hover:shadow-md">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/6">
                            <div className="w-28 h-28 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden p-2 shadow-sm">
                                <img
                                    src={post?.logo || "https://via.placeholder.com/100"}
                                    alt={post?.startupName}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        </div>

                        <div className="md:w-5/6">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                <div>
                                    <div className="flex items-center">
                                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{post?.positionTitle}</h1>
                                        <span className={`ml-3 inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(post?.status)}`}>
                                            {post?.status || "Đang hoạt động"}
                                        </span>
                                    </div>
                                    <div className="flex items-center mb-3">
                                        <FontAwesomeIcon icon={faBuilding} className="text-gray-500 mr-2" />
                                        <span className="font-medium text-blue-600 hover:underline cursor-pointer">{post?.startupName}</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 mb-4">
                                        <div className="flex items-center group">
                                            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors mr-3">
                                                <FontAwesomeIcon icon={faLocationDot} className="text-blue-600" />
                                            </div>
                                            <span>{post?.address || "Không có địa chỉ"}</span>
                                        </div>
                                        <div className="flex items-center group">
                                            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 group-hover:bg-green-100 transition-colors mr-3">
                                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600" />
                                            </div>
                                            <span className="text-green-600 font-medium">{post?.salary || "Thoả thuận"}</span>
                                        </div>
                                        <div className="flex items-center group">
                                            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors mr-3">
                                                <FontAwesomeIcon icon={faUserTie} className="text-purple-600" />
                                            </div>
                                            <span>Vị trí: <span className="font-medium">{post?.positionTitle}</span></span>
                                        </div>
                                        <div className="flex items-center group">
                                            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 group-hover:bg-red-100 transition-colors mr-3">
                                                <FontAwesomeIcon icon={faCalendarAlt} className="text-red-600" />
                                            </div>
                                            <span>Hạn nộp: <span className="font-medium">{formatDate(post?.deadline)}</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 md:mt-0 flex flex-col gap-3">
                                    {hasSubmitted ? (
                                        <div className="bg-green-50 text-green-700 px-6 py-3 rounded-lg flex items-center justify-center font-medium border border-green-200">
                                            <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                            Đã nộp CV
                                        </div>
                                    ) : isDeadlinePassed(post?.deadline) ? (
                                        <div className="bg-red-50 text-red-700 px-6 py-3 rounded-lg flex items-center justify-center font-medium border border-red-200">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                                            Đã hết hạn
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleApply}
                                            className="bg-gradient-to-r from-green-600 to-yellow-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                                        >
                                            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                            Ứng tuyển ngay
                                        </button>
                                    )}
                                    {/* <button
                                        onClick={handleSave}
                                        className="border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 px-3 py-2.5 rounded-lg transition flex items-center justify-center"
                                    >
                                        <FontAwesomeIcon icon={faBookmark} />
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 px-3 py-2.5 rounded-lg transition flex items-center justify-center"
                                    >
                                        <FontAwesomeIcon icon={faShareAlt} />
                                    </button> */}
                                    <div className="text-sm text-gray-500">
                                        <div className="flex items-center mb-1">
                                            <FontAwesomeIcon icon={faClockSolid} className="mr-2 text-gray-400" />
                                            Đăng {formatDate(post?.createAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Job Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Mô tả công việc */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-shadow duration-300 hover:shadow-md">
                            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faBriefcase} className="text-blue-600" />
                                </div>
                                Mô tả công việc
                            </h2>
                            <div className="pl-4 border-l-4 border-blue-100 my-6">
                                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{post?.description}</p>
                            </div>

                            <h3 className="text-lg font-semibold mb-3 mt-8 flex items-center">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faGraduationCap} className="text-purple-600" />
                                </div>
                                Yêu cầu ứng viên
                            </h3>
                            <ul className="list-none space-y-3 pl-4 mt-4">
                                {formatRequirementAsList(post?.requirement).map((req, index) => (
                                    <li key={index} className="flex items-start text-gray-700 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                        <span className="inline-flex items-center justify-center flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-green-100 text-green-800">
                                            <span className="text-xs">{index + 1}</span>
                                        </span>
                                        <span className="leading-relaxed">{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Quyền lợi */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-shadow duration-300 hover:shadow-md">
                            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faStar} className="text-green-600" />
                                </div>
                                Quyền lợi
                            </h2>
                            <ul className="space-y-4 mt-6">
                                {formatBenefitsAsList(post?.benefits).map((benefit, index) => (
                                    <li key={index} className="flex items-start hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-3">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                        </div>
                                        <span className="text-gray-700 leading-relaxed">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Địa điểm làm việc */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-shadow duration-300 hover:shadow-md">
                            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faLocationDot} className="text-red-600" />
                                </div>
                                Địa điểm làm việc
                            </h2>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-start">
                                    <FontAwesomeIcon icon={faLocationDot} className="text-red-500 mt-1 mr-3" />
                                    <span className="text-gray-700 font-medium">{post?.address || "Không có thông tin địa điểm"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Thông tin công ty */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-shadow duration-300 hover:shadow-md">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Thông tin startup</h2>
                            <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden mr-4 shadow-sm">
                                    <img
                                        src={post?.logo || "https://via.placeholder.com/100"}
                                        alt={post?.startupName}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">{post?.startupName}</h3>
                                    <p className="text-gray-500 text-sm">Startup</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mt-4">
                                <Link
                                    to={`/startup-detail/${post?.startupId}`}
                                    className="text-white bg-blue-600 hover:bg-blue-700 font-medium flex items-center justify-center w-full py-3 rounded-lg transition duration-300 shadow-sm hover:shadow"
                                >
                                    Xem trang startup
                                </Link>
                            </div>
                        </div>

                        {/* Việc làm tương tự */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-shadow duration-300 hover:shadow-md">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Việc làm tương tự</h2>
                            <div className="space-y-4">
                                {loadingSimilarJobs ? (
                                    <div className="text-center py-4">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500 text-xl" />
                                        <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
                                    </div>
                                ) : similarJobs && similarJobs.length > 0 ? (
                                    similarJobs.map((job) => (
                                        <Link key={job.internshipId} to={`/internship/${job.internshipId}`} className="block">
                                            <div className="border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-all duration-300 hover:shadow-sm bg-white hover:bg-blue-50">
                                                <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 hover:text-blue-600">
                                                    {job.positionTitle}
                                                </h3>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <span>{job.startupName}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{job.address}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500">
                                        Không có việc làm tương tự
                                    </div>
                                )}
                                <div className="text-center pt-2">
                                    <Link to="/startups" className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center">
                                        Xem tất cả
                                        <FontAwesomeIcon icon={faChevronRight} className="ml-1" size="xs" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Nộp CV */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75 px-4 pt-4 pb-20 text-center sm:p-0"
                    onClick={handleCloseModal}
                >
                    <div
                        className="relative rounded-lg text-left shadow-xl transform transition-all w-full max-w-lg sm:my-8 sm:w-full"
                        onClick={(e) => e.stopPropagation()} // chặn click lan ra ngoài
                    >
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex items-center justify-center flex-shrink-0 h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <FontAwesomeIcon icon={faFileUpload} className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Nộp CV ứng tuyển
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Hãy tải lên CV của bạn để ứng tuyển vào vị trí{" "}
                                            <span className="font-medium">{post?.positionTitle}</span> tại{" "}
                                            <span className="font-medium">{post?.startupName}</span>.
                                        </p>

                                        <form onSubmit={handleSubmitCV} className="mt-4">
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Tải lên CV của bạn
                                                </label>

                                                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                                                    <div className="space-y-1 text-center">
                                                        <div className="flex text-sm text-gray-600">
                                                            <label
                                                                htmlFor="file-upload"
                                                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                                            >
                                                                <span>Tải lên CV</span>
                                                                <input
                                                                    id="file-upload"
                                                                    name="file-upload"
                                                                    type="file"
                                                                    className="sr-only"
                                                                    onChange={handleFileChange}
                                                                    accept=".pdf,.doc,.docx"
                                                                />
                                                            </label>
                                                            <p className="pl-1">hoặc kéo thả tại đây</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            PDF, DOC, DOCX tối đa 10MB
                                                        </p>

                                                        {fileName && (
                                                            <div className="mt-2 flex items-center justify-center text-sm">
                                                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center">
                                                                    <span className="truncate max-w-xs">{fileName}</span>
                                                                    <button
                                                                        type="button"
                                                                        className="ml-2 text-red-500 hover:text-red-700"
                                                                        onClick={() => {
                                                                            setCvFile(null);
                                                                            setFileName("");
                                                                        }}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTimes} />
                                                                    </button>
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="button"
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
                                onClick={handleSubmitCV}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                        Đang nộp...
                                    </>
                                ) : (
                                    "Nộp CV"
                                )}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={handleCloseModal}
                            >
                                Huỷ bỏ
                            </button>
                        </div>
                    </div >
                </div >
            )}




        </div >
    );
};

export default InternshipDetail; 