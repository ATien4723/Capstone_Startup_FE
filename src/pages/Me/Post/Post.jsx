import React from 'react';

const Post = () => {
    const posts = [
        {
            id: 1,
            title: 'Tiêu đề bài viết 1',
            date: '01/01/2023',
            excerpt: 'Đây là nội dung tóm tắt của bài viết 1. Bài viết này nói về các chủ đề liên quan đến startup và đổi mới sáng tạo.',
            tags: ['Startup', 'Innovation']
        },
        {
            id: 2,
            title: 'Tiêu đề bài viết 2',
            date: '02/01/2023',
            excerpt: 'Đây là nội dung tóm tắt của bài viết 2. Bài viết này thảo luận về các xu hướng công nghệ mới nhất.',
            tags: ['Technology', 'Trends']
        },
        {
            id: 3,
            title: 'Tiêu đề bài viết 3',
            date: '03/01/2023',
            excerpt: 'Đây là nội dung tóm tắt của bài viết 3. Bài viết này chia sẻ kinh nghiệm về quản lý dự án.',
            tags: ['Project Management']
        }
    ];

    return (
        <>
            {/* Header */}
            <header className="bg-white shadow px-4 py-4 flex justify-between items-center mb-6 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-800">Bài viết</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
                    <i className="fas fa-plus"></i> Tạo bài viết mới
                </button>
            </header>

            {/* Search and Filter */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài viết..."
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Tất cả thể loại</option>
                            <option value="startup">Startup</option>
                            <option value="technology">Technology</option>
                            <option value="management">Management</option>
                        </select>
                        <select className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="popular">Phổ biến nhất</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Posts List */}
            <div className="space-y-6">
                {posts.map(post => (
                    <div key={post.id} className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl font-bold text-gray-800">{post.title}</h2>
                                <span className="text-sm text-gray-500">{post.date}</span>
                            </div>
                            <p className="text-gray-600 mb-4">{post.excerpt}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <div className="flex space-x-2">
                                    <button className="text-blue-600 hover:text-blue-800">
                                        <i className="far fa-eye mr-1"></i> Xem
                                    </button>
                                </div>
                                <div className="flex space-x-2">
                                    <button className="text-gray-600 hover:text-gray-800">
                                        <i className="far fa-edit mr-1"></i> Sửa
                                    </button>
                                    <button className="text-red-600 hover:text-red-800">
                                        <i className="far fa-trash-alt mr-1"></i> Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-8">
                <nav className="inline-flex rounded-md shadow">
                    <button className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
                        Trước
                    </button>
                    <button className="px-3 py-1 border-t border-b border-gray-300 bg-blue-50 text-blue-600 font-medium">
                        1
                    </button>
                    <button className="px-3 py-1 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
                        2
                    </button>
                    <button className="px-3 py-1 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
                        3
                    </button>
                    <button className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
                        Sau
                    </button>
                </nav>
            </div>
        </>
    );
};

export default Post; 