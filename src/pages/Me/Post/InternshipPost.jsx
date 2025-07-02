import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faTrashAlt, faListUl, faCalendarAlt, faMapMarkerAlt, faCoins, faUsers, faFileAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import useStartupPost from '@/hooks/useStartupPost';
import { getUserId } from '@/apis/authService';
import { formatVietnameseDate } from '@/utils/dateUtils';

const InternshipPost = () => {
    const {
        // State
        internshipPosts,
        showCreateModal,
        loading,
        loadingPosts,
        formData,
        positionRequirements,
        showPositionModal,
        positionFormData,
        loadingPositions,
        positions,
        userStartups,
        userStartupId,
        pagination,

        // Setters
        setShowCreateModal,
        setShowPositionModal,

        // Handlers
        handleInputChange,
        handleSubmit,
        handlePositionInputChange,
        handlePositionSubmit,
        handleEditPosition,
        handleDeletePosition,
        handlePageChange,
        resetPositionForm,
        fetchInternshipPosts
    } = useStartupPost();

    // Format date using dateUtils
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return formatVietnameseDate(dateString);
        } catch (error) {
            return dateString;
        }
    };

    return (
        <>
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg px-6 py-6 flex justify-between items-center mb-8 rounded-xl text-white">
                <h1 className="text-3xl font-bold">Bài đăng tuyển thực tập</h1>
                <div className="flex space-x-3">
                    <button
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition duration-200 flex items-center gap-2 font-medium"
                        onClick={() => setShowPositionModal(true)}
                    >
                        <FontAwesomeIcon icon={faListUl} /> Quản lý vị trí
                    </button>
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition duration-200 flex items-center gap-2 font-medium"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} /> Tạo bài đăng mới
                    </button>
                </div>
            </header>

            {/* Search and Filter */}
            <div className="bg-white shadow-md rounded-xl p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài đăng tuyển thực tập..."
                            className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white hover:border-gray-300 transition">
                            <option value="">Tất cả lĩnh vực</option>
                            <option value="frontend">Frontend</option>
                            <option value="backend">Backend</option>
                            <option value="design">Design</option>
                        </select>
                        <select className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white hover:border-gray-300 transition">
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="popular">Phổ biến nhất</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Internship Posts List */}
            {loadingPosts ? (
                <div className="bg-white shadow-md rounded-xl p-16 text-center">
                    <div className="flex justify-center items-center">
                        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin" />
                    </div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            ) : internshipPosts.length === 0 ? (
                <div className="bg-white shadow-md rounded-xl p-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                        <FontAwesomeIcon icon={faFileAlt} className="text-3xl text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Chưa có bài đăng nào</h3>
                    <p className="text-gray-500 mb-6">Tạo bài đăng thực tập đầu tiên của bạn để hiển thị ở đây</p>
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition duration-200 font-medium"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Tạo bài đăng mới
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {internshipPosts.map(post => (
                        <div key={post.id} className="bg-white shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl overflow-hidden border border-gray-100 hover:border-blue-200">
                            <div className="p-6">
                                <span className="inline-block px-3 py-1 mb-3 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                    {post.isActive ? 'Đang tuyển' : 'Đã đóng'}
                                </span>
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">{post.title}</h2>
                                </div>
                                <p className="text-gray-600 mb-5 line-clamp-3">{post.excerpt || post.description}</p>

                                <div className="mb-5">
                                    <div className="flex items-center text-gray-500 mb-2">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400" />
                                        <span className="text-sm">Đăng ngày: {post.date || formatDate(post.createAt)}</span>
                                    </div>
                                    <div className="flex items-center text-gray-500 mb-2">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-400" />
                                        <span className="text-sm">{post.address || 'Không có địa chỉ'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-500">
                                        <FontAwesomeIcon icon={faCoins} className="mr-2 text-gray-400" />
                                        <span className="text-sm">{post.salary || 'Thương lượng'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-5">
                                    {post.positionRequirement?.title ? (
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full hover:bg-gray-200 transition duration-200 cursor-default">
                                            {post.positionRequirement.title}
                                        </span>
                                    ) : post.tags ? (
                                        post.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full hover:bg-gray-200 transition duration-200 cursor-default"
                                            >
                                                {tag}
                                            </span>
                                        ))
                                    ) : null}
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <button className="text-blue-600 hover:text-blue-800 transition-colors flex items-center text-sm font-medium">
                                        <FontAwesomeIcon icon={faEye} className="mr-1.5" /> Xem chi tiết
                                    </button>
                                    <div className="flex space-x-2">
                                        <button className="text-gray-500 hover:text-blue-600 transition-colors p-1.5 rounded-full hover:bg-blue-50">
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button className="text-gray-500 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-red-50">
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loadingPosts && internshipPosts.length > 0 && (
                <div className="flex justify-center mt-10">
                    <nav className="inline-flex rounded-lg shadow-sm overflow-hidden">
                        <button
                            className={`px-4 py-2 border border-gray-300 ${pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'} transition font-medium text-sm`}
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                        >
                            Trước
                        </button>

                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                            // Logic để hiển thị các nút trang xung quanh trang hiện tại
                            let pageToShow = i + 1;
                            if (pagination.totalPages > 5) {
                                if (pagination.currentPage > 3) {
                                    pageToShow = pagination.currentPage - 3 + i;
                                }
                                if (pageToShow > pagination.totalPages) {
                                    pageToShow = pagination.totalPages - (4 - i);
                                }
                            }

                            return (
                                <button
                                    key={pageToShow}
                                    className={`px-4 py-2 ${pagination.currentPage === pageToShow ? 'border-t border-b border-gray-300 bg-blue-50 text-blue-600' : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} transition font-medium text-sm`}
                                    onClick={() => handlePageChange(pageToShow)}
                                >
                                    {pageToShow}
                                </button>
                            );
                        })}

                        <button
                            className={`px-4 py-2 border border-gray-300 ${pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'} transition font-medium text-sm`}
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                        >
                            Sau
                        </button>
                    </nav>
                </div>
            )}

            {/* Modal quản lý vị trí */}
            {showPositionModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Overlay */}
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={() => setShowPositionModal(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        {/* Modal content */}
                        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full md:max-w-2xl">
                            <div className="bg-white px-6 pt-6 pb-5">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {positionFormData.isEditing ? 'Cập nhật vị trí' : 'Tạo vị trí mới'}
                                    </h3>
                                    <button
                                        onClick={() => setShowPositionModal(false)}
                                        className="text-gray-400 hover:text-gray-600 transition"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handlePositionSubmit} className="mb-6">
                                    <div className="space-y-4">
                                        {/* Tiêu đề */}
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Tên vị trí</label>
                                            <input
                                                type="text"
                                                id="title"
                                                name="title"
                                                value={positionFormData.title}
                                                onChange={handlePositionInputChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder="Ví dụ: Frontend Developer"
                                                required
                                            />
                                        </div>

                                        {/* Mô tả */}
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Mô tả vị trí</label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={positionFormData.description}
                                                onChange={handlePositionInputChange}
                                                rows="3"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder="Mô tả chi tiết về vị trí này..."
                                                required
                                            ></textarea>
                                        </div>

                                        {/* Yêu cầu */}
                                        <div>
                                            <label htmlFor="requirement" className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu ứng viên</label>
                                            <textarea
                                                id="requirement"
                                                name="requirement"
                                                value={positionFormData.requirement}
                                                onChange={handlePositionInputChange}
                                                rows="3"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder="Kỹ năng, kinh nghiệm yêu cầu..."
                                                required
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex justify-end space-x-3">
                                        {positionFormData.isEditing && (
                                            <button
                                                type="button"
                                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-medium"
                                                onClick={resetPositionForm}
                                            >
                                                Hủy chỉnh sửa
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium"
                                            disabled={loadingPositions}
                                        >
                                            {loadingPositions ? 'Đang xử lý...' : positionFormData.isEditing ? 'Cập nhật' : 'Tạo mới'}
                                        </button>
                                    </div>
                                </form>

                                <hr className="my-5" />

                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium text-gray-800">Danh sách vị trí</h4>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                        {positionRequirements.length} vị trí
                                    </span>
                                </div>

                                {loadingPositions ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
                                    </div>
                                ) : positionRequirements.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-gray-200 rounded-full">
                                            <FontAwesomeIcon icon={faUsers} className="text-2xl text-gray-400" />
                                        </div>
                                        <p className="text-gray-500">Chưa có vị trí nào</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                                        {positionRequirements.map(position => (
                                            <div key={position.positionId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex justify-between items-center bg-white">
                                                <div>
                                                    <h5 className="font-medium text-gray-800">{position.title}</h5>
                                                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">{position.description}</p>
                                                </div>
                                                <div className="flex space-x-2 ml-4">
                                                    <button
                                                        className="text-gray-500 hover:text-blue-600 transition p-1.5 rounded-full hover:bg-blue-50"
                                                        onClick={() => handleEditPosition(position)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                    <button
                                                        className="text-gray-500 hover:text-red-600 transition p-1.5 rounded-full hover:bg-red-50"
                                                        onClick={() => handleDeletePosition(position.positionId)}
                                                        title="Xóa"
                                                    >
                                                        <FontAwesomeIcon icon={faTrashAlt} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-5">
                                    <button
                                        type="button"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-medium"
                                        onClick={() => setShowPositionModal(false)}
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal tạo bài đăng thực tập mới */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Overlay */}
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={() => setShowCreateModal(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        {/* Modal content */}
                        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full md:max-w-2xl">
                            <div className="bg-white px-6 pt-6 pb-5">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-xl font-semibold text-gray-900">Tạo bài đăng tuyển thực tập mới</h3>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="text-gray-400 hover:text-gray-600 transition"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Vị trí */}
                                        <div className="col-span-2">
                                            <label htmlFor="position_ID" className="block text-sm font-medium text-gray-700 mb-1">Vị trí tuyển dụng</label>
                                            <select
                                                id="position_ID"
                                                name="position_ID"
                                                value={formData.position_ID}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                required
                                            >
                                                <option value="">Chọn vị trí</option>
                                                {positions.map(position => (
                                                    <option key={position.id} value={position.id}>{position.name}</option>
                                                ))}
                                            </select>
                                            {/* <div className="mt-1 flex justify-end">
                                                <button
                                                    type="button"
                                                    className="text-sm text-blue-600 hover:text-blue-800 transition"
                                                    onClick={() => setShowPositionModal(true)}
                                                >
                                                    + Thêm vị trí mới
                                                </button>
                                            </div> */}
                                        </div>

                                        {/* Tiêu đề */}
                                        <div className="col-span-2">
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                                            <input
                                                type="text"
                                                id="title"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder="Ví dụ: Tuyển thực tập sinh UX/UI Designer"
                                                required
                                            />
                                        </div>

                                        {/* Mô tả */}
                                        <div className="col-span-2">
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Mô tả công việc</label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder="Mô tả chi tiết về công việc thực tập..."
                                                required
                                            ></textarea>
                                        </div>

                                        {/* Yêu cầu */}
                                        <div className="col-span-2">
                                            <label htmlFor="requirement" className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu ứng viên</label>
                                            <textarea
                                                id="requirement"
                                                name="requirement"
                                                value={formData.requirement}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder="Các kỹ năng, kinh nghiệm, chuyên môn yêu cầu..."
                                                required
                                            ></textarea>
                                        </div>

                                        {/* Quyền lợi */}
                                        <div className="col-span-2">
                                            <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-1">Quyền lợi</label>
                                            <textarea
                                                id="benefits"
                                                name="benefits"
                                                value={formData.benefits}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder="Chế độ thưởng, đãi ngộ, môi trường làm việc..."
                                                required
                                            ></textarea>
                                        </div>

                                        {/* Địa chỉ */}
                                        <div className="col-span-2">
                                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ làm việc</label>
                                            <div className="relative">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    id="address"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                    placeholder="Ví dụ: 123 Đường ABC, Quận 1, TP HCM"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Lương */}
                                        <div className="col-span-1">
                                            <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">Mức lương</label>
                                            <div className="relative">
                                                <FontAwesomeIcon icon={faCoins} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    id="salary"
                                                    name="salary"
                                                    value={formData.salary}
                                                    onChange={handleInputChange}
                                                    placeholder="VD: 5-7 triệu/tháng"
                                                    className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Hạn nộp hồ sơ */}
                                        <div className="col-span-1">
                                            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp hồ sơ</label>
                                            <div className="relative">
                                                <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="datetime-local"
                                                    id="deadline"
                                                    name="deadline"
                                                    value={formData.deadline}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="submit"
                                            className="w-full sm:w-auto sm:ml-3 mb-3 sm:mb-0 inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition font-medium"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Đang xử lý...
                                                </>
                                            ) : 'Tạo bài đăng'}
                                        </button>
                                        <button
                                            type="button"
                                            className="w-full sm:w-auto inline-flex justify-center items-center px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition font-medium"
                                            onClick={() => setShowCreateModal(false)}
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom scrollbar style
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #c5c5c5;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #a0a0a0;
                }
            `}</style> */}
        </>
    );
};

export default InternshipPost;