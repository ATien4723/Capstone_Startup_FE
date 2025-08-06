import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AdminAccessDenied = () => {
    const { user, isAdmin } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex flex-col justify-center items-center px-4">
            <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl overflow-hidden">
                {/* Header với icon cảnh báo */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-white bg-opacity-20 rounded-full p-4">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white text-center">Admin Area</h1>
                    <p className="text-red-100 text-center mt-2">Access Restricted</p>
                </div>

                {/* Nội dung */}
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            You do not have permission to access the admin area
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Only administrators can access system management pages.
                            If you need access, please contact the administrator.
                        </p>
                    </div>

                    {/* Thông tin người dùng hiện tại */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Current user:</span>
                            <span className="font-medium text-gray-800">{user?.email || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-gray-500">Role:</span>
                            <span className="font-medium text-gray-800">
                                {isAdmin ? 'Administrator' : 'User'}
                            </span>
                        </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="space-y-3">
                        <Link
                            to="/home"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-6 rounded-lg font-medium transition duration-200 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAccessDenied;
