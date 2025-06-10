import React from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import Navbar from "@/components/Navbar/Navbar";

const NAVBAR_HEIGHT = 64; // px, tương ứng h-16

const Dashboard = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col ml-64">
                {/* Navbar (Topbar) fixed */}
                <div className="fixed top-0 left-64 right-0 z-30 w-[calc(100%-16rem)]">
                    <Navbar />
                </div>
                <div className="pt-16 px-4">
                    {/* Topbar */}
                    <header className="bg-white shadow px-4 py-4 flex justify-between items-center mb-6 rounded-lg">
                        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
                            <i className="fas fa-download"></i> Generate Report
                        </button>
                    </header>

                    {/* Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white border-l-4 border-blue-500 shadow rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-blue-500 uppercase mb-1">Earnings (Monthly)</div>
                                <div className="text-xl font-bold text-gray-800">$40,000</div>
                            </div>
                            <i className="fas fa-calendar fa-2x text-gray-300"></i>
                        </div>
                        <div className="bg-white border-l-4 border-green-500 shadow rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-green-500 uppercase mb-1">Earnings (Annual)</div>
                                <div className="text-xl font-bold text-gray-800">$215,000</div>
                            </div>
                            <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                        </div>
                        <div className="bg-white border-l-4 border-cyan-500 shadow rounded-lg p-4 flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-xs font-bold text-cyan-500 uppercase">Tasks</div>
                                <div className="text-xl font-bold text-gray-800">50%</div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: '50%' }}></div>
                            </div>
                            <div className="flex justify-end mt-2">
                                <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                            </div>
                        </div>
                        <div className="bg-white border-l-4 border-yellow-500 shadow rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-yellow-500 uppercase mb-1">Pending Requests</div>
                                <div className="text-xl font-bold text-gray-800">18</div>
                            </div>
                            <i className="fas fa-comments fa-2x text-gray-300"></i>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                        <div className="xl:col-span-2 bg-white shadow rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h6 className="font-bold text-blue-600">Earnings Overview</h6>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-ellipsis-v"></i>
                                </button>
                            </div>
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                {/* Chart placeholder */}
                                <span>Area Chart (Chart.js hoặc thư viện khác)</span>
                            </div>
                        </div>
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h6 className="font-bold text-blue-600">Revenue Sources</h6>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-ellipsis-v"></i>
                                </button>
                            </div>
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                {/* Chart placeholder */}
                                <span>Pie Chart (Chart.js hoặc thư viện khác)</span>
                            </div>
                            <div className="mt-4 text-center text-sm">
                                <span className="mr-2"><i className="fas fa-circle text-blue-500"></i> Direct</span>
                                <span className="mr-2"><i className="fas fa-circle text-green-500"></i> Social</span>
                                <span className="mr-2"><i className="fas fa-circle text-cyan-500"></i> Referral</span>
                            </div>
                        </div>
                    </div>

                    {/* Projects & Color System */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div>
                            <div className="bg-white shadow rounded-lg mb-6 p-6">
                                <h6 className="font-bold text-blue-600 mb-4">Projects</h6>
                                <div className="mb-4">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium">Server Migration</span>
                                        <span className="text-sm">20%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium">Sales Tracking</span>
                                        <span className="text-sm">40%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium">Customer Database</span>
                                        <span className="text-sm">60%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                        <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium">Payout Details</span>
                                        <span className="text-sm">80%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                        <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium">Account Setup</span>
                                        <span className="text-sm">Complete!</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                            {/* Color System */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-600 text-white rounded-lg shadow p-4">Primary<div className="text-white/70 text-xs">#4e73df</div></div>
                                <div className="bg-green-500 text-white rounded-lg shadow p-4">Success<div className="text-white/70 text-xs">#1cc88a</div></div>
                                <div className="bg-cyan-500 text-white rounded-lg shadow p-4">Info<div className="text-white/70 text-xs">#36b9cc</div></div>
                                <div className="bg-yellow-400 text-white rounded-lg shadow p-4">Warning<div className="text-white/70 text-xs">#f6c23e</div></div>
                                <div className="bg-red-500 text-white rounded-lg shadow p-4">Danger<div className="text-white/70 text-xs">#e74a3b</div></div>
                                <div className="bg-gray-500 text-white rounded-lg shadow p-4">Secondary<div className="text-white/70 text-xs">#858796</div></div>
                                <div className="bg-gray-100 text-black rounded-lg shadow p-4">Light<div className="text-black/50 text-xs">#f8f9fc</div></div>
                                <div className="bg-gray-800 text-white rounded-lg shadow p-4">Dark<div className="text-white/70 text-xs">#5a5c69</div></div>
                            </div>
                        </div>
                        {/* Illustrations & Approach */}
                        <div>
                            <div className="bg-white shadow rounded-lg mb-6 p-6">
                                <h6 className="font-bold text-blue-600 mb-4">Illustrations</h6>
                                <div className="flex justify-center mb-4">
                                    <img className="w-64" src="/img/undraw_posting_photo.svg" alt="..." />
                                </div>
                                <p className="mb-2">Add some quality, svg illustrations to your project courtesy of <a className="text-blue-600 hover:underline" href="https://undraw.co/" target="_blank" rel="noopener noreferrer">unDraw</a>, a constantly updated collection of beautiful svg images that you can use completely free and without attribution!</p>
                                <a className="text-blue-600 hover:underline" href="https://undraw.co/" target="_blank" rel="noopener noreferrer">Browse Illustrations on unDraw &rarr;</a>
                            </div>
                            <div className="bg-white shadow rounded-lg p-6">
                                <h6 className="font-bold text-blue-600 mb-4">Development Approach</h6>
                                <p className="mb-2">SB Admin 2 makes extensive use of Bootstrap 4 utility classes in order to reduce CSS bloat and poor page performance. Custom CSS classes are used to create custom components and custom utility classes.</p>
                                <p className="mb-0">Before working with this theme, you should become familiar with the Bootstrap framework, especially the utility classes.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="mt-8 py-4 text-center text-gray-500 text-sm">
                        Copyright &copy; Your Website 2021
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 