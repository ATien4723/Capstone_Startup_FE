import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { sendOTP, verifyOtpForgetPassword, resetPassword } from '@/apis/authService';
import { toast } from 'react-toastify';

const ForgetPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        let timer;
        if (step === 2 && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [step, countdown]);

    // Validation schemas
    const emailSchema = Yup.object({
        email: Yup.string().email('Invalid email').required('Email is required'),
    });

    const otpSchema = Yup.object({
        otp: Yup.string().required('OTP is required').length(6, 'OTP must be 6 characters'),
    });

    const passwordSchema = Yup.object({
        newPassword: Yup.string()
            .min(8, 'Password must be at least 8 characters')
            .required('New password is required'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
            .required('Confirm password is required'),
    });


    const handleResendOTP = async () => {
        try {
            await sendOTP(email);
            setCountdown(60);
            setCanResend(false);
            toast.success('OTP has been resent to your email!');
        } catch (error) {
            toast.error('Error resending OTP');
        }
    };


    const handleSendOTP = async (values, { setSubmitting }) => {
        try {
            await sendOTP(values.email)
            setEmail(values.email);
            setStep(2);
            setCountdown(60);
            setCanResend(false);
            toast.success('OTP has been sent to your email !');
        } catch (error) {
            toast.error('Email not found or error sending OTP');
        } finally {
            setSubmitting(false);
        }

    };

    const handleVerifyOTP = async (values, { setSubmitting }) => {
        try {
            const response = await verifyOtpForgetPassword(email, values.otp);
            if (response.success) {
                setStep(3);
                toast.success('OTP verified successfully!');
            }
        } catch (error) {
            toast.error('Invalid OTP');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (values, { setSubmitting }) => {
        try {
            await resetPassword(email, values.newPassword, values.confirmPassword);
            toast.success('Password reset successfully!');
            navigate('/login');
        } catch (error) {
            toast.error('Error resetting password');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-white-600 to-gray-800">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none z-0" />

            <div className="w-full h-screen z-10">
                <div className="flex flex-col md:flex-row bg-white/95 backdrop-blur-lg shadow-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)] w-full h-full">
                    {/* Startup Image */}
                    <div className="hidden md:block md:w-1/2 relative">
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                            alt="Startup Team"
                            className="w-full h-full object-cover brightness-90"
                        />
                        <div className="absolute inset-0 flex flex-col justify-center p-8 text-white">
                            <div className="text-left">
                                <h2 className="text-2xl font-semibold mb-4 text-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                                    Reset Password
                                </h2>
                                <p className="text-sm leading-relaxed opacity-90 text-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                                    Please follow the steps to reset your password.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="w-full md:w-1/2 flex flex-col max-h-screen overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-blue-600 to-gray-800 p-8 text-center relative">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/6/68/Logo_FPT_Education.png"
                                alt="Simes Logo"
                                className="w-45 h-20 mx-auto items-center mb-4 drop-shadow-md"
                            />
                            <h1 className="text-white text-2xl font-bold mb-2 text-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                                Reset Password
                            </h1>
                            {/* <p className="text-white/90 text-sm text-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                                Step {step} of 3
                            </p> */}
                        </div>

                        {/* Body */}
                        <div className="p-8 bg-white sm:p-6">
                            {step === 1 && (
                                <Formik
                                    initialValues={{ email: '' }}
                                    validationSchema={emailSchema}
                                    onSubmit={handleSendOTP}
                                >
                                    {({ isSubmitting }) => (
                                        <Form>
                                            <div className="mb-4">
                                                <label htmlFor="email" className="block text-gray-700 font-semibold text-sm mb-2">
                                                    Email address
                                                </label>
                                                <Field
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    placeholder="Enter your email"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
                                                />
                                                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-gradient-to-br from-blue-600 to-gray-800 text-white py-3 rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                                            >
                                                {isSubmitting ? 'Sending...' : 'Send OTP'}
                                            </button>
                                        </Form>
                                    )}
                                </Formik>
                            )}

                            {step === 2 && (
                                <Formik
                                    initialValues={{ otp: '' }}
                                    validationSchema={otpSchema}
                                    onSubmit={handleVerifyOTP}
                                >
                                    {({ isSubmitting }) => (
                                        <Form>
                                            <div className="mb-4">
                                                <label htmlFor="otp" className="block text-gray-700 font-semibold text-sm mb-2">
                                                    Enter OTP
                                                </label>
                                                <Field
                                                    type="text"
                                                    id="otp"
                                                    name="otp"
                                                    placeholder="Enter 6-digit OTP"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
                                                />
                                                <ErrorMessage name="otp" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-gradient-to-br from-blue-600 to-gray-800 text-white py-3 rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                                            >
                                                {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                                            </button>

                                            <div className="mt-4 text-center">
                                                {!canResend ? (
                                                    <p className="text-gray-600 text-sm">
                                                        Resend OTP in {countdown} seconds
                                                    </p>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleResendOTP}
                                                        className="text-blue-600 hover:text-gray-800 text-sm font-medium"
                                                    >
                                                        Resend OTP
                                                    </button>
                                                )}
                                            </div>
                                        </Form>
                                    )}
                                </Formik>
                            )}

                            {step === 3 && (
                                <Formik
                                    initialValues={{ newPassword: '', confirmPassword: '' }}
                                    validationSchema={passwordSchema}
                                    onSubmit={handleResetPassword}
                                >
                                    {({ isSubmitting }) => (
                                        <Form>
                                            <div className="mb-4">
                                                <label htmlFor="newPassword" className="block text-gray-700 font-semibold text-sm mb-2">
                                                    New Password
                                                </label>
                                                <Field
                                                    type="password"
                                                    id="newPassword"
                                                    name="newPassword"
                                                    placeholder="Enter new password"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
                                                />
                                                <ErrorMessage name="newPassword" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold text-sm mb-2">
                                                    Confirm Password
                                                </label>
                                                <Field
                                                    type="password"
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    placeholder="Confirm new password"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
                                                />
                                                <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-gradient-to-br from-blue-600 to-gray-800 text-white py-3 rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                                            >
                                                {isSubmitting ? 'Resetting...' : 'Reset Password'}
                                            </button>
                                        </Form>
                                    )}
                                </Formik>
                            )}

                            <div className="text-center mt-4">
                                <Link to="/login" className="text-blue-600 hover:text-gray-800 text-sm">
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgetPassword; 
