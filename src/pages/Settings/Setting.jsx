import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { changePassword, getAccountInfo, updateProfile, verifyCCCD } from "@/apis/accountService";
import { getUserId } from "@/apis/authService";
import Navbar from '@components/Navbar/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCamera, faIdCard, faUser, faCheck, faTimes, faRedo } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Webcam from 'react-webcam';

const tabs = [
    {
        label: "Profile"
    },
    {
        label: "Login & Security",
    },
];

const profileSchema = Yup.object().shape({
    FirstName: Yup.string().required('First name is required'),
    LastName: Yup.string().required('Last name is required'),
    Gender: Yup.string()
        .oneOf(['Male', 'Female', 'Other'], 'Invalid gender')
        .required('Gender is required'),
    Dob: Yup.date()
        .required('Date of birth is required')
        .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18)), 'You must be at least 18 years old'),
    Address: Yup.string().required('Address is required'),
    PhoneNumber: Yup.string()
        .required('Phone number is required')
        .matches(/^\d{10,11}$/, 'Invalid phone number'),
    AvatarUrl: Yup.string().url('Invalid URL').nullable(),
});

// Thêm schema xác thực cho form CCCD
const cccdSchema = Yup.object({
    fullName: Yup.string().required('Họ tên là bắt buộc'),
    cccdNumber: Yup.string()
        .required('Số CCCD là bắt buộc')
        .matches(/^\d{12}$/, 'Số CCCD phải có 12 chữ số'),
    dateOfBirth: Yup.string()
        .required('Ngày sinh là bắt buộc')
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày sinh không hợp lệ (YYYY-MM-DD)'),
    gender: Yup.string().required('Giới tính là bắt buộc'),
    address: Yup.string().required('Địa chỉ là bắt buộc'),
    issueDate: Yup.string()
        .required('Ngày cấp là bắt buộc')
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày cấp không hợp lệ (YYYY-MM-DD)'),
    issuePlace: Yup.string().required('Nơi cấp là bắt buộc'),
});

const Setting = () => {
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState(0); // 0: Login & Security
    const [profile, setProfile] = useState(null);
    const [profileMsg, setProfileMsg] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [fileError, setFileError] = useState("");
    const fileInputRef = useRef();
    const [showCCCDVerify, setShowCCCDVerify] = useState(false);
    // Tự động lấy accountId từ localStorage
    const accountId = getUserId();

    // Thêm state cho xác thực CCCD
    const [cccdFrontFile, setCccdFrontFile] = useState(null);
    const [cccdBackFile, setCccdBackFile] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    const [cccdFrontPreview, setCccdFrontPreview] = useState(null);
    const [cccdBackPreview, setCccdBackPreview] = useState(null);
    const [selfiePreview, setSelfiePreview] = useState(null);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [verifyResult, setVerifyResult] = useState(null);
    const [extractedInfo, setExtractedInfo] = useState(null);
    const cccdFrontRef = useRef(null);
    const cccdBackRef = useRef(null);
    const selfieRef = useRef(null);

    // Thêm state cho webcam
    const [showWebcam, setShowWebcam] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    // Hàm mở webcam
    const openCamera = () => {
        setShowWebcam(true);
    };

    // Hàm đóng webcam
    const closeCamera = () => {
        setShowWebcam(false);
    };

    // Hàm chụp ảnh từ webcam
    const capturePhoto = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setSelfieFile(dataURLtoFile(imageSrc, "selfie.jpg"));
            setSelfiePreview(imageSrc);
            setShowWebcam(false);
        }
    }, [webcamRef]);

    // Hàm chuyển đổi dataURL thành File
    const dataURLtoFile = (dataurl, filename) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    // Hàm xử lý khi chọn file
    const handleFileChange = (e, setFile, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Hàm xử lý khi click vào vùng upload
    const handleUploadClick = (ref) => {
        if (ref.current) {
            ref.current.click();
        }
    };

    // Hàm xử lý xác thực CCCD
    const handleVerifyCCCD = async () => {
        if (!cccdFrontFile || !cccdBackFile || !selfieFile) {
            toast.error('Vui lòng tải lên đầy đủ ảnh CCCD mặt trước, mặt sau và ảnh selfie');
            return;
        }

        setVerifyLoading(true);
        setVerifyResult(null);
        setExtractedInfo(null);

        try {
            const formData = new FormData();
            formData.append('CccdFront', cccdFrontFile);
            formData.append('CccdBack', cccdBackFile);
            formData.append('Selfie', selfieFile);

            const response = await verifyCCCD(formData);
            setVerifyResult(response);

            if (response.extracted) {
                setExtractedInfo(response.extracted);
            }

            if (response.isFaceMatched) {
                toast.success('Xác thực CCCD thành công!');
            } else {
                toast.warning('Xác thực CCCD không thành công. Vui lòng kiểm tra lại ảnh.');
            }
        } catch (error) {
            console.error('Lỗi xác thực CCCD:', error);
            toast.error(error.response?.data?.error || 'Lỗi xác thực CCCD. Vui lòng thử lại sau.');
        } finally {
            setVerifyLoading(false);
        }
    };

    // Lấy thông tin profile khi vào tab Profile
    useEffect(() => {
        if (activeTab === 0 && accountId) {
            setProfileLoading(true);
            getAccountInfo(accountId)
                .then(res => setProfile(res))
                .catch(() => setProfileMsg('Không thể tải thông tin tài khoản'))
                .finally(() => setProfileLoading(false));
        }
    }, [activeTab, accountId]);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        try {
            await changePassword(accountId, {
                oldPassword,
                newPassword,
                confirmPassword,
            });
            setMessage("Đổi mật khẩu thành công!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setMessage(error?.response?.data || "Đổi mật khẩu thất bại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex flex-col mt-20 md:flex-row w-full max-w-8xl mx-auto px-2 md:px-6 py-6 flex-1 gap-6">
                {/* Sidebar/tab dọc ở desktop, tab ngang ở mobile */}
                <nav className="flex md:flex-col flex-row md:w-64 w-full bg-white rounded-xl shadow md:shadow-none md:rounded-none md:border-r p-2 md:p-6 gap-2 md:gap-4 mb-4 md:mb-0 items-start">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">S</div>
                        <span className="text-2xl md:text-3xl font-bold">Cài đặt</span>
                    </div>
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.label}
                            className={`relative flex items-center px-3 py-2 text-base font-medium whitespace-nowrap transition-colors
                                ${activeTab === idx ? 'text-green-700' : 'text-gray-700 hover:text-green-700'}
                                md:justify-start justify-center w-full md:w-auto
                            `}
                            onClick={() => setActiveTab(idx)}
                        >
                            {tab.icon}
                            {tab.label}
                            {/* Gạch chân ngang ở mobile, gạch dọc ở desktop */}
                            {activeTab === idx && (
                                <span
                                    className={`absolute md:left-0 md:top-0 md:bottom-0 md:w-1 md:h-full md:bg-green-600 md:rounded-full
                                        left-0 right-0 -bottom-1 h-1 bg-green-600 rounded-full md:hidden
                                    `}
                                    style={
                                        window.innerWidth >= 768
                                            ? { left: 0, top: 0, bottom: 0, width: '4px', height: '100%' }
                                            : { left: 0, right: 0, bottom: '-4px', height: '4px', width: '100%' }
                                    }
                                ></span>
                            )}
                        </button>
                    ))}
                </nav>
                {/* Main Content */}
                <div className="flex-1">

                    <div className="bg-white rounded-xl shadow p-4 sm:p-6 md:p-8 w-full max-w-full mx-auto">
                        {/* Profile Tab */}
                        {activeTab === 0 && (
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Left: Avatar + Info */}
                                <div className="flex flex-col items-center md:w-1/3 w-full border-r md:border-r md:pr-8 mb-6 md:mb-0">
                                    <img
                                        src={avatarPreview || profile?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt="Avatar"
                                        className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 object-cover shadow"
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={e => {
                                            const file = e.target.files[0];
                                            setFileError("");

                                            if (file) {
                                                // Kiểm tra kích thước file (giới hạn 5MB)
                                                if (file.size > 5 * 1024 * 1024) {
                                                    setFileError("File không được vượt quá 5MB");
                                                    return;
                                                }

                                                // Kiểm tra định dạng file
                                                const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
                                                if (!validTypes.includes(file.type)) {
                                                    setFileError("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)");
                                                    return;
                                                }

                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setAvatarPreview(reader.result);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <button
                                        className="text-sm text-gray-600 underline mb-4"
                                        type="button"
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                    >
                                        Change your profile picture here
                                    </button>
                                    {fileError && <div className="text-red-500 text-sm mb-2">{fileError}</div>}
                                    <div className="text-lg font-bold mb-1" disabled>{profile?.firstName || ''}</div>
                                    <div className="text-gray-600 text-sm">Status: <span className="font-medium text-black">{profile?.status || ''}</span></div>
                                </div>
                                {/* Right: Formik Form */}
                                <div className="flex-1">
                                    {profileLoading ? (
                                        <div className="text-center text-gray-500">Đang tải...</div>
                                    ) : profile ? (
                                        <Formik
                                            initialValues={{
                                                FirstName: profile.firstName || '',
                                                LastName: profile.lastName || '',
                                                Gender: profile.gender || '',
                                                Dob: profile.dob ? profile.dob.split('T')[0] : '',
                                                Address: profile.address || '',
                                                PhoneNumber: profile.phoneNumber || '',
                                                AvatarUrl: avatarPreview || profile.avatarUrl || '',
                                                CCCDNumber: profile.cccd || '012345678910',
                                            }}
                                            validationSchema={profileSchema}
                                            enableReinitialize
                                            onSubmit={async (values, { setSubmitting }) => {
                                                setProfileMsg('');
                                                try {
                                                    await updateProfile(accountId, values);
                                                    setProfileMsg('Update successful!');
                                                } catch (err) {
                                                    setProfileMsg('Update failed!');
                                                }
                                                setSubmitting(false);
                                            }}
                                        >
                                            {({ isSubmitting, setFieldValue }) => (
                                                <Form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="flex flex-col">
                                                        <label className="font-medium mb-1">First Name <span className="text-red-500">*</span></label>
                                                        <Field name="FirstName" disabled className="bg-white border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-black disabled:opacity-50" />
                                                        <ErrorMessage name="FirstName" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <label className="font-medium mb-1">Last Name <span className="text-red-500">*</span></label>
                                                        <Field name="LastName" className="bg-white border rounded px-3 py-2" />
                                                        <ErrorMessage name="LastName" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <label className="font-medium mb-1">Gender <span className="text-red-500">*</span></label>
                                                        <Field as="select" name="Gender" className="bg-white border rounded px-3 py-2">
                                                            <option value="">Select gender</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Other">Other</option>
                                                        </Field>
                                                        <ErrorMessage name="Gender" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <label className="font-medium mb-1">Date of Birth <span className="text-red-500">*</span></label>
                                                        <Field name="Dob" type="date" className="bg-white border rounded px-3 py-2" />
                                                        <ErrorMessage name="Dob" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                    <div className="flex flex-col md:col-span-2">
                                                        <label className="font-medium mb-1">Address <span className="text-red-500">*</span></label>
                                                        <Field name="Address" className="bg-white border rounded px-3 py-2" />
                                                        <ErrorMessage name="Address" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                    <div className="flex flex-col md:col-span-2">
                                                        <label className="font-medium mb-1">Phone Number <span className="text-red-500">*</span></label>
                                                        <Field name="PhoneNumber" className="bg-white border rounded px-3 py-2" />
                                                        <ErrorMessage name="PhoneNumber" component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                    <div className="flex flex-col md:col-span-2">
                                                        <label className="font-medium mb-1">ID Card Number</label>
                                                        <Field
                                                            name="CCCDNumber"
                                                            className="bg-gray-100 border rounded px-3 py-2 text-black opacity-70"
                                                            disabled
                                                        />
                                                    </div>
                                                    <div className="flex flex-col md:col-span-2">
                                                        <label className="font-medium mb-1">Avatar URL</label>
                                                        <Field name="AvatarUrl" className="bg-white border rounded px-3 py-2" />
                                                        <ErrorMessage name="AvatarUrl" component="div" className="text-red-500 text-sm" />
                                                        {/* Sync preview to formik field */}
                                                        {avatarPreview && (
                                                            <input type="hidden" name="AvatarUrl" value={avatarPreview} />
                                                        )}
                                                    </div>
                                                    <div className="md:col-span-2 flex gap-2 mt-2">
                                                        <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                                            {isSubmitting ? 'Saving...' : 'Save'}
                                                        </button>
                                                        {profileMsg && <div className="text-sm text-green-600 mt-2">{profileMsg}</div>}
                                                    </div>
                                                </Form>
                                            )}
                                        </Formik>
                                    ) : (
                                        <div className="text-center text-red-500">{profileMsg || 'Không có dữ liệu'}</div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Login & Security */}
                        {activeTab === 1 && !showChangePassword && !showCCCDVerify && (
                            <>
                                <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-center md:text-left">Account Access</h2>
                                <ul className="divide-y divide-gray-200">
                                    <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-2">
                                        <span>Email Address</span>
                                        <span className="text-gray-500 break-all">tienlahe176488@fpt.edu.vn</span>
                                    </li>
                                    <li className="flex justify-between items-center py-4 cursor-pointer hover:bg-gray-50">
                                        <span>Phone Number</span>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </li>
                                    <li className="flex justify-between items-center py-4 cursor-pointer hover:bg-gray-50" onClick={() => setShowChangePassword(true)}>
                                        <span>Password</span>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </li>
                                    <li className="flex justify-between items-center py-4 cursor-pointer hover:bg-gray-50" onClick={() => setShowCCCDVerify(true)}>
                                        <span>Identity Verification</span>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </li>
                                </ul>
                            </>
                        )}
                        {/* Giao diện xác thực CCCD */}
                        {activeTab === 1 && showCCCDVerify && (
                            <div className="flex flex-col items-center justify-center gap-8 py-8">
                                <button
                                    type="button"
                                    className="flex items-center text-gray-600 hover:text-green-600 mb-6 self-start"
                                    onClick={() => setShowCCCDVerify(false)}
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
                                    <span className="text-base font-medium">Back</span>
                                </button>

                                <h2 className="text-xl font-semibold mb-4">Identity Verification</h2>
                                <p className="text-gray-600 mb-6 text-center max-w-2xl">
                                    Để xác thực danh tính, vui lòng tải lên ảnh CCCD/CMND mặt trước, mặt sau và chụp ảnh selfie của bạn.
                                    Hệ thống sẽ tự động trích xuất thông tin từ ảnh CCCD và xác thực danh tính của bạn.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
                                    {/* Upload CCCD mặt trước */}
                                    <div
                                        className="flex flex-col items-center border-2 border-dashed border-blue-200 rounded-lg bg-blue-50 p-6 cursor-pointer hover:border-blue-400 transition"
                                        onClick={() => handleUploadClick(cccdFrontRef)}
                                    >
                                        {cccdFrontPreview ? (
                                            <div className="relative w-full h-48 mb-2">
                                                <img
                                                    src={cccdFrontPreview}
                                                    alt="CCCD mặt trước"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                                <button
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCccdFrontFile(null);
                                                        setCccdFrontPreview(null);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faIdCard} className="text-4xl text-blue-400 mb-4" />
                                                <span className="font-semibold text-center mb-1">CCCD mặt trước</span>
                                            </>
                                        )}
                                        <span className="text-xs text-gray-500 text-center">(JPG, PNG, dưới 10MB)</span>
                                        <input
                                            type="file"
                                            ref={cccdFrontRef}
                                            accept="image/png, image/jpeg"
                                            className="hidden"
                                            onChange={(e) => handleFileChange(e, setCccdFrontFile, setCccdFrontPreview)}
                                        />
                                    </div>

                                    {/* Upload CCCD mặt sau */}
                                    <div
                                        className="flex flex-col items-center border-2 border-dashed border-blue-200 rounded-lg bg-blue-50 p-6 cursor-pointer hover:border-blue-400 transition"
                                        onClick={() => handleUploadClick(cccdBackRef)}
                                    >
                                        {cccdBackPreview ? (
                                            <div className="relative w-full h-48 mb-2">
                                                <img
                                                    src={cccdBackPreview}
                                                    alt="CCCD mặt sau"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                                <button
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCccdBackFile(null);
                                                        setCccdBackPreview(null);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faIdCard} className="text-4xl text-blue-400 mb-4" />
                                                <span className="font-semibold text-center mb-1">CCCD mặt sau</span>
                                            </>
                                        )}
                                        <span className="text-xs text-gray-500 text-center">(JPG, PNG, dưới 10MB)</span>
                                        <input
                                            type="file"
                                            ref={cccdBackRef}
                                            accept="image/png, image/jpeg"
                                            className="hidden"
                                            onChange={(e) => handleFileChange(e, setCccdBackFile, setCccdBackPreview)}
                                        />
                                    </div>

                                    {/* Upload ảnh selfie hoặc chụp trực tiếp */}
                                    <div className="flex flex-col items-center border-2 border-dashed border-blue-200 rounded-lg bg-blue-50 p-6 hover:border-blue-400 transition">
                                        {showWebcam ? (
                                            <div className="relative w-full h-48">
                                                <Webcam
                                                    ref={webcamRef}
                                                    audio={false}
                                                    screenshotFormat="image/jpeg"
                                                    videoConstraints={{
                                                        width: 480,
                                                        height: 480,
                                                        facingMode: "user"
                                                    }}
                                                    mirrored={true}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                                <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-4">
                                                    <button
                                                        type="button"
                                                        className="bg-red-500/80 hover:bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                                                        onClick={closeCamera}
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="bg-blue-500/80 hover:bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                                                        onClick={capturePhoto}
                                                    >
                                                        <FontAwesomeIcon icon={faCamera} className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : selfiePreview ? (
                                            <div className="relative w-full h-48 mb-2">
                                                <img
                                                    src={selfiePreview}
                                                    alt="Ảnh selfie"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                                <div className="absolute top-2 right-2 flex space-x-2">
                                                    <button
                                                        className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelfieFile(null);
                                                            setSelfiePreview(null);
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openCamera();
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faRedo} className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center w-full">
                                                <FontAwesomeIcon icon={faUser} className="text-4xl text-blue-400 mb-4" />
                                                <span className="font-semibold text-center mb-1">Ảnh selfie</span>
                                                <span className="text-xs text-gray-500 text-center mb-4">(Chụp ảnh hoặc tải lên)</span>

                                                <div className="flex space-x-4 mt-2">
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center"
                                                        onClick={openCamera}
                                                    >
                                                        <FontAwesomeIcon icon={faCamera} className="mr-1" /> Chụp ảnh
                                                    </button>

                                                    {/* <label className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors flex items-center cursor-pointer">
                                                        <FontAwesomeIcon icon={faUser} className="mr-1" /> Tải lên
                                                        <input
                                                            type="file"
                                                            ref={selfieRef}
                                                            accept="image/png, image/jpeg"
                                                            className="hidden"
                                                            onChange={(e) => handleFileChange(e, setSelfieFile, setSelfiePreview)}
                                                        />
                                                    </label> */}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Nút xác thực */}
                                <div className="w-full max-w-4xl">
                                    <button
                                        onClick={handleVerifyCCCD}
                                        disabled={!cccdFrontFile || !cccdBackFile || !selfieFile || verifyLoading}
                                        className={`w-full py-3 rounded-lg font-medium transition-colors ${!cccdFrontFile || !cccdBackFile || !selfieFile || verifyLoading
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        {verifyLoading ? 'Đang xác thực...' : 'Xác thực danh tính'}
                                    </button>
                                </div>

                                {/* Hiển thị kết quả xác thực */}
                                {verifyResult && (
                                    <div className="w-full max-w-4xl mt-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                                        <h3 className="text-lg font-semibold mb-4">Kết quả xác thực</h3>

                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${verifyResult.isFaceMatched ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    <FontAwesomeIcon icon={verifyResult.isFaceMatched ? faCheck : faTimes} />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Xác thực khuôn mặt</p>
                                                    <p className="text-sm text-gray-600">
                                                        {verifyResult.isFaceMatched
                                                            ? 'Khuôn mặt trong ảnh selfie khớp với ảnh trên CCCD'
                                                            : 'Khuôn mặt trong ảnh selfie không khớp với ảnh trên CCCD'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hiển thị thông tin trích xuất từ CCCD */}
                                        {extractedInfo && (
                                            <div className="mt-6">
                                                <h4 className="font-medium mb-3">Thông tin trích xuất từ CCCD:</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                                    <div>
                                                        <p className="text-sm text-gray-500">Họ và tên:</p>
                                                        <p className="font-medium">{extractedInfo.fullName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Số CCCD:</p>
                                                        <p className="font-medium">{extractedInfo.cccdNumber}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Ngày sinh:</p>
                                                        <p className="font-medium">{extractedInfo.dateOfBirth}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Giới tính:</p>
                                                        <p className="font-medium">{extractedInfo.gender}</p>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <p className="text-sm text-gray-500">Địa chỉ:</p>
                                                        <p className="font-medium">{extractedInfo.address}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Ngày cấp:</p>
                                                        <p className="font-medium">{extractedInfo.issueDate}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Nơi cấp:</p>
                                                        <p className="font-medium">{extractedInfo.issuePlace}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Đổi mật khẩu */}
                        {activeTab === 1 && showChangePassword && !showCCCDVerify && (
                            <>
                                <div className="flex items-center mb-6">
                                    <button type="button" className="flex items-center text-gray-600 hover:text-green-600" onClick={() => setShowChangePassword(false)}>
                                        <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
                                        <span className="text-base font-medium">Back</span>
                                    </button>
                                </div>
                                <form className="space-y-4" onSubmit={handleChangePassword}>
                                    <div>
                                        <label className="block">Old Password</label>
                                        <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block">New Password</label>
                                        <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block">Confirm New Password</label>
                                        <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto" disabled={loading}>{loading ? "Changing..." : "Change Password"}</button>
                                    </div>
                                    {message && <div className="text-sm mt-2 text-red-500">{message}</div>}
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Setting;
