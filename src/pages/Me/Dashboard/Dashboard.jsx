import React from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import useDashboard from '@/hooks/useDashboard';

// Đăng ký các thành phần ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = () => {
    // Sử dụng hook để lấy tất cả dữ liệu và logic
    const {
        loading,
        error,
        totalClicks,
        totalInteractions,
        totalSubscribers,
        totalPosts,
        chartData,
        chartOptions,
        hasClickData,
        hasInteractionData,
        hasData
    } = useDashboard();

    // Hiển thị trạng thái loading
    if (loading) {
        return (
            <>
                <style>
                    {`
                    .loader {
                        width: fit-content;
                        font-weight: bold;
                        font-family: monospace;
                        font-size: 30px;
                        clip-path: inset(0 3ch 0 0);
                        animation: l4 1s steps(4) infinite;
                    }
                    .loader:before {
                        content: "Loading...";
                    }
                    @keyframes l4 {
                        to {
                            clip-path: inset(0 -1ch 0 0);
                        }
                    }
                    `}
                </style>
                <div className="flex justify-center items-center h-screen">
                    <div className="loader"></div>
                </div>
            </>
        );
    }

    // Hiển thị lỗi nếu có
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-xl">{error}</div>
            </div>
        );
    }

    return (
        <>
            {/* Topbar */}
            <header className="bg-white shadow px-4 py-4 flex justify-between items-center mb-6 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
                    <i className="fas fa-download"></i> Export Report
                </button>
            </header>

            {/* Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <div className="bg-white border-l-4 border-blue-500 shadow rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-blue-500 uppercase mb-1">Total Clicks</div>
                        <div className="text-xl font-bold text-gray-800">{totalClicks}</div>
                    </div>
                    <i className="fas fa-mouse-pointer fa-2x text-gray-300"></i>
                </div>
                <div className="bg-white border-l-4 border-green-500 shadow rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-green-500 uppercase mb-1">Total Interactions</div>
                        <div className="text-xl font-bold text-gray-800">{totalInteractions}</div>
                    </div>
                    <i className="fas fa-comments fa-2x text-gray-300"></i>
                </div>
                <div className="bg-white border-l-4 border-cyan-500 shadow rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-cyan-500 uppercase mb-1">Total Followers</div>
                        <div className="text-xl font-bold text-gray-800">{totalSubscribers}</div>
                    </div>
                    <i className="fas fa-user-friends fa-2x text-gray-300"></i>
                </div>
                <div className="bg-white border-l-4 border-yellow-500 shadow rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-yellow-500 uppercase mb-1">Total Posts</div>
                        <div className="text-xl font-bold text-gray-800">{totalPosts}</div>
                    </div>
                    <i className="fas fa-clipboard fa-2x text-gray-300"></i>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="xl:col-span-2 bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h6 className="font-bold text-blue-600">Click Statistics</h6>
                        <button className="text-gray-400 hover:text-gray-600">
                            <i className="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                    <div className="h-64">
                        {hasClickData ? (
                            <Line data={chartData.clickChartData} options={chartOptions.line} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No click data available</div>
                        )}
                    </div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h6 className="font-bold text-blue-600">Interaction Distribution</h6>
                        <button className="text-gray-400 hover:text-gray-600">
                            <i className="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                    <div className="h-64">
                        {hasData ? (
                            <Pie data={chartData.distributionChartData} options={chartOptions.pie} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No interaction data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Chart Row */}
            <div className="mb-6">
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h6 className="font-bold text-blue-600">Daily Interaction Statistics</h6>
                        <button className="text-gray-400 hover:text-gray-600">
                            <i className="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                    <div className="h-64">
                        {hasInteractionData ? (
                            <Bar data={chartData.interactionChartData} options={chartOptions.bar} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No interaction data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Combined Chart Row */}
            {/* <div className="mb-6">
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h6 className="font-bold text-blue-600">Click & Interaction Statistics</h6>
                        <div className="text-sm text-gray-500">Click on legend to show/hide data</div>
                    </div>
                    <div className="h-80">
                        {hasClickData ? (
                            <Line data={chartData.combinedChartData} options={chartOptions.combined} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
                        )}
                    </div>
                </div>
            </div> */}

            {/* Projects & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                    <div className="bg-white shadow rounded-lg mb-6 p-6">
                        <h6 className="font-bold text-blue-600 mb-4">Detailed Statistics</h6>
                        <div className="mb-4">
                            <div className="flex justify-between mb-1">
                                <span className="font-medium">Interaction / Click Ratio</span>
                                <span className="text-sm">{totalClicks > 0 ? Math.round((totalInteractions / totalClicks) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${totalClicks > 0 ? Math.min(Math.round((totalInteractions / totalClicks) * 100), 100) : 0}%` }}></div>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="font-medium">Follower / Click Ratio</span>
                                <span className="text-sm">{totalClicks > 0 ? Math.round((totalSubscribers / totalClicks) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${totalClicks > 0 ? Math.min(Math.round((totalSubscribers / totalClicks) * 100), 100) : 0}%` }}></div>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="font-medium">Posts / Day Ratio</span>
                                <span className="text-sm">{totalPosts > 0 ? (totalPosts / 7).toFixed(1) : 0}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(Math.round((totalPosts / 7) * 100), 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-600 text-white rounded-lg shadow p-4">Clicks<div className="text-white/70 text-xs">{totalClicks} times</div></div>
                        <div className="bg-green-500 text-white rounded-lg shadow p-4">Interactions<div className="text-white/70 text-xs">{totalInteractions} times</div></div>
                        <div className="bg-cyan-500 text-white rounded-lg shadow p-4">Followers<div className="text-white/70 text-xs">{totalSubscribers} people</div></div>
                        <div className="bg-yellow-400 text-white rounded-lg shadow p-4">Posts<div className="text-white/70 text-xs">{totalPosts} posts</div></div>
                    </div>
                </div>
                {/* Hướng dẫn & Thông tin */}
                <div>
                    <div className="bg-white shadow rounded-lg mb-6 p-6">
                        <h6 className="font-bold text-blue-600 mb-4">Data Analysis</h6>
                        <div className="flex justify-center mb-4">
                            <img className="w-64" src="/img/undraw_data_report.svg" alt="Data Report" />
                        </div>
                        <p className="mb-2">The analytics data shows user interactions with your startup over the past 7 days.</p>
                        <p className="mb-2">Through this data, you can evaluate the effectiveness of activities and adjust strategies accordingly.</p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <h6 className="font-bold text-blue-600 mb-4">Improvement Suggestions</h6>
                        <p className="mb-2">• Create engaging content to increase interactions</p>
                        <p className="mb-2">• Post regularly to maintain presence</p>
                        <p className="mb-0">• Connect with other startups to expand network</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-8 py-4 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} Startup Dashboard
            </footer>
        </>
    );
};

export default Dashboard; 
