import React from 'react';
import { Link } from 'react-router-dom';

const AccessDenied = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-red-600 p-6">
                    <svg className="w-16 h-16 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>

                <div className="p-6">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Truy cập bị từ chối</h2>
                    <p className="text-gray-600 text-center mb-6">
                        Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên hoặc người quản lý để được cấp quyền.
                    </p>

                    <div className="flex flex-col space-y-2">
                        <Link to="/me/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded transition duration-200">
                            Về trang chính
                        </Link>
                        <Link to="/me/member" className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-center py-2 px-4 rounded transition duration-200">
                            Quản lý thành viên
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied; 