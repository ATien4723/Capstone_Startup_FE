import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { login } from "@/apis/authService";
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const Login = () => {

    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is already logged in by checking the accessToken cookie
        const accessToken = Cookies.get('accessToken');
        if (accessToken) {
            navigate('/home');
        }
    }, [navigate]);

    // Validation schema
    const validationSchema = Yup.object({
        email: Yup.string().email('Invalid email').required('Email is required'),
        password: Yup.string().required('Password is required'),
        remember: Yup.boolean(),
    });

    const handleLogin = async (values, { setSubmitting }) => {
        try {
            const response = await login(values);
            if (response) {
                toast.success('Đăng nhập thành công!');
                navigate('/home');
            }
        } catch (error) {
            toast.error('Tên đăng nhập hoặc mật khẩu không đúng');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-white-600 to-gray-800 ">
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
                        <div className="absolute inset-0  flex flex-col justify-center p-8 text-white">
                            <div className="text-left">
                                <h2 className="text-2xl font-semibold mb-4 text-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                                    Join the Simes Community
                                </h2>
                                <p className="text-sm leading-relaxed opacity-90 text-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                                    Connect with professionals worldwide, share ideas, and grow your network.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Login Form */}
                    <div className="w-full md:w-1/2 flex flex-col max-h-screen overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-blue-600 to-gray-800 p-8 text-center relative">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/6/68/Logo_FPT_Education.png"
                                alt="Simes Logo"
                                className="w-45 h-20 mx-auto items-center mb-4 drop-shadow-md"
                            />
                            <h1 className="text-white text-2xl font-bold mb-2 text-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                                Simes
                            </h1>
                            <p className="text-white/90 text-sm text-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                                Connect with professionals worldwide
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-8 bg-white sm:p-6">
                            <Formik
                                initialValues={{
                                    email: '',
                                    password: '',
                                    remember: false,
                                }}
                                validationSchema={validationSchema}
                                onSubmit={handleLogin}
                            >
                                {({ isSubmitting, setFieldTouched, submitCount, errors, touched }) => (
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
                                                onFocus={() => setFieldTouched("email", false)} // Khi người dùng chạm vào input, lỗi sẽ không hiển thị
                                            />
                                            {/* Hiển thị lỗi email chỉ khi submitCount > 0 và trường đã được "chạm vào" */}
                                            {touched.email && errors.email && (
                                                <div className="text-red-500 text-sm mt-1">{errors.email}</div>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="password" className="block text-gray-700 font-semibold text-sm mb-2">
                                                Password
                                            </label>
                                            <Field
                                                type="password"
                                                id="password"
                                                name="password"
                                                placeholder="Enter your password"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
                                                onFocus={() => setFieldTouched("password", false)} // Khi người dùng chạm vào input, lỗi sẽ không hiển thị
                                            />
                                            {/* Hiển thị lỗi password chỉ khi submitCount > 0 và trường đã được "chạm vào" */}
                                            {touched.password && errors.password && (
                                                <div className="text-red-500 text-sm mt-1">{errors.password}</div>
                                            )}
                                        </div>

                                        <div className="flex items-center mb-4">
                                            <Field
                                                type="checkbox"
                                                id="remember"
                                                name="remember"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="remember" className="ml-2 text-gray-700 text-sm">
                                                Remember me
                                            </label>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-gradient-to-br from-blue-600 to-gray-800 text-white py-3 rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                                        >
                                            {isSubmitting ? 'Logging in...' : 'Login'}
                                        </button>

                                        <div className="text-center mt-3">
                                            <Link to="/forget-password" className="text-gray-600 hover:text-gray-800 transition-colors text-sm">
                                                Forgot password?
                                            </Link>
                                        </div>
                                    </Form>
                                )}
                            </Formik>

                        </div>

                        {/* Footer */}
                        <div className="text-center p-5 border-t border-gray-100 bg-gray-50 sm:p-4">
                            <p className="text-gray-600 text-sm">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-blue-600 hover:text-gray-800 font-semibold transition-colors">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
