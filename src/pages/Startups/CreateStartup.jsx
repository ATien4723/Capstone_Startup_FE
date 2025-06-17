import React, { useState, useRef, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle, faUserPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { createStartup, getStage, checkMembership } from '@/apis/startupService';
import { getAllCategories } from '@/apis/categoryService';
import { getUserId, getUserInfoFromToken } from "@/apis/authService";
import { useNavigate } from 'react-router-dom';
import useInviteAccounts from '@/hooks/useInviteAccounts';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Fade from '@mui/material/Fade';
import Tooltip from '@mui/material/Tooltip';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import CloseIcon from '@mui/icons-material/Close';


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

// Tạo theme cho MUI components
const theme = createTheme({
    palette: {
        primary: {
            main: '#3b82f6', // blue-500
            light: '#60a5fa', // blue-400
            dark: '#2563eb', // blue-600
        },
        secondary: {
            main: '#f59e0b', // amber-500
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    fontWeight: 500,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
    },
});

export default function CreateStartup() {
    const [showInviteInput, setShowInviteInput] = useState(false);
    const [stages, setStages] = useState([]);
    const [categories, setCategories] = useState([]);
    const currentUserId = getUserId();
    const navigate = useNavigate();
    const [checkingMembership, setCheckingMembership] = useState(true);

    // Sử dụng hook useInviteAccounts
    const {
        searchResults,
        selectedUsers,
        searchEmail,
        isSearching,
        loading: inviteLoading,
        handleEmailInputChange,
        handleSelectUser,
        handleRemoveUser
    } = useInviteAccounts(currentUserId);


    // Lấy danh sách Stage và Category khi component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Lấy danh sách Stage
                const stageData = await getStage();
                // console.log("Stage Data:", stageData); // Xem dữ liệu có đúng không

                setStages(stageData || []);

                // Lấy danh sách Category
                const categoryData = await getAllCategories();
                setCategories(categoryData || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    // Kiểm tra membership khi vào trang
    useEffect(() => {
        const check = async () => {
            try {
                const res = await checkMembership(currentUserId);
                if (res.isMember === true) {
                    navigate('/me/dashboard');
                } else {
                    setCheckingMembership(false);
                }
            } catch (e) {
                setCheckingMembership(false);
            }
        };
        check();
    }, [currentUserId, navigate]);

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
            CreatorAccountId: currentUserId,
            InviteAccountIds: [],
            CategoryIds: [],
        },
        validationSchema,
        onSubmit: async (values, { resetForm }) => {
            const formData = new FormData();

            // Lấy accountIds từ selectedUsers
            const inviteAccountIds = selectedUsers.map(user => user.accountId);

            Object.entries({ ...values, InviteAccountIds: inviteAccountIds }).forEach(([key, value]) => {
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
            try {
                await createStartup(formData);
                alert('Tạo startup thành công!');
                resetForm();
            } catch (error) {
                alert('Có lỗi khi tạo startup!');
            }
        },
    });

    if (checkingMembership) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Đang kiểm tra quyền truy cập...</div>
            </div>
        );
    }

    return (
        <ThemeProvider theme={theme}>
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
                                    {stages.map(s => (
                                        <option key={s.stageId} value={s.stageId}>{s.stageName}</option>
                                    ))}
                                </select>
                                {formik.touched.StageId && formik.errors.StageId && <p className="text-red-500 text-sm mt-1">{formik.errors.StageId}</p>}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Creator Account ID</label>
                                <input
                                    type="number"
                                    name="CreatorAccountId"
                                    value={formik.values.CreatorAccountId}
                                    readOnly
                                    className={`rounded-xl border-2 w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.CreatorAccountId && formik.errors.CreatorAccountId ? 'border-red-500' : 'border-blue-200'}`}
                                    placeholder="ID người tạo"
                                />
                                {formik.touched.CreatorAccountId && formik.errors.CreatorAccountId && <p className="text-red-500 text-sm mt-1">{formik.errors.CreatorAccountId}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-gray-700 font-semibold mb-1">Invite Account IDs</label>
                                {!showInviteInput ? (
                                    <Button
                                        variant="outlined"
                                        startIcon={<PersonAddAltIcon />}
                                        onClick={() => setShowInviteInput(true)}
                                        sx={{
                                            borderRadius: '12px',
                                            py: 1,
                                            px: 2,
                                            bgcolor: 'rgba(59, 130, 246, 0.08)',
                                            borderColor: 'rgba(59, 130, 246, 0.3)',
                                            color: '#3b82f6',
                                            '&:hover': {
                                                bgcolor: 'rgba(59, 130, 246, 0.15)',
                                                borderColor: '#3b82f6',
                                            }
                                        }}
                                    >
                                        Mời thành viên
                                    </Button>
                                ) : (
                                    <Fade in={showInviteInput}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                bgcolor: 'rgba(59, 130, 246, 0.05)',
                                                borderColor: 'rgba(59, 130, 246, 0.2)',
                                                mb: 2
                                            }}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: '#3b82f6' }}>
                                                        Mời thành viên
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setShowInviteInput(false)}
                                                        sx={{ color: 'rgba(59, 130, 246, 0.7)' }}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>

                                                <Divider sx={{ mb: 2 }} />

                                                {/* Hiển thị danh sách người dùng đã chọn */}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2, minHeight: '40px' }}>
                                                    {selectedUsers.length > 0 ? (
                                                        selectedUsers.map((user) => (
                                                            <Chip
                                                                key={user.accountId}
                                                                avatar={<Avatar src={user.avatarUrl} alt={user.email} />}
                                                                label={user.email}
                                                                onDelete={() => handleRemoveUser(user.accountId)}
                                                                sx={{
                                                                    m: 0.5,
                                                                    bgcolor: 'rgba(59, 130, 246, 0.12)',
                                                                    color: '#2563eb',
                                                                    '& .MuiChip-deleteIcon': {
                                                                        color: '#2563eb',
                                                                        '&:hover': {
                                                                            color: '#ef4444',
                                                                        },
                                                                    },
                                                                }}
                                                            />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 1 }}>
                                                            Chưa có thành viên nào được chọn
                                                        </Typography>
                                                    )}
                                                </Box>

                                                {/* Autocomplete cho việc tìm kiếm email */}
                                                <Autocomplete
                                                    options={Array.isArray(searchResults) ? searchResults : []}
                                                    loading={isSearching}
                                                    getOptionLabel={option => (option?.email ? option.email : '')}
                                                    onChange={(event, value) => {
                                                        handleSelectUser(value);
                                                    }}
                                                    value={null}
                                                    inputValue={searchEmail || ''}
                                                    onInputChange={(event, value, reason) => {
                                                        handleEmailInputChange({ target: { value: value || '' } });
                                                    }}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Tìm kiếm theo email"
                                                            variant="outlined"
                                                            fullWidth
                                                            InputProps={{
                                                                ...params.InputProps,
                                                                endAdornment: (
                                                                    <>
                                                                        {isSearching ? <CircularProgress color="primary" size={20} /> : null}
                                                                        {params.InputProps.endAdornment}
                                                                    </>
                                                                ),
                                                            }}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    bgcolor: 'white',
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                    renderOption={(props, option) => (
                                                        <li {...props} key={option.accountId} style={{ display: 'flex', alignItems: 'center' }}>
                                                            <Avatar
                                                                src={option.avatarUrl}
                                                                alt={option.email}
                                                                sx={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    mr: 1.5,
                                                                    bgcolor: option.avatarUrl ? 'transparent' : '#3b82f6'
                                                                }}
                                                            />
                                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                    {option.fullName || option.email.split('@')[0]}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {option.email}
                                                                </Typography>
                                                            </Box>
                                                        </li>
                                                    )}
                                                    noOptionsText={
                                                        <Typography sx={{ py: 1, textAlign: 'center', color: 'text.secondary' }}>
                                                            Không tìm thấy người dùng
                                                        </Typography>
                                                    }
                                                    isOptionEqualToValue={(option, value) => option.accountId === value.accountId}
                                                />
                                            </CardContent>
                                        </Card>
                                    </Fade>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-gray-700 font-semibold mb-1">Categories</label>
                                <select
                                    name="CategoryIds"
                                    onChange={e => {
                                        formik.setFieldValue('CategoryIds', [Number(e.target.value)]);
                                    }}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.CategoryIds[0] || ''}
                                    className={`rounded-xl border-2 w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${formik.touched.CategoryIds && formik.errors.CategoryIds ? 'border-red-500' : 'border-blue-200'}`}
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map(cat => (
                                        <option key={cat.category_ID} value={cat.category_ID}>
                                            {cat.category_Name}
                                        </option>
                                    ))}
                                </select>
                                {formik.touched.CategoryIds && formik.errors.CategoryIds && (
                                    <p className="text-red-500 text-sm mt-1">{formik.errors.CategoryIds}</p>
                                )}
                            </div>
                        </div>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{
                                mt: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4), 0 2px 4px -1px rgba(59, 130, 246, 0.2)',
                                '&:hover': {
                                    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(59, 130, 246, 0.2)',
                                }
                            }}
                        >
                            Create Startup
                        </Button>
                    </form>
                </div>
            </div>
        </ThemeProvider>
    );
}