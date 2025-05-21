import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp } from '@/apis/authService';
import { toast } from 'react-toastify';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes in seconds
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/register');
            toast.error('Please register first');
        }
    }, [email, navigate]);

    // Countdown timer effect
    useEffect(() => {
        if (timeLeft <= 0) {
            toast.error('OTP has expired. Please request a new one.');
            navigate('/register');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, navigate]);

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value !== '' && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        const newOtp = [...otp];

        for (let i = 0; i < pastedData.length; i++) {
            if (/[0-9]/.test(pastedData[i])) {
                newOtp[i] = pastedData[i];
            }
        }

        setOtp(newOtp);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            toast.error('Please enter all 6 digits');
            return;
        }

        try {
            await verifyOtp(email, otpString);
            toast.success('Email verified successfully!');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-400 to-blue-700 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Email Verification</h2>
                    <p className="text-gray-600">
                        Please enter the 6-digit code sent to<br />
                        <span className="font-medium text-indigo-600">{email}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Time remaining: <span className="font-medium text-indigo-600">{formatTime(timeLeft)}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center gap-2 mb-8">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={inputRefs[index]}
                                type="text"
                                maxLength="1"
                                className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Verify Email
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate('/register')}
                        className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                        Back to Register
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification; 