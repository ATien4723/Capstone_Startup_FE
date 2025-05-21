import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { register } from '@/apis/authService';
import { toast } from 'react-toastify';

const Register = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);

    const [isFocused, setIsFocused] = useState(false);

    const [focusedFields, setFocusedFields] = useState({
        firstName: false,
        lastName: false,
        email: false,
        dob: false,
        address: false
    });

    const formik = useFormik({
        initialValues: {
            lastName: '',
            firstName: '',
            email: '',
            password: '',
            confirmPassword: '',
            DOB: '',
            Address: '',
        },
        validationSchema: Yup.object({
            lastName: Yup.string().required('Required'),
            firstName: Yup.string().required('Required'),
            email: Yup.string().email('Invalid email address').required('Required'),
            password: Yup.string()
                .min(8, 'Must be at least 8 characters')
                .matches(/[A-Z]/, 'Must contain uppercase letter')
                .matches(/[a-z]/, 'Must contain lowercase letter')
                .matches(/[0-9]/, 'Must contain number')
                .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain special character')
                .required('Required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password'), null], 'Passwords must match')
                .required('Required'),
            DOB: Yup.date().required('Required'),
            Address: Yup.string().required('Required'),
        }),
        onSubmit: async (values) => {
            try {
                setIsCheckingEmail(true);
                const userData = {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    password: values.password,
                    confirmPassword: values.confirmPassword,
                    dateOfBirth: new Date(values.DOB).toISOString(),
                    address: values.Address
                };

                const response = await register(userData);
                if (response) {
                    toast.success('Registration successful! Please check your email for verification code.');
                    navigate('/verify-otp', { state: { email: values.email } });
                }
            } catch (error) {
                // console.error('Registration error:', error);
                // console.log('Full error object:', error);

                // Kiểm tra nếu error là một object và có message
                if (error.message) {
                    if (error.message.toLowerCase().includes('email')) {
                        toast.error('This email is already registered. Please use a different email or login.');
                        formik.setFieldError('email', 'Email already exists');
                    } else {
                        toast.error(error.message);
                    }
                }
                // Kiểm tra nếu có response từ API
                else if (error.response) {
                    if (error.response.data?.message) {
                        toast.error(error.response.data.message);
                    } else if (error.response.data?.errors) {
                        const errorMessages = Object.values(error.response.data.errors).flat();
                        errorMessages.forEach(message => toast.error(message));
                    } else {
                        toast.error('Registration failed. Please try again.');
                    }
                }
                // Nếu không có response và không có message
                else {
                    toast.error('Unable to connect to server. Please try again later.');
                }
            } finally {
                setIsCheckingEmail(false);
            }
        },
    });

    const togglePasswordVisibility = (field) => {
        if (field === 'password') setShowPassword(!showPassword);
        else if (field === 'confirmPassword') setShowConfirmPassword(!showConfirmPassword);
    };

    const checkPasswordRequirements = (password) => {
        return {
            minLength: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
    };

    const passwordRequirements = checkPasswordRequirements(formik.values.password);

    const PasswordRequirement = ({ met, text }) => (
        <div className="flex items-center space-x-2 text-sm">
            <FontAwesomeIcon
                icon={met ? faCheck : faTimes}
                className={met ? "text-green-500" : "text-red-500"}
            />
            <span className={met ? "text-green-500" : "text-red-500"}>{text}</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-400 to-blue-700 relative">
            <div className="container mx-auto px-4 py-2 relative z-10">
                <div className="flex justify-center">
                    <div className="w-full max-w-3xl">
                        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                            <div className="p-2 text-center bg-gradient-to-br from-blue-400 to-gray-300 rounded-t-2xl">
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/6/68/Logo_FPT_Education.png"
                                    alt="Logo"
                                    className="w-40 h-20 mx-auto mb-6 drop-shadow-md"
                                />
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Register Simes Account</h2>
                                <p className="text-lg text-gray-600">Connect with professionals worldwide</p>
                            </div>
                            <div className="p-12 max-h-[150vh]">
                                <form onSubmit={formik.handleSubmit} className="space-y-6">
                                    {/* Personal Information */}
                                    <h5 className="text-xl font-semibold text-gray-700 relative mb-4">
                                        Personal Information
                                        <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-gradient-to-r from-blue-600 to-gray-700 rounded" />
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                {...formik.getFieldProps('lastName')}
                                                onFocus={() =>
                                                    setFocusedFields((prev) => ({ ...prev, lastName: true }))
                                                }
                                                onBlur={(e) => {
                                                    setFocusedFields((prev) => ({ ...prev, lastName: false }));
                                                    formik.handleBlur(e);
                                                }}
                                                className={`w-full px-4 py-2 rounded-xl border-2 ${formik.touched.lastName && formik.errors.lastName
                                                    ? 'border-red-500'
                                                    : 'border-gray-200'
                                                    } focus:border-blue-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 transition-all`}
                                            />
                                            {!focusedFields.lastName &&
                                                formik.touched.lastName &&
                                                formik.errors.lastName && (
                                                    <div className="text-red-500 text-sm mt-1">
                                                        {formik.errors.lastName}
                                                    </div>
                                                )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                {...formik.getFieldProps('firstName')}
                                                onFocus={() =>
                                                    setFocusedFields((prev) => ({ ...prev, firstName: true }))
                                                }
                                                onBlur={(e) => {
                                                    setFocusedFields((prev) => ({ ...prev, firstName: false }));
                                                    formik.handleBlur(e);
                                                }}
                                                className={`w-full px-4 py-2 rounded-xl border-2 ${formik.touched.firstName && formik.errors.firstName
                                                    ? 'border-red-500'
                                                    : 'border-gray-200'
                                                    } focus:border-blue-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 transition-all`}
                                            />
                                            {!focusedFields.firstName &&
                                                formik.touched.firstName &&
                                                formik.errors.firstName && (
                                                    <div className="text-red-500 text-sm mt-1">
                                                        {formik.errors.firstName}
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    {/* Login Information */}
                                    <h5 className="text-xl font-semibold text-gray-700 relative mb-4 mt-6">
                                        Login Information
                                        <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-gradient-to-r from-blue-600 to-gray-700 rounded" />
                                    </h5>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            {...formik.getFieldProps('email')}
                                            onFocus={() =>
                                                setFocusedFields((prev) => ({ ...prev, email: true }))
                                            }
                                            onBlur={(e) => {
                                                setFocusedFields((prev) => ({ ...prev, email: false }));
                                                formik.handleBlur(e);
                                            }}
                                            className={`w-full px-4 py-2 rounded-xl border-2 ${formik.touched.email && formik.errors.email
                                                ? 'border-red-500'
                                                : 'border-gray-200'
                                                } focus:border-blue-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 transition-all`}
                                        />
                                        {!focusedFields.email && formik.touched.email && formik.errors.email && (
                                            <div className="text-red-500 text-sm mt-1">{formik.errors.email}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                {...formik.getFieldProps('password')}
                                                className={`w-full px-4 py-2 rounded-xl border-2 ${formik.touched.password && formik.errors.password
                                                    ? 'border-red-500'
                                                    : 'border-gray-200'
                                                    } focus:border-blue-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 transition-all`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('password')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                        </div>
                                        {/* Password Requirements */}
                                        {formik.values.password && (
                                            <div className="mt-2 space-y-1">
                                                <PasswordRequirement met={passwordRequirements.minLength} text="Minimum 8 characters" />
                                                <PasswordRequirement met={passwordRequirements.uppercase} text="Contains uppercase letter" />
                                                <PasswordRequirement met={passwordRequirements.lowercase} text="Contains lowercase letter" />
                                                <PasswordRequirement met={passwordRequirements.number} text="Contains number" />
                                                <PasswordRequirement met={passwordRequirements.special} text="Contains special character" />
                                            </div>
                                        )}

                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                {...formik.getFieldProps('confirmPassword')}
                                                className={`w-full px-4 py-2 rounded-xl border-2 ${formik.touched.confirmPassword && formik.errors.confirmPassword
                                                    ? 'border-red-500'
                                                    : 'border-gray-200'
                                                    } focus:border-blue-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 transition-all`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirmPassword')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                        </div>
                                        {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                                            <div className="text-red-500 text-sm mt-1">{formik.errors.confirmPassword}</div>
                                        )}
                                    </div>

                                    {/* Contact Information */}
                                    <h5 className="text-xl font-semibold text-gray-700 relative mb-4 mt-6">
                                        Contact Information
                                        <span className="absolute left-0 bottom-0 w-10 h-0.5 bg-gradient-to-r from-blue-600 to-gray-700 rounded" />
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                                            <input
                                                type="date"
                                                name="DOB"
                                                {...formik.getFieldProps('DOB')}
                                                className={`w-full px-4 py-2 rounded-xl border-2 ${formik.touched.DOB && formik.errors.DOB
                                                    ? 'border-red-500'
                                                    : 'border-gray-200'
                                                    } focus:border-blue-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 transition-all`}
                                            />
                                            {formik.touched.DOB && formik.errors.DOB && (
                                                <div className="text-red-500 text-sm mt-1">{formik.errors.DOB}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                            <input
                                                type="text"
                                                name="Address"
                                                {...formik.getFieldProps('Address')}
                                                className={`w-full px-4 py-2 rounded-xl border-2 ${formik.touched.Address && formik.errors.Address
                                                    ? 'border-red-500'
                                                    : 'border-gray-200'
                                                    } focus:border-blue-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 transition-all`}
                                            />
                                            {formik.touched.Address && formik.errors.Address && (
                                                <div className="text-red-500 text-sm mt-1">{formik.errors.Address}</div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isCheckingEmail}
                                        className={`w-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-lg ${isCheckingEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isCheckingEmail ? 'Checking...' : 'Register'}
                                    </button>
                                </form>
                            </div>
                            <div className="p-6 text-center bg-gray-50 rounded-b-2xl">
                                Already have an account?{' '}
                                <Link to="/login" className="text-indigo-600 font-semibold hover:text-purple-700 transition-colors">
                                    Login now
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;