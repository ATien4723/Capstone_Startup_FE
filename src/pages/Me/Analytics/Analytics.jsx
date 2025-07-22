import { useState } from 'react';
import { analyzeSwot } from '@/apis/swotService';
import { toast } from 'react-toastify';

export default function Analytics() {
    // State cho form dữ liệu
    const [formData, setFormData] = useState({
        startupDescription: '',
        customerSegments: '',
        valuePropositions: '',
        channels: '',
        customerRelationships: '',
        revenueStreams: '',
        keyResources: '',
        keyActivities: '',
        keyPartners: '',
        cost: ''
    });

    // State cho kết quả phân tích
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Gửi dữ liệu để phân tích SWOT
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await analyzeSwot(formData);
            setResult(response);
            toast.success('SWOT analysis completed successfully!');
        } catch (error) {
            console.error('Error during SWOT analysis:', error);
            toast.error('An error occurred during SWOT analysis');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-3 bg-white rounded-lg shadow-md max-w-6xl mx-auto">
            <h1 className="text-xl font-bold mb-3 text-blue-800 text-center">Business Model Canvas &amp; SWOT</h1>

            <div className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-500 rounded text-xs">
                <p className="text-gray-700">Enter details about your startup's business model for SWOT analysis.</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Phần mô tả chung về Startup */}
                <div className="mb-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1 rounded-t-lg">
                        <label className="block text-white font-medium text-xs">

                            Startup Overview
                        </label>
                    </div>
                    <textarea
                        name="startupDescription"
                        value={formData.startupDescription}
                        onChange={handleChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded-b-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                        rows="2"
                        placeholder="Briefly describe your business..."
                        required
                    ></textarea>
                </div>

                {/* Business Model Canvas */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {/* Cột 1 - Bên trái */}
                    <div className="space-y-2">
                        {/* Đối tác chính */}
                        <div className="bg-indigo-50 rounded-lg shadow-sm border border-indigo-100">
                            <div className="bg-indigo-600 p-1 rounded-t-lg">
                                <label className="block text-white font-medium text-center text-xs">

                                    Key Partners
                                </label>
                            </div>
                            <div className="p-1">
                                <textarea
                                    name="keyPartners"
                                    value={formData.keyPartners}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                                    rows="2"
                                    placeholder="Who are your key partners?"
                                    required
                                ></textarea>
                            </div>
                        </div>

                        {/* Hoạt động chính */}
                        <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100">
                            <div className="bg-blue-600 p-1 rounded-t-lg">
                                <label className="block text-white font-medium text-center text-xs">

                                    Key Activities
                                </label>
                            </div>
                            <div className="p-1">
                                <textarea
                                    name="keyActivities"
                                    value={formData.keyActivities}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                    rows="2"
                                    placeholder="What are your key activities?"
                                    required
                                ></textarea>
                            </div>
                        </div>

                        {/* Nguồn lực chính */}
                        <div className="bg-cyan-50 rounded-lg shadow-sm border border-cyan-100">
                            <div className="bg-cyan-600 p-1 rounded-t-lg">
                                <label className="block text-white font-medium text-center text-xs">
                                    Key Resources
                                </label>
                            </div>
                            <div className="p-1">
                                <textarea
                                    name="keyResources"
                                    value={formData.keyResources}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 bg-white border border-cyan-200 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
                                    rows="2"
                                    placeholder="What are your key resources?"
                                    required
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Cột 2 - Giữa */}
                    <div>
                        {/* Đề xuất giá trị */}
                        <div className="bg-red-50 rounded-lg shadow-sm border border-red-100 h-full">
                            <div className="bg-red-600 p-1 rounded-t-lg">
                                <label className="block text-white font-medium text-center text-xs">

                                    Value Propositions
                                </label>
                            </div>
                            <div className="p-1">
                                <textarea
                                    name="valuePropositions"
                                    value={formData.valuePropositions}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 bg-white border border-red-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-xs"
                                    rows="15"
                                    placeholder="What problems does your product/service solve?"
                                    required
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Cột 3 - Bên phải */}
                    <div className="space-y-2">
                        {/* Quan hệ khách hàng */}
                        <div className="bg-amber-50 rounded-lg shadow-sm border border-amber-100">
                            <div className="bg-amber-600 p-1 rounded-t-lg">
                                <label className="block text-white font-medium text-center text-xs">
                                    Customer Relationships
                                </label>
                            </div>
                            <div className="p-1">
                                <textarea
                                    name="customerRelationships"
                                    value={formData.customerRelationships}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 bg-white border border-amber-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                                    rows="2"
                                    placeholder="How do you build relationships?"
                                    required
                                ></textarea>
                            </div>
                        </div>

                        {/* Phân khúc khách hàng */}
                        <div className="bg-green-50 rounded-lg shadow-sm border border-green-100">
                            <div className="bg-green-600 p-1 rounded-t-lg">
                                <label className="block text-white font-medium text-center text-xs">
                                    Customer Segments
                                </label>
                            </div>
                            <div className="p-1">
                                <textarea
                                    name="customerSegments"
                                    value={formData.customerSegments}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 bg-white border border-green-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-xs"
                                    rows="2"
                                    placeholder="Who are your customers?"
                                    required
                                ></textarea>
                            </div>
                        </div>

                        {/* Kênh phân phối */}
                        <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-100">
                            <div className="bg-purple-600 p-1 rounded-t-lg">
                                <label className="block text-white font-medium text-center text-xs">
                                    Channels
                                </label>
                            </div>
                            <div className="p-1">
                                <textarea
                                    name="channels"
                                    value={formData.channels}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 bg-white border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                                    rows="2"
                                    placeholder="How do you reach customers?"
                                    required
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phần cuối - Cấu trúc chi phí và Dòng doanh thu */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {/* Cấu trúc chi phí */}
                    <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                        <div className="bg-gray-700 p-1 rounded-t-lg">
                            <label className="block text-white font-medium text-center text-xs">
                                Cost Structure
                            </label>
                        </div>
                        <div className="p-1">
                            <textarea
                                name="cost"
                                value={formData.cost}
                                onChange={handleChange}
                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-xs"
                                rows="2"
                                placeholder="What are your main costs?"
                                required
                            ></textarea>
                        </div>
                    </div>

                    {/* Dòng doanh thu */}
                    <div className="bg-emerald-50 rounded-lg shadow-sm border border-emerald-200">
                        <div className="bg-emerald-600 p-1 rounded-t-lg">
                            <label className="block text-white font-medium text-center text-xs">
                                Revenue Streams
                            </label>
                        </div>
                        <div className="p-1">
                            <textarea
                                name="revenueStreams"
                                value={formData.revenueStreams}
                                onChange={handleChange}
                                className="w-full px-2 py-1 bg-white border border-emerald-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                                rows="2"
                                placeholder="How do you generate revenue?"
                                required
                            ></textarea>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xs font-medium rounded-lg shadow hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-70"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Analyze SWOT
                            </>
                        )}
                    </button>
                </div>
            </form>

            {result && (
                <div className="mt-4 bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-sm font-semibold mb-2 text-blue-700 text-center">SWOT Analysis Results</h2>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-green-50 p-2 rounded-lg border border-green-200 shadow-sm">
                            <h3 className="text-xs font-medium text-green-700 mb-1 flex items-center">
                                Strengths
                            </h3>
                            <p className="text-gray-800 whitespace-pre-line text-xs">{result.strengths}</p>
                        </div>

                        <div className="bg-red-50 p-2 rounded-lg border border-red-200 shadow-sm">
                            <h3 className="text-xs font-medium text-red-700 mb-1 flex items-center">

                                Weaknesses
                            </h3>
                            <p className="text-gray-800 whitespace-pre-line text-xs">{result.weaknesses}</p>
                        </div>

                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 shadow-sm">
                            <h3 className="text-xs font-medium text-blue-700 mb-1 flex items-center">

                                Opportunities
                            </h3>
                            <p className="text-gray-800 whitespace-pre-line text-xs">{result.opportunities}</p>
                        </div>

                        <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200 shadow-sm">
                            <h3 className="text-xs font-medium text-yellow-700 mb-1 flex items-center">

                                Threats
                            </h3>
                            <p className="text-gray-800 whitespace-pre-line text-xs">{result.threats}</p>
                        </div>

                    </div>
                    <div className="bg-gradient-to-r from-red-100 to-red-300 p-2 rounded-lg border border-yellow-200 shadow-sm">
                        <h3 className="text-xs font-medium text-yellow-700 mb-1 flex items-center">

                            Recommendation
                        </h3>
                        <p className="text-gray-800 whitespace-pre-line text-xs">{result.recommendation}</p>
                    </div>
                </div>
            )}
        </div>
    );
} 