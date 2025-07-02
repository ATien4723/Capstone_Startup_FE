import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBriefcase, faLocationDot, faClock, faCalendarAlt, faMoneyBillWave,
    faBuilding, faGraduationCap, faLanguage, faCheckCircle, faUserPlus,
    faBookmark, faShareAlt, faArrowLeft, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getPostById } from '@/apis/postService';
import { formatVietnameseDate } from '@/utils/dateUtils';

const InternshipDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPostDetail = async () => {
            try {
                setLoading(true);
                const response = await getPostById(id);
                setPost(response);
            } catch (err) {
                console.error('Lỗi khi lấy chi tiết bài đăng:', err);
                setError('Không thể tải thông tin bài đăng. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPostDetail();
        }
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
        // Xử lý khi người dùng ứng tuyển
        alert('Chức năng ứng tuyển đang được phát triển');
    };

    const handleSave = () => {
        // Xử lý khi người dùng lưu bài đăng
        alert('Chức năng lưu bài đăng đang được phát triển');
    };

    const handleShare = () => {
        // Xử lý khi người dùng chia sẻ bài đăng
        alert('Chức năng chia sẻ đang được phát triển');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 py-16 flex justify-center items-center">
                    <div className="text-center">
                        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-600">Đang tải thông tin bài đăng...</p>
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
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
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
        title: "Kỹ Sư Kỹ Thuật (SMT/PE/TE/AME/QA/Repair...) Tại Nam Định Và Các Khu Vực Lân Cận",
        company: "CÔNG TY TÀI CHÍNH CỔ PHẦN ĐIỆN LỰC EVN",
        logo: "https://via.placeholder.com/100",
        location: "Nam Định & 6 nơi khác",
        salary: "Thoả thuận",
        experience: "Không yêu cầu",
        deadline: "03/07/2025",
        type: "Internship",
        description: "Ứng viên có kinh nghiệm về SMT/PE/TE/AME/QA/Repair có thể lựa chọn các việc làm phù hợp năng lực và định hướng nghề nghiệp",
        requirements: [
            "Tốt nghiệp Cao đẳng trở lên, các chuyên ngành liên quan tới IT, Khoa học Máy tính, Cơ khí, Tự động hóa,...",
            "Biết tiếng Trung hoặc tiếng Anh là một lợi thế",
            "Có kinh nghiệm trong lĩnh vực liên quan, chưa có kinh nghiệm sẽ được đào tạo"
        ],
        responsibilities: [
            "Chuẩn bị các tài liệu quy trình (SOP), checklist, và kiểm tra thiết lập thiết bị",
            "Phân tích lỗi và tìm nguyên nhân trên MLBs, đưa ra các biện pháp cải tiến",
            "Bảo trì và quản lý thiết bị sản xuất trên dây chuyền",
            "Xử lý các sự cố bất thường trên dây chuyền sản xuất liên quan đến máy móc",
            "Thực hiện công việc theo cấp trên yêu cầu"
        ],
        benefits: [
            "Mức lương thoả thuận khi tới phỏng vấn",
            "Trợ cấp đi lại, nhà ở, chuyên cần: 1.900.000 VND",
            "Trợ cấp ngôn ngữ Trung: 1.000.000 - 3.000.000 VND (theo cấp bậc chứng chỉ)",
            "Trợ cấp ngôn ngữ Anh: 1.000.000 - 3.000.000 VND",
            "Thưởng nỗ lực lên tới 600.000 VND",
            "Nhận 100% lương trong thời gian thử việc",
            "Đóng Bảo hiểm trong thời gian thử việc",
            "Có nghỉ sinh lý nữ",
            "Lộ trình thăng tiến rõ ràng",
            "Được trang bị đầy đủ điều kiện làm việc",
            "Tăng ca theo quy định của Nhà nước",
            "Có 12 ngày phép/năm",
            "Công ty cung cấp bữa ăn theo ca làm việc"
        ],
        workLocations: [
            "Nam Định: Tòa F1, lô CN14, KCN Mỹ Thuận, TP Nam Định",
            "Ninh Bình",
            "Hà Nam"
        ],
        createdAt: new Date().toISOString(),
        views: 156,
        applications: 23
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <nav className="text-sm mb-6">
                    <ol className="list-none p-0 flex items-center">
                        <li>
                            <Link to="/" className="text-blue-600 hover:underline">Trang chủ</Link>
                            <span className="mx-2">/</span>
                        </li>
                        <li>
                            <Link to="/startups" className="text-blue-600 hover:underline">Startups</Link>
                            <span className="mx-2">/</span>
                        </li>
                        <li className="text-gray-500 truncate max-w-xs">{jobData.title}</li>
                    </ol>
                </nav>

                {/* Job Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/6">
                            <div className="w-24 h-24 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                <img
                                    src={jobData.logo || "https://via.placeholder.com/100"}
                                    alt={jobData.company}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        </div>

                        <div className="md:w-5/6">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{jobData.title}</h1>
                                    <div className="flex items-center mb-3">
                                        <FontAwesomeIcon icon={faBuilding} className="text-gray-500 mr-2" />
                                        <span className="font-medium text-blue-600">{jobData.company}</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 mb-4">
                                        <div className="flex items-center">
                                            <FontAwesomeIcon icon={faLocationDot} className="text-gray-500 mr-2" />
                                            <span>{jobData.location}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-gray-500 mr-2" />
                                            <span className="text-green-600 font-medium">{jobData.salary}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FontAwesomeIcon icon={faGraduationCap} className="text-gray-500 mr-2" />
                                            <span>Kinh nghiệm: {jobData.experience}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-500 mr-2" />
                                            <span>Hạn nộp: {jobData.deadline}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleApply}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg transition flex items-center justify-center font-medium"
                                        >
                                            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                            Ứng tuyển ngay
                                        </button>
                                        <button
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
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Đăng {formatDate(jobData.createdAt)} • {jobData.views} lượt xem • {jobData.applications} ứng viên
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
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold mb-4">Mô tả công việc</h2>
                            <p className="text-gray-700 mb-6 whitespace-pre-line">{jobData.description}</p>

                            <h3 className="text-lg font-semibold mb-3">Yêu cầu ứng viên</h3>
                            <ul className="list-disc pl-5 space-y-2 mb-6">
                                {jobData.requirements.map((req, index) => (
                                    <li key={index} className="text-gray-700">{req}</li>
                                ))}
                            </ul>

                            <h3 className="text-lg font-semibold mb-3">Nhiệm vụ công việc</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                {jobData.responsibilities.map((resp, index) => (
                                    <li key={index} className="text-gray-700">{resp}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Quyền lợi */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold mb-4">Quyền lợi</h2>
                            <ul className="space-y-3">
                                {jobData.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mt-1 mr-3" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Địa điểm làm việc */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold mb-4">Địa điểm làm việc</h2>
                            <ul className="space-y-3">
                                {jobData.workLocations.map((location, index) => (
                                    <li key={index} className="flex items-start">
                                        <FontAwesomeIcon icon={faLocationDot} className="text-blue-500 mt-1 mr-3" />
                                        <span>{location}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Thông tin công ty */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold mb-4">Thông tin công ty</h2>
                            <div className="flex items-center mb-4">
                                <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden mr-4">
                                    <img
                                        src={jobData.logo || "https://via.placeholder.com/100"}
                                        alt={jobData.company}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{jobData.company}</h3>
                                    <p className="text-gray-500 text-sm">Tài chính / Điện lực</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mt-4">
                                <Link
                                    to="/company/1"
                                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center w-full py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                                >
                                    Xem trang công ty
                                </Link>
                            </div>
                        </div>

                        {/* Việc làm tương tự */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold mb-4">Việc làm tương tự</h2>
                            <div className="space-y-4">
                                {[1, 2, 3].map((item) => (
                                    <Link key={item} to={`/internship/${item}`} className="block">
                                        <div className="border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition hover:shadow-sm">
                                            <h3 className="font-medium text-gray-800 mb-1 line-clamp-2">Kỹ sư phần mềm {item}</h3>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <span>Công ty {item}</span>
                                                <span className="mx-2">•</span>
                                                <span>Hà Nội</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternshipDetail; 