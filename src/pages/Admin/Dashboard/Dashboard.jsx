import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faBuilding,
    faFileAlt,
    faChartLine,
    faUserShield,
    faExclamationTriangle,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
    // Dữ liệu mẫu - trong thực tế sẽ được lấy từ API
    const [stats, setStats] = useState({
        totalAccounts: 0,
        newAccounts: 0,
        pendingVerifications: 0,
        totalStartups: 0,
        activePolicies: 0,
        weeklyRegistrations: [0, 0, 0, 0, 0, 0, 0],
        recentActivities: []
    });

    useEffect(() => {
        // Mô phỏng việc lấy dữ liệu từ API
        const fetchData = () => {
            // Giả lập dữ liệu
            setStats({
                totalAccounts: 1250,
                newAccounts: 78,
                pendingVerifications: 23,
                totalStartups: 45,
                activePolicies: 12,
                weeklyRegistrations: [25, 40, 35, 50, 49, 60, 70],
                recentActivities: [
                    { id: 1, type: 'account_created', user: 'Nguyễn Văn A', time: '15 phút trước' },
                    { id: 2, type: 'account_verified', user: 'Trần Thị B', time: '1 giờ trước' },
                    { id: 3, type: 'policy_added', policy: 'Chính sách bảo mật', admin: 'Admin1', time: '3 giờ trước' },
                    { id: 4, type: 'startup_created', startup: 'TechVN Solutions', time: '1 ngày trước' },
                    { id: 5, type: 'warning', message: 'Phát hiện tài khoản khả nghi', time: '2 ngày trước' }
                ]
            });
        };

        fetchData();
    }, []);

    const getActivityIcon = (type) => {
        switch (type) {
            case 'account_created':
                return <FontAwesomeIcon icon={faUsers} className="text-blue-500" />;
            case 'account_verified':
                return <FontAwesomeIcon icon={faUserShield} className="text-green-500" />;
            case 'policy_added':
                return <FontAwesomeIcon icon={faFileAlt} className="text-purple-500" />;
            case 'startup_created':
                return <FontAwesomeIcon icon={faBuilding} className="text-indigo-500" />;
            case 'warning':
                return <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />;
            default:
                return <FontAwesomeIcon icon={faCheckCircle} className="text-gray-500" />;
        }
    };

    const getActivityText = (activity) => {
        switch (activity.type) {
            case 'account_created':
                return `Tài khoản mới được tạo bởi ${activity.user}`;
            case 'account_verified':
                return `Tài khoản của ${activity.user} đã được xác thực`;
            case 'policy_added':
                return `${activity.policy} được thêm bởi ${activity.admin}`;
            case 'startup_created':
                return `Startup mới ${activity.startup} đã được đăng ký`;
            case 'warning':
                return activity.message;
            default:
                return 'Hoạt động không xác định';
        }
    };

    return (
        <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-xl" />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-sm font-medium text-gray-500">Tổng Tài Khoản</h2>
                            <p className="text-2xl font-semibold text-gray-800">{stats.totalAccounts}</p>
                            <p className="text-xs text-green-500">+{stats.newAccounts} tuần này</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <div className="bg-purple-100 p-3 rounded-full">
                            <FontAwesomeIcon icon={faUserShield} className="text-purple-500 text-xl" />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-sm font-medium text-gray-500">Đang Chờ Xác Thực</h2>
                            <p className="text-2xl font-semibold text-gray-800">{stats.pendingVerifications}</p>
                            <p className="text-xs text-gray-500">Cần xem xét</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <FontAwesomeIcon icon={faBuilding} className="text-indigo-500 text-xl" />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-sm font-medium text-gray-500">Startups</h2>
                            <p className="text-2xl font-semibold text-gray-800">{stats.totalStartups}</p>
                            <p className="text-xs text-gray-500">Đang hoạt động</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-full">
                            <FontAwesomeIcon icon={faFileAlt} className="text-green-500 text-xl" />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-sm font-medium text-gray-500">Chính Sách</h2>
                            <p className="text-2xl font-semibold text-gray-800">{stats.activePolicies}</p>
                            <p className="text-xs text-gray-500">Đang kích hoạt</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Đăng Ký Tài Khoản (7 Ngày Qua)</h2>
                    <div className="h-60 flex items-end justify-between">
                        {stats.weeklyRegistrations.map((count, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className="bg-purple-500 w-10 rounded-t-md"
                                    style={{ height: `${count * 2}px` }}
                                ></div>
                                <span className="text-xs mt-1">{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][index]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Hoạt Động Gần Đây</h2>
                    <div className="space-y-4">
                        {stats.recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start">
                                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                                <div className="ml-3">
                                    <p className="text-sm text-gray-700">{getActivityText(activity)}</p>
                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-4 text-sm text-purple-600 hover:text-purple-800 font-medium">
                        Xem tất cả hoạt động
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 