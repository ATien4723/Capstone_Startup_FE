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
        <div className="p-20 mt-2 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-blue-800">SWOT Analysis</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Startup Description
                        </label>
                        <textarea
                            name="startupDescription"
                            value={formData.startupDescription}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer Segments
                        </label>
                        <textarea
                            name="customerSegments"
                            value={formData.customerSegments}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Value Propositions
                        </label>
                        <textarea
                            name="valuePropositions"
                            value={formData.valuePropositions}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Channels
                        </label>
                        <textarea
                            name="channels"
                            value={formData.channels}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer Relationships
                        </label>
                        <textarea
                            name="customerRelationships"
                            value={formData.customerRelationships}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Revenue Streams
                        </label>
                        <textarea
                            name="revenueStreams"
                            value={formData.revenueStreams}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Key Resources
                        </label>
                        <textarea
                            name="keyResources"
                            value={formData.keyResources}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Key Activities
                        </label>
                        <textarea
                            name="keyActivities"
                            value={formData.keyActivities}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Key Partners
                        </label>
                        <textarea
                            name="keyPartners"
                            value={formData.keyPartners}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cost Structure
                        </label>
                        <textarea
                            name="cost"
                            value={formData.cost}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                        {loading ? 'Analyzing...' : 'Analyze SWOT'}
                    </button>
                </div>
            </form>

            {result && (
                <div className="mt-10 bg-gray-50 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 text-blue-700">SWOT Analysis Results</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h3 className="text-lg font-medium text-green-700 mb-2">Strengths</h3>
                            <p className="text-gray-800 whitespace-pre-line">{result.strengths}</p>
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <h3 className="text-lg font-medium text-red-700 mb-2">Weaknesses</h3>
                            <p className="text-gray-800 whitespace-pre-line">{result.weaknesses}</p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-medium text-blue-700 mb-2">Opportunities</h3>
                            <p className="text-gray-800 whitespace-pre-line">{result.opportunities}</p>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <h3 className="text-lg font-medium text-yellow-700 mb-2">Threats</h3>
                            <p className="text-gray-800 whitespace-pre-line">{result.threats}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 