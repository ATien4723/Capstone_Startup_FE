import { useState, useEffect, useRef } from "react";
import { Link, useParams } from 'react-router-dom';

import { changePassword, getAccountInfo, updateProfile } from "@/apis/accountService";
import Navbar from '@components/Navbar/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const tabs = [
    {
        label: "Profile"
    },
    {
        label: "Đăng nhập và bảo mật",
    },
];

const profileSchema = Yup.object().shape({
    FirstName: Yup.string().required('First name is required'),
    LastName: Yup.string().required('Last name is required'),
    Gender: Yup.string().oneOf(['Male', 'Female', 'Other'], 'Invalid gender').required('Gender is required'),
    Dob: Yup.date().required('Date of birth is required'),
    Address: Yup.string().required('Address is required'),
    PhoneNumber: Yup.string().required('Phone number is required').matches(/^\d{10,11}$/, 'Invalid phone number'),
    AvatarUrl: Yup.string().url('Invalid URL').nullable(),
});

const Setting = () => {
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState(0); // 0: Đăng nhập và bảo mật
    const [profile, setProfile] = useState(null);
    const [profileMsg, setProfileMsg] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [fileError, setFileError] = useState("");
    const fileInputRef = useRef();
    // Tự động lấy accountId từ localStorage
    const { accountId } = useParams();

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
                                            }}
                                            validationSchema={profileSchema}
                                            enableReinitialize
                                            onSubmit={async (values, { setSubmitting }) => {
                                                setProfileMsg('');
                                                try {
                                                    await updateProfile(accountId, values);
                                                    setProfileMsg('Cập nhật thành công!');
                                                } catch (err) {
                                                    setProfileMsg('Cập nhật thất bại!');
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
                                                            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
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
                        {/* Đăng nhập và bảo mật */}
                        {activeTab === 1 && !showChangePassword && (
                            <>
                                <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-center md:text-left">Quyền truy cập vào tài khoản</h2>
                                <ul className="divide-y divide-gray-200">
                                    <li className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-2">
                                        <span>Địa chỉ email</span>
                                        <span className="text-gray-500 break-all">tienlahe176488@fpt.edu.vn</span>
                                    </li>
                                    <li className="flex justify-between items-center py-4 cursor-pointer hover:bg-gray-50">
                                        <span>Số điện thoại</span>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </li>
                                    <li className="flex justify-between items-center py-4 cursor-pointer hover:bg-gray-50" onClick={() => setShowChangePassword(true)}>
                                        <span>Mật khẩu</span>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </li>
                                    <li className="flex justify-between items-center py-4 cursor-pointer hover:bg-gray-50">
                                        <span>Xác thực</span>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </li>
                                </ul>
                            </>
                        )}
                        {/* Đổi mật khẩu */}
                        {activeTab === 1 && showChangePassword && (
                            <>
                                <div className="flex items-center mb-6">
                                    <button type="button" className="flex items-center text-gray-600 hover:text-green-600" onClick={() => setShowChangePassword(false)}>
                                        <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
                                        <span className="text-base font-medium">Trở lại</span>
                                    </button>
                                </div>
                                <form className="space-y-4" onSubmit={handleChangePassword}>
                                    <div>
                                        <label className="block">Mật khẩu cũ</label>
                                        <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block">Mật khẩu mới</label>
                                        <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block">Xác nhận mật khẩu mới</label>
                                        <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto" disabled={loading}>{loading ? "Đang đổi..." : "Đổi mật khẩu"}</button>
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