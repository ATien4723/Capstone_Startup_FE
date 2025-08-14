import { useState, useEffect, useRef } from 'react';
import {
    getStartupById,
    getStartupIdByAccountId,
    updateStartup,
    getPitchingsByStartupAndType,
    createStartupPitching,
    updateStartupPitching,
    deleteStartupPitching,
    getStartupMembers
} from '@/apis/startupService';
import { getUserId } from '@/apis/authService';
import { toast } from 'react-toastify';

const useStartupInfo = () => {
    const [startup, setStartup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accountId, setAccountId] = useState(null);
    const [startupId, setStartupId] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [isFounder, setIsFounder] = useState(false);

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
        stageId: '',
    });

    // State cho file uploads
    const [logoFile, setLogoFile] = useState(null);
    const [backgroundFile, setBackgroundFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [backgroundPreview, setBackgroundPreview] = useState('');

    const [saving, setSaving] = useState(false);

    // State cho pitching
    const [pitchings, setPitchings] = useState([]);
    const [loadingPitchings, setLoadingPitchings] = useState(false);
    const [addPitchingMode, setAddPitchingMode] = useState(false);
    const [currentPitchingType, setCurrentPitchingType] = useState('PDF'); // PDF hoặc Video
    const [pitchingFile, setPitchingFile] = useState(null);

    // State cho PDF viewer
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);

    // State cho Video player
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);

    // Mở PDF viewer
    const handleOpenPdfViewer = (pdfUrl) => {
        setSelectedPdf(pdfUrl);
        setIsPdfViewerOpen(true);
    };

    // Đóng PDF viewer
    const handleClosePdfViewer = () => {
        setIsPdfViewerOpen(false);
        setSelectedPdf(null);
    };

    // Mở Video player
    const handleOpenVideoPlayer = (videoUrl) => {
        setSelectedVideo(videoUrl);
        setIsVideoPlayerOpen(true);
    };

    // Đóng Video player
    const handleCloseVideoPlayer = () => {
        setIsVideoPlayerOpen(false);
        setSelectedVideo(null);
    };

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
                        stageId: response.data.stageId || '',
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

    // Lấy thông tin role của user hiện tại trong startup
    useEffect(() => {
        const fetchCurrentUserRole = async () => {
            if (!startupId || !accountId) return;

            try {
                const membersResponse = await getStartupMembers(startupId);
                if (membersResponse) {
                    const currentMember = membersResponse.find(member =>
                        member.accountId == accountId
                    );

                    // console.log("Current member:", currentMember);

                    if (currentMember) {
                        setCurrentUserRole(currentMember.roleName);
                        setIsFounder(currentMember.roleName?.toLowerCase() === 'founder');
                    }
                }
            } catch (err) {
                console.error("Lỗi khi lấy thông tin role:", err);
            }
        };

        fetchCurrentUserRole();
    }, [startupId, accountId]);

    // Lấy thông tin pitching của startup
    useEffect(() => {
        const fetchPitchings = async () => {
            if (!startupId) return;

            try {
                setLoadingPitchings(true);
                // Lấy tất cả pitching (không chỉ định type để lấy cả PDF và Video)
                const response = await getPitchingsByStartupAndType(startupId);

                if (response) {
                    setPitchings(response);
                }
            } catch (err) {
                console.error("Lỗi khi lấy thông tin pitching:", err);
                toast.error("Không thể tải thông tin tài liệu pitching");
            } finally {
                setLoadingPitchings(false);
            }
        };

        fetchPitchings();
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
                submitFormData.append('Background', backgroundFile);
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
                stageId: startup.stageId || '',
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

        return {
            status,
            statusClass
        };
    };

    // Xử lý tải lên file pitching (PDF hoặc Video)
    const handlePitchingFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Kiểm tra phù hợp với loại đã chọn
        if (currentPitchingType === 'PDF' && !file.type.includes('pdf')) {
            toast.error('Vui lòng chọn file PDF');
            return;
        }

        if (currentPitchingType === 'Video' && !file.type.includes('video')) {
            toast.error('Vui lòng chọn file video');
            return;
        }

        setPitchingFile(file);
        toast.info(`Đã chọn file ${file.name}`);
    };

    // Tạo mới pitching
    const handleCreatePitching = async () => {
        if (!pitchingFile || !startupId) return;

        try {
            setLoadingPitchings(true);

            const pitchingData = new FormData();
            pitchingData.append('StartupId', startupId);
            // Không cần thêm Type vào FormData, sẽ dựa vào loại file để xác định
            pitchingData.append('File', pitchingFile);

            const response = await createStartupPitching(pitchingData);

            if (response && response.data) {
                toast.success(`Đã tạo tài liệu pitching ${currentPitchingType} thành công!`);

                // Cập nhật danh sách pitching
                const updatedPitchings = await getPitchingsByStartupAndType(startupId);
                if (updatedPitchings && updatedPitchings.data) {
                    setPitchings(updatedPitchings.data);
                }

                // Reset form
                setPitchingFile(null);
                setAddPitchingMode(false);
            }
        } catch (err) {
            console.error("Lỗi khi tạo pitching:", err);
            toast.error(`Không thể tạo tài liệu pitching ${currentPitchingType}`);
        } finally {
            setLoadingPitchings(false);
        }
    };

    // Cập nhật pitching
    const handleUpdatePitching = async (pitchingId, file) => {
        if (!file || !pitchingId) return;

        try {
            setLoadingPitchings(true);

            const pitchingData = new FormData();
            pitchingData.append('PitchingId', pitchingId);
            pitchingData.append('File', file);

            const response = await updateStartupPitching(pitchingData);

            if (response) {
                toast.success(`Đã cập nhật tài liệu pitching thành công!`);

                // Cập nhật danh sách pitching
                const updatedPitchings = await getPitchingsByStartupAndType(startupId);
                if (updatedPitchings && updatedPitchings.data) {
                    setPitchings(updatedPitchings.data);
                }
            }
        } catch (err) {
            console.error("Lỗi khi cập nhật pitching:", err);
            toast.error(`Không thể cập nhật tài liệu pitching`);
        } finally {
            setLoadingPitchings(false);
        }
    };

    // Xóa pitching
    const handleDeletePitching = async (pitchingId) => {
        if (!pitchingId) return;

        // Xác nhận từ người dùng trước khi xóa
        if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này không?")) {
            return;
        }

        try {
            setLoadingPitchings(true);

            await deleteStartupPitching(pitchingId);
            toast.success("Đã xóa tài liệu thành công!");

            // Cập nhật danh sách pitching sau khi xóa
            setPitchings(pitchings.filter(p => p.pitchingId !== pitchingId));
        } catch (err) {
            console.error("Lỗi khi xóa pitching:", err);
            toast.error("Không thể xóa tài liệu");
        } finally {
            setLoadingPitchings(false);
        }
    };

    return {
        startup,
        loading,
        error,
        isEditing,
        formData,
        logoInputRef,
        backgroundInputRef,
        logoPreview,
        backgroundPreview,
        saving,
        formatDate,
        handleInputChange,
        handleLogoChange,
        handleBackgroundChange,
        handleSave,
        handleCancel,
        getStatusBadge,
        setIsEditing,
        // Thêm thông tin role
        isFounder,
        // Thêm các trường liên quan đến pitching
        pitchings,
        loadingPitchings,
        addPitchingMode,
        setAddPitchingMode,
        currentPitchingType,
        setCurrentPitchingType,
        pitchingFile,
        setPitchingFile,
        handlePitchingFileChange,
        handleCreatePitching,
        handleDeletePitching,
        handleUpdatePitching,
        // Thêm các trường liên quan đến PDF viewer
        selectedPdf,
        isPdfViewerOpen,
        handleOpenPdfViewer,
        handleClosePdfViewer,
        // Thêm các trường liên quan đến Video player
        selectedVideo,
        isVideoPlayerOpen,
        handleOpenVideoPlayer,
        handleCloseVideoPlayer
    };
};

export default useStartupInfo; 