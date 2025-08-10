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
import { getAdminDashboard } from '@/apis/adminService';
import { Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalAccounts: 0,
        activeAccounts: 0,
        newAccounts: 0,
        totalStartups: 0,
        newStartups: 0,
        weeklyAccountRegistrations: [],
        weeklyStartupRegistrations: [],
        growthPercent: 0,
        dailyAccountStats: [],
        recentActivities: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await getAdminDashboard();

                setStats({
                    totalAccounts: response.numAccount || 0,
                    activeAccounts: response.numAccountActive || 0,
                    newAccounts: response.accountsCreatedLast7Days?.totalNewAccountCount || 0,
                    totalStartups: response.numStartup || 0,
                    newStartups: response.startupsCreatedLast7Days?.totalNewStartupCount || 0,
                    weeklyAccountRegistrations: response.accountsCreatedLast7Days?.dailyAccountStats?.map(stat => stat.accountCount) || [],
                    weeklyStartupRegistrations: response.startupsCreatedLast7Days?.dailyStartupStats?.map(stat => stat.startupCount) || [],
                    growthPercent: response.growthAccountStatsDtocs?.growthPercent || 0,
                    dailyAccountStats: response.accountsCreatedLast7Days?.dailyAccountStats || [],
                    recentActivities: [
                        { id: 1, type: 'account_created', user: 'New User', time: '15 minutes ago' },
                        { id: 2, type: 'account_verified', user: 'Account Verified', time: '1 hour ago' },
                        { id: 3, type: 'startup_created', startup: 'New Startup', time: '1 day ago' }
                    ]
                });
            } catch (err) {
                setError('Unable to load dashboard data');
                console.error('Lỗi khi tải dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-6 py-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        );
    }

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
                return `New account created by ${activity.user}`;
            case 'account_verified':
                return `Account ${activity.user} has been verified`;
            case 'policy_added':
                return `${activity.policy} added by ${activity.admin}`;
            case 'startup_created':
                return `New startup ${activity.startup} has been registered`;
            case 'warning':
                return activity.message;
            default:
                return 'Unknown activity';
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
                            <h2 className="text-sm font-medium text-gray-500">Total Accounts</h2>
                            <p className="text-2xl font-semibold text-gray-800">{stats.totalAccounts}</p>
                            <p className="text-xs text-green-500">+{stats.newAccounts} this week</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-full">
                            <FontAwesomeIcon icon={faUserShield} className="text-green-500 text-xl" />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-sm font-medium text-gray-500">Active Accounts</h2>
                            <p className="text-2xl font-semibold text-gray-800">{stats.activeAccounts}</p>
                            <p className="text-xs text-gray-500">Currently active</p>
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
                            <p className="text-xs text-gray-500">+{stats.newStartups} this week</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <div className="bg-purple-100 p-3 rounded-full">
                            <FontAwesomeIcon icon={faChartLine} className="text-purple-500 text-xl" />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-sm font-medium text-gray-500">Growth</h2>
                            <p className="text-2xl font-semibold text-gray-800">{stats.growthPercent}%</p>
                            <p className={`text-xs ${stats.growthPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                Compared to last week
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Account Registrations (Last 7 Days)</h2>
                    <div className="h-80">
                        <Line
                            data={{
                                labels: stats.dailyAccountStats?.map(stat => {
                                    const date = new Date(stat.date);
                                    return date.toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        day: '2-digit',
                                        month: '2-digit'
                                    });
                                }) || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                                datasets: [
                                    {
                                        label: 'New accounts',
                                        data: stats.weeklyAccountRegistrations,
                                        fill: true,
                                        backgroundColor: 'rgba(147, 51, 234, 0.1)',
                                        borderColor: 'rgb(147, 51, 234)',
                                        borderWidth: 3,
                                        pointBackgroundColor: 'rgb(147, 51, 234)',
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 2,
                                        pointRadius: 6,
                                        pointHoverRadius: 8,
                                        tension: 0.4,
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        titleColor: '#fff',
                                        bodyColor: '#fff',
                                        borderColor: 'rgb(147, 51, 234)',
                                        borderWidth: 1,
                                        cornerRadius: 8,
                                        displayColors: false,
                                        callbacks: {
                                            label: function (context) {
                                                return `${context.parsed.y} accounts registered`;
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    x: {
                                        grid: {
                                            display: false
                                        },
                                        border: {
                                            display: false
                                        },
                                        ticks: {
                                            color: '#6B7280',
                                            font: {
                                                size: 12,
                                                weight: '500'
                                            }
                                        }
                                    },
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(156, 163, 175, 0.2)',
                                            drawBorder: false
                                        },
                                        border: {
                                            display: false
                                        },
                                        ticks: {
                                            color: '#6B7280',
                                            font: {
                                                size: 12
                                            },
                                            stepSize: 1,
                                            callback: function (value) {
                                                return Number.isInteger(value) ? value : '';
                                            }
                                        }
                                    }
                                },
                                interaction: {
                                    intersect: false,
                                    mode: 'index'
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Data Distribution</h2>
                    <div className="h-80">
                        <Pie
                            data={{
                                labels: ['Total Accounts', 'Active Accounts', 'Startups'],
                                datasets: [
                                    {
                                        data: [stats.totalAccounts, stats.activeAccounts, stats.totalStartups],
                                        backgroundColor: [
                                            'rgba(59, 130, 246, 0.8)',
                                            'rgba(34, 197, 94, 0.8)',
                                            'rgba(99, 102, 241, 0.8)',
                                        ],
                                        borderColor: [
                                            'rgb(59, 130, 246)',
                                            'rgb(34, 197, 94)',
                                            'rgb(99, 102, 241)',
                                        ],
                                        borderWidth: 2,
                                        hoverOffset: 4
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            usePointStyle: true,
                                            padding: 20,
                                            font: {
                                                size: 12
                                            }
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        titleColor: '#fff',
                                        bodyColor: '#fff',
                                        borderColor: 'rgb(147, 51, 234)',
                                        borderWidth: 1,
                                        cornerRadius: 8,
                                        callbacks: {
                                            label: function (context) {
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Recent Activities Row */}
            {/* <div className="mt-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Recent Activities</h2>
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
                </div>
            </div> */}
        </div>
    );
};

export default Dashboard; 
