import { useState, useEffect, useRef } from 'react';
import { getStartupById, getStartupIdByAccountId, updateStartup } from '@/apis/startupService';
import { getUserId } from '@/apis/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding,
    faGlobe,
    faEnvelope,
    faInfoCircle,
    faEye,
    faBullseye,
    faCalendarAlt,
    faCheck,
    faSeedling,
    faPencilAlt,
    faSave,
    faTimes,
    faImage,
    faUpload
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const StartupInfo = () => {
    const [startup, setStartup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accountId, setAccountId] = useState(null);
    const [startupId, setStartupId] = useState(null);

    // Refs cho file inputs
    const logoInputRef = useRef(null);
    const backgroundInputRef = useRef(null);

    // State cho chế độ chỉnh sửa
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        startupName: '',
        abbreviationName: '',
        description: '',
        vision: '',
        mission: '',
        websiteURL: '',
        email: '',
    });

    // State cho file uploads
    const [logoFile, setLogoFile] = useState(null);
    const [backgroundFile, setBackgroundFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [backgroundPreview, setBackgroundPreview] = useState('');

    const [saving, setSaving] = useState(false);

    // Lấy accountId của người dùng hiện tại
    useEffect(() => {
        const fetchAccountId = async () => {
            try {
                const id = await getUserId();
                setAccountId(id);
            } catch (err) {
                console.error("Lỗi khi lấy ID người dùng:", err);
                setError("Không thể xác thực người dùng");
            }
        };

        fetchAccountId();
    }, []);

    // Lấy startupId từ accountId
    useEffect(() => {
        const fetchStartupId = async () => {
            if (!accountId) return;

            try {
                const response = await getStartupIdByAccountId(accountId);
                if (response) {
                    setStartupId(response);
                } else {
                    setError("Không tìm thấy startup cho tài khoản này");
                }
            } catch (err) {
                console.error("Lỗi khi lấy startupId:", err);
                setError("Đã có lỗi xảy ra khi tìm thông tin startup");
            }
        };

        fetchStartupId();
    }, [accountId]);

    // Lấy thông tin chi tiết startup từ startupId
    useEffect(() => {
        const fetchStartupInfo = async () => {
            if (!startupId) return;

            try {
                setLoading(true);
                const response = await getStartupById(startupId);
                console.log("response =", response);
                if (response && response.data) {
                    setStartup(response.data);

                    // Khởi tạo formData với dữ liệu hiện tại
                    setFormData({
                        startupName: response.data.startupName || '',
                        abbreviationName: response.data.abbreviationName || '',
                        description: response.data.description || '',
                        vision: response.data.vision || '',
                        mission: response.data.mission || '',
                        websiteURL: response.data.websiteURL || '',
                        email: response.data.email || '',
                    });

                    // Khởi tạo preview hình ảnh
                    if (response.data.logo) {
                        setLogoPreview(response.data.logo);
                    }
                    if (response.data.backgroundURL) {
                        setBackgroundPreview(response.data.backgroundURL);
                    }
                } else {
                    setError("Không tìm thấy thông tin startup");
                }
            } catch (err) {
                console.error("Lỗi khi lấy thông tin startup:", err);
                setError("Đã có lỗi xảy ra khi tải thông tin startup");
            } finally {
                setLoading(false);
            }
        };

        fetchStartupInfo();
    }, [startupId]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Xử lý thay đổi giá trị form
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Xử lý tải lên file logo
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const previewUrl = URL.createObjectURL(file);
            setLogoPreview(previewUrl);
        }
    };

    // Xử lý tải lên file background
    const handleBackgroundChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBackgroundFile(file);
            const previewUrl = URL.createObjectURL(file);
            setBackgroundPreview(previewUrl);
        }
    };

    // Xử lý lưu thay đổi
    const handleSave = async () => {
        try {
            setSaving(true);

            // Tạo FormData object để gửi cả text và file
            const submitFormData = new FormData();

            // Thêm các trường text
            Object.keys(formData).forEach(key => {
                submitFormData.append(key, formData[key]);
            });

            // Thêm các file nếu có
            if (logoFile) {
                submitFormData.append('logo', logoFile);
            }

            if (backgroundFile) {
                submitFormData.append('backgroundURL', backgroundFile);
            }

            const response = await updateStartup(startupId, submitFormData);

            if (response) {
                // Cập nhật state với dữ liệu mới
                setStartup(prev => ({
                    ...prev,
                    ...formData,
                    logo: logoPreview || prev.logo,
                    backgroundURL: backgroundPreview || prev.backgroundURL
                }));

                // Giải phóng URL của các preview
                if (logoFile) URL.revokeObjectURL(logoPreview);
                if (backgroundFile) URL.revokeObjectURL(backgroundPreview);

                toast.success("Cập nhật thông tin startup thành công!");
                setIsEditing(false);

                // Reset file state
                setLogoFile(null);
                setBackgroundFile(null);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            toast.error("Có lỗi xảy ra khi cập nhật thông tin!");
        } finally {
            setSaving(false);
        }
    };

    // Hủy chỉnh sửa
    const handleCancel = () => {
        // Khôi phục form data về giá trị ban đầu
        if (startup) {
            setFormData({
                startupName: startup.startupName || '',
                abbreviationName: startup.abbreviationName || '',
                description: startup.description || '',
                vision: startup.vision || '',
                mission: startup.mission || '',
                websiteURL: startup.websiteURL || '',
                email: startup.email || '',
            });

            // Reset file previews
            if (logoFile) URL.revokeObjectURL(logoPreview);
            if (backgroundFile) URL.revokeObjectURL(backgroundPreview);

            setLogoPreview(startup.logo || '');
            setBackgroundPreview(startup.backgroundURL || '');
            setLogoFile(null);
            setBackgroundFile(null);
        }
        setIsEditing(false);
    };

    // Hiển thị trạng thái với màu phù hợp
    const getStatusBadge = (status) => {
        const statusClasses = {
            'verified': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'rejected': 'bg-red-100 text-red-800',
            'default': 'bg-gray-100 text-gray-800'
        };

        const statusClass = statusClasses[status?.toLowerCase()] || statusClasses.default;

        return (
            <span className={`px-2 py-1 rounded-full text-sm ${statusClass}`}>
                {status === 'verified' && <FontAwesomeIcon icon={faCheck} className="mr-1" />}
                {status || 'N/A'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p>{error}</p>
            </div>
        );
    }

    if (!startup) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                <p>Không có thông tin startup nào được tìm thấy. Có thể bạn chưa tham gia hoặc tạo startup nào.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Thông tin Startup</h1>
                {!isEditing ? (
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                        onClick={() => setIsEditing(true)}
                    >
                        <FontAwesomeIcon icon={faPencilAlt} className="mr-2" />
                        Chỉnh sửa thông tin
                    </button>
                ) : (
                    <div className="flex space-x-2">
                        <button
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            <FontAwesomeIcon icon={faTimes} className="mr-2" />
                            Hủy
                        </button>
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Card chính */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Banner và Logo */}
                <div className="relative h-64 bg-gradient-to-r from-blue-500 to-indigo-600">
                    {/* Hiển thị background image hoặc preview */}
                    {backgroundPreview ? (
                        <img
                            src={backgroundPreview}
                            alt="Background"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-75"></div>
                    )}

                    {/* Nút thay đổi background khi đang ở chế độ edit */}
                    {isEditing && (
                        <div className="absolute top-4 right-4">
                            <input
                                type="file"
                                ref={backgroundInputRef}
                                onChange={handleBackgroundChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                onClick={() => backgroundInputRef.current.click()}
                                className="bg-white/80 hover:bg-white text-gray-800 px-4 py-2 rounded-lg flex items-center shadow-md transition-all"
                            >
                                <FontAwesomeIcon icon={faImage} className="mr-2" />
                                Thay đổi ảnh bìa
                            </button>
                        </div>
                    )}

                    {/* Logo area */}
                    <div className="absolute -bottom-20 left-8 border-4 border-white rounded-lg shadow-xl">
                        <div className="relative overflow-hidden w-36 h-36 bg-white rounded-lg">
                            {/* Hiển thị logo hoặc preview */}
                            <img
                                src={logoPreview || startup.logo || "https://via.placeholder.com/150"}
                                alt={startup.startupName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/150";
                                }}
                            />

                            {/* Nút thay đổi logo khi ở chế độ edit */}
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                                    <input
                                        type="file"
                                        ref={logoInputRef}
                                        onChange={handleLogoChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => logoInputRef.current.click()}
                                        className="bg-white/90 hover:bg-white text-gray-800 px-3 py-2 rounded-lg flex items-center text-sm"
                                    >
                                        <FontAwesomeIcon icon={faUpload} className="mr-2" />
                                        Thay logo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Phần nội dung */}
                <div className="pt-24 px-8 pb-8">
                    {/* Header với tên và trạng thái */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            {!isEditing ? (
                                <>
                                    <h2 className="text-3xl font-bold text-gray-800">{startup.startupName}</h2>
                                    {startup.abbreviationName && (
                                        <p className="text-gray-600 text-lg">{startup.abbreviationName}</p>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor="startupName" className="block text-sm font-medium text-gray-700">Tên Startup</label>
                                        <input
                                            type="text"
                                            id="startupName"
                                            name="startupName"
                                            value={formData.startupName}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="abbreviationName" className="block text-sm font-medium text-gray-700">Tên viết tắt</label>
                                        <input
                                            type="text"
                                            id="abbreviationName"
                                            name="abbreviationName"
                                            value={formData.abbreviationName}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            {getStatusBadge(startup.status)}
                        </div>
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-start">
                                    <FontAwesomeIcon icon={faInfoCircle} className="mt-1 text-blue-500 w-5 h-5" />
                                    <div className="ml-3 flex-1">
                                        <h3 className="font-semibold text-gray-800 text-lg mb-2">Mô tả</h3>
                                        {!isEditing ? (
                                            <p className="text-gray-700 whitespace-pre-wrap">{startup.description || "Chưa có mô tả"}</p>
                                        ) : (
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows={4}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Nhập mô tả về startup của bạn"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-start">
                                    <FontAwesomeIcon icon={faEye} className="mt-1 text-blue-500 w-5 h-5" />
                                    <div className="ml-3 flex-1">
                                        <h3 className="font-semibold text-gray-800 text-lg mb-2">Tầm nhìn</h3>
                                        {!isEditing ? (
                                            <p className="text-gray-700 whitespace-pre-wrap">{startup.vision || "Chưa có tầm nhìn"}</p>
                                        ) : (
                                            <textarea
                                                name="vision"
                                                value={formData.vision}
                                                onChange={handleInputChange}
                                                rows={4}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Nhập tầm nhìn của startup"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-start">
                                    <FontAwesomeIcon icon={faBullseye} className="mt-1 text-blue-500 w-5 h-5" />
                                    <div className="ml-3 flex-1">
                                        <h3 className="font-semibold text-gray-800 text-lg mb-2">Sứ mệnh</h3>
                                        {!isEditing ? (
                                            <p className="text-gray-700 whitespace-pre-wrap">{startup.mission || "Chưa có sứ mệnh"}</p>
                                        ) : (
                                            <textarea
                                                name="mission"
                                                value={formData.mission}
                                                onChange={handleInputChange}
                                                rows={4}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Nhập sứ mệnh của startup"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faSeedling} className="text-blue-500 w-5 h-5" />
                                    <div className="ml-3">
                                        <h3 className="font-semibold text-gray-800 text-lg">Giai đoạn</h3>
                                        <p className="text-gray-700 mt-1">Giai đoạn {startup.stageId || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 w-5 h-5" />
                                    <div className="ml-3">
                                        <h3 className="font-semibold text-gray-800 text-lg">Ngày thành lập</h3>
                                        <p className="text-gray-700 mt-1">{formatDate(startup.createAt)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-start">
                                    <FontAwesomeIcon icon={faGlobe} className="text-blue-500 w-5 h-5 mt-1" />
                                    <div className="ml-3 flex-1">
                                        <h3 className="font-semibold text-gray-800 text-lg">Website</h3>
                                        {!isEditing ? (
                                            startup.websiteURL ? (
                                                <a href={startup.websiteURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 block">
                                                    {startup.websiteURL}
                                                </a>
                                            ) : (
                                                <p className="text-gray-600 mt-1">Chưa có website</p>
                                            )
                                        ) : (
                                            <div className="mt-1">
                                                <input
                                                    type="text"
                                                    name="websiteURL"
                                                    value={formData.websiteURL}
                                                    onChange={handleInputChange}
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="https://example.com"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-start">
                                    <FontAwesomeIcon icon={faEnvelope} className="text-blue-500 w-5 h-5 mt-1" />
                                    <div className="ml-3 flex-1">
                                        <h3 className="font-semibold text-gray-800 text-lg">Email</h3>
                                        {!isEditing ? (
                                            startup.email ? (
                                                <a href={`mailto:${startup.email}`} className="text-blue-600 hover:underline mt-1 block">
                                                    {startup.email}
                                                </a>
                                            ) : (
                                                <p className="text-gray-600 mt-1">Chưa có email</p>
                                            )
                                        ) : (
                                            <div className="mt-1">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="contact@example.com"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartupInfo; 