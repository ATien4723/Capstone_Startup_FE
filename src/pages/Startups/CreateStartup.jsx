import React, { useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import Navbar from '@components/Navbar/Navbar';


const stages = [
    { id: 1, name: 'Idea' },
    { id: 2, name: 'Seed' },
    { id: 3, name: 'Growth' },
    { id: 4, name: 'Expansion' },
];

const categories = [
    { id: 1, name: 'Fintech' },
    { id: 2, name: 'Edtech' },
    { id: 3, name: 'Healthtech' },
    { id: 4, name: 'E-commerce' },
];

const validationSchema = Yup.object({
    StartupName: Yup.string().required('Startup Name is required'),
    AbbreviationName: Yup.string().required('Abbreviation Name is required'),
    Description: Yup.string().required('Description is required'),
    Vision: Yup.string().required('Vision is required'),
    Mission: Yup.string().required('Mission is required'),
    WebsiteUrl: Yup.string().url('Invalid URL').required('Website URL is required'),
    Email: Yup.string().email('Invalid email').required('Email is required'),
    StageId: Yup.string().required('Stage is required'),
    CreatorAccountId: Yup.number().typeError('Creator Account ID is required').required('Creator Account ID is required'),
    CategoryIds: Yup.array().min(1, 'Select at least 1 category').required('Category is required'),
});

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function CreateStartup() {
    const [showInviteInput, setShowInviteInput] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteEmails, setInviteEmails] = useState([]);
    const [inviteError, setInviteError] = useState('');
    const inviteInputRef = useRef(null);

    const formik = useFormik({
        initialValues: {
            StartupName: '',
            AbbreviationName: '',
            Description: '',
            Vision: '',
            Mission: '',
            Logo: null,
            BackgroundUrl: null,
            WebsiteUrl: '',
            Email: '',
            StageId: '',
            CreatorAccountId: '',
            InviteAccountIds: [],
            CategoryIds: [],
        },
        validationSchema,
        onSubmit: (values, { resetForm }) => {
            const formData = new FormData();
            Object.entries({ ...values, InviteAccountIds: inviteEmails }).forEach(([key, value]) => {
                if (key === 'Logo' || key === 'BackgroundUrl') {
                    if (value) formData.append(key, value);
                } else if (key === 'CategoryIds') {
                    value.forEach(v => formData.append('CategoryIds', v));
                } else if (key === 'InviteAccountIds') {
                    value.forEach(v => formData.append('InviteAccountIds', v));
                } else {
                    formData.append(key, value);
                }
            });
            // TODO: Gửi formData lên API
            alert('Startup created!');
            resetForm();
            setInviteEmails([]);
        },
    });

    // Thêm email khi nhấn Enter, dấu phẩy hoặc blur
    const handleInviteInput = (e) => {
        if (e.key === 'Enter' || e.key === ',' || e.type === 'blur') {
            e.preventDefault();
            const email = inviteEmail.trim().replace(/,$/, '');
            if (!email) return;
            if (!validateEmail(email)) {
                setInviteError('Email không hợp lệ');
                return;
            }
            if (inviteEmails.includes(email)) {
                setInviteError('Email đã tồn tại');
                return;
            }
            setInviteEmails([...inviteEmails, email]);
            setInviteEmail('');
            setInviteError('');
        }
    };
    // Thêm email khi paste nhiều email
    const handlePasteInvite = (e) => {
        const pasted = e.clipboardData.getData('text');
        const emails = pasted.split(/,|\s/).map(x => x.trim()).filter(Boolean);
        let added = false;
        let error = '';
        emails.forEach(email => {
            if (!validateEmail(email)) error = 'Có email không hợp lệ';
            else if (!inviteEmails.includes(email)) {
                setInviteEmails(prev => [...prev, email]);
                added = true;
            }
        });
        if (added) setInviteEmail('');
        setInviteError(error);
        e.preventDefault();
    };
    const handleRemoveInviteEmail = (email) => {
        setInviteEmails(inviteEmails.filter(e => e !== email));
    };

    // Focus input khi mở invite
    React.useEffect(() => {
        if (showInviteInput && inviteInputRef.current) {
            inviteInputRef.current.focus();
        }
    }, [showInviteInput]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-white py-8">
            <Navbar />
            <div className="w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
                <div className="h-20 mt-10 bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center rounded-lg">
                    <h2 className="text-3xl md:text-4xl font-semibold text-white drop-shadow-lg ">Create Startup</h2>
                </div>
                <form onSubmit={formik.handleSubmit} className="bg-white px-8 py-10 md:px-12 md:py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Startup Name</label>
                            <input
                                type="text"
                                name="StartupName"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.StartupName}
                                className={`rounded-xl border-2 w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.StartupName && formik.errors.StartupName ? 'border-red-500' : 'border-blue-200'}`}
                                placeholder="Enter startup name"
                            />
                            {formik.touched.StartupName && formik.errors.StartupName && <p className="text-red-500 text-sm mt-1">{formik.errors.StartupName}</p>}
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Abbreviation Name</label>
                            <input
                                type="text"
                                name="AbbreviationName"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.AbbreviationName}
                                className={`rounded-xl border-2 w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.AbbreviationName && formik.errors.AbbreviationName ? 'border-red-500' : 'border-blue-200'}`}
                                placeholder="Enter abbreviation"
                            />
                            {formik.touched.AbbreviationName && formik.errors.AbbreviationName && <p className="text-red-500 text-sm mt-1">{formik.errors.AbbreviationName}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-semibold mb-1">Description</label>
                            <textarea
                                name="Description"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.Description}
                                className={`rounded-xl border-2 w-full px-4 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.Description && formik.errors.Description ? 'border-red-500' : 'border-blue-200'}`}
                                placeholder="Describe your startup"
                            ></textarea>
                            {formik.touched.Description && formik.errors.Description && <p className="text-red-500 text-sm mt-1">{formik.errors.Description}</p>}
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Vision</label>
                            <textarea
                                name="Vision"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.Vision}
                                className={`rounded-xl border-2 w-full px-4 py-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.Vision && formik.errors.Vision ? 'border-red-500' : 'border-blue-200'}`}
                                placeholder="Startup vision"
                            ></textarea>
                            {formik.touched.Vision && formik.errors.Vision && <p className="text-red-500 text-sm mt-1">{formik.errors.Vision}</p>}
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Mission</label>
                            <textarea
                                name="Mission"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.Mission}
                                className={`rounded-xl border-2 w-full px-4 py-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.Mission && formik.errors.Mission ? 'border-red-500' : 'border-blue-200'}`}
                                placeholder="Startup mission"
                            ></textarea>
                            {formik.touched.Mission && formik.errors.Mission && <p className="text-red-500 text-sm mt-1">{formik.errors.Mission}</p>}
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Logo</label>
                            <input
                                type="file"
                                name="Logo"
                                accept="image/*"
                                onChange={e => formik.setFieldValue('Logo', e.currentTarget.files[0])}
                                className="w-full file:rounded-lg file:bg-blue-50 file:text-blue-700 file:border-0 file:py-2 file:px-4 file:font-semibold file:cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Background Image</label>
                            <input
                                type="file"
                                name="BackgroundUrl"
                                accept="image/*"
                                onChange={e => formik.setFieldValue('BackgroundUrl', e.currentTarget.files[0])}
                                className="w-full file:rounded-lg file:bg-blue-50 file:text-blue-700 file:border-0 file:py-2 file:px-4 file:font-semibold file:cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Website URL</label>
                            <input
                                type="text"
                                name="WebsiteUrl"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.WebsiteUrl}
                                className={`rounded-xl border-2 w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.WebsiteUrl && formik.errors.WebsiteUrl ? 'border-red-500' : 'border-blue-200'}`}
                                placeholder="https://yourstartup.com"
                            />
                            {formik.touched.WebsiteUrl && formik.errors.WebsiteUrl && <p className="text-red-500 text-sm mt-1">{formik.errors.WebsiteUrl}</p>}
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Email</label>
                            <input
                                type="email"
                                name="Email"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.Email}
                                className={`rounded-xl border-2 w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.Email && formik.errors.Email ? 'border-red-500' : 'border-blue-200'}`}
                                placeholder="contact@startup.com"
                            />
                            {formik.touched.Email && formik.errors.Email && <p className="text-red-500 text-sm mt-1">{formik.errors.Email}</p>}
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Stage</label>
                            <select
                                name="StageId"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.StageId}
                                className={`rounded-xl border-2 w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.StageId && formik.errors.StageId ? 'border-red-500' : 'border-blue-200'}`}
                            >
                                <option value="">Select stage</option>
                                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {formik.touched.StageId && formik.errors.StageId && <p className="text-red-500 text-sm mt-1">{formik.errors.StageId}</p>}
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1">Creator Account ID</label>
                            <input
                                type="number"
                                name="CreatorAccountId"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.CreatorAccountId}
                                className={`rounded-xl border-2 w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.CreatorAccountId && formik.errors.CreatorAccountId ? 'border-red-500' : 'border-blue-200'}`}
                                placeholder="ID người tạo"
                            />
                            {formik.touched.CreatorAccountId && formik.errors.CreatorAccountId && <p className="text-red-500 text-sm mt-1">{formik.errors.CreatorAccountId}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-semibold mb-1">Invite Account IDs</label>
                            {!showInviteInput ? (
                                <button
                                    type="button"
                                    className="bg-blue-50 text-blue-700 font-semibold px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-100 transition"
                                    onClick={() => setShowInviteInput(true)}
                                >
                                    + Mời thành viên
                                </button>
                            ) : (
                                <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
                                    <div className="flex flex-wrap gap-2 mb-2 min-h-[40px]">
                                        {inviteEmails.map(email => (
                                            <span key={email} className="flex items-center bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium shadow hover:bg-blue-300 transition">
                                                {email}
                                                <button
                                                    type="button"
                                                    className="ml-2 text-blue-800 hover:text-red-500 font-bold"
                                                    onClick={() => handleRemoveInviteEmail(email)}
                                                    tabIndex={-1}
                                                >
                                                    <FontAwesomeIcon icon={faTimesCircle} size="sm" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            ref={inviteInputRef}
                                            type="email"
                                            value={inviteEmail}
                                            onChange={e => {
                                                setInviteEmail(e.target.value);
                                                setInviteError('');
                                            }}
                                            onKeyDown={handleInviteInput}
                                            onBlur={handleInviteInput}
                                            onPaste={handlePasteInvite}
                                            className="flex-1 min-w-[180px] rounded-xl border-2 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-blue-300 bg-white"
                                            placeholder="Nhập email, Enter hoặc phẩy để thêm"
                                        />
                                    </div>
                                    {inviteError && <p className="text-red-500 text-sm mt-1">{inviteError}</p>}
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            type="button"
                                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-300 transition"
                                            onClick={() => setShowInviteInput(false)}
                                        >
                                            Ẩn
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-semibold mb-1">Categories</label>
                            <select
                                name="CategoryIds"
                                multiple
                                value={formik.values.CategoryIds}
                                onChange={e => {
                                    const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                                    formik.setFieldValue('CategoryIds', selected);
                                }}
                                onBlur={formik.handleBlur}
                                className={`rounded-xl border-2 w-full px-4 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.CategoryIds && formik.errors.CategoryIds ? 'border-red-500' : 'border-blue-200'}`}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {formik.touched.CategoryIds && formik.errors.CategoryIds && <p className="text-red-500 text-sm mt-1">{formik.errors.CategoryIds}</p>}
                        </div>
                    </div>
                    <button type="submit" className="mt-8 w-full bg-blue-600 text-white text-lg py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 hover:shadow-xl transition-all">Create Startup</button>
                </form>
            </div>
        </div>
    );
} 