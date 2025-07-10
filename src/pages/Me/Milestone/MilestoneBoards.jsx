import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisV, faPencilAlt, faTrashAlt, faChartLine, faUserPlus, faStar } from '@fortawesome/free-solid-svg-icons';
import useTask from "@/hooks/useTaskBoard";

const MilestoneBoards = () => {
    const navigate = useNavigate();
    const {
        // Data
        loading,
        startupId,
        milestones,

        // UI states
        showNewBoardForm,
        showAddMemberForm,
        editingBoard,
        boardFormData,
        searchQuery,
        filterFavorites,
        newMember,
        openDropdownId,
        dropdownRefs,
        colorOptions,

        // Handlers
        fetchStartupId,
        handleAddBoard,
        handleEditBoard,
        handleSaveBoard,
        handleDeleteBoard,
        toggleDropdown,
        handleOpenAddMemberForm,
        handleAddMember,
        toggleFavorite,
        getFilteredMilestones,
        navigateToMilestoneDetail,

        // State setters
        setShowNewBoardForm,
        setShowAddMemberForm,
        setBoardFormData,
        setNewMember
    } = useTask();

    // Lấy startupId khi component mount
    React.useEffect(() => {
        fetchStartupId();
    }, []);

    // Điều hướng đến trang chi tiết của bảng
    const navigateToBoard = (boardId) => {
        // Sử dụng hàm từ hook để lưu dữ liệu mẫu vào localStorage

        // navigate(`/me/milestones/${boardId}`);
        const url = navigateToMilestoneDetail(boardId);
        navigate(url);
    };

    // Lấy danh sách boards đã được lọc
    const filteredBoards = getFilteredMilestones();

    // Thêm hàm xác định màu dựa trên ID
    const getBoardColor = (id) => {
        // Chuyển đổi id thành string để xử lý an toàn
        const boardId = String(id);

        // ID 1 và 2 cùng một màu
        if (boardId === '1' || boardId === '2') {
            return 'bg-purple-500';
        }
        // ID 3 một màu khác
        else if (boardId === '3') {
            return 'bg-amber-500';
        }
        else if (boardId === '4') {
            return 'bg-green-500';
        }
        // Các ID khác sẽ dùng màu từ đối tượng board hoặc mặc định
        else {
            return 'bg-blue-500';
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            {/* Tiêu đề và nút thêm bảng */}
            <header className="bg-white shadow-md px-6 py-5 flex justify-between items-center mb-8 rounded-xl">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý dự án</h1>
                <button
                    onClick={handleAddBoard}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                >
                    <FontAwesomeIcon icon={faPlus} /> Thêm bảng mới
                </button>
            </header>

            {/* Thanh tìm kiếm và lọc */}
            {/* <div className="bg-white p-4 rounded-xl shadow-md mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-grow max-w-md">
                        <input
                            type="text"
                            placeholder="Tìm kiếm dự án..."
                            className="pl-4 pr-4 py-2.5 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center">
                        <button
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${filterFavorites ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            onClick={() => setFilterFavorites(!filterFavorites)}
                        >
                            <FontAwesomeIcon icon={faStar} className={filterFavorites ? 'text-amber-500' : 'text-gray-400'} />
                            Yêu thích
                        </button>
                    </div>
                </div>
            </div> */}

            {/* Form thêm/sửa bảng */}
            {showNewBoardForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
                        <h2 className="text-xl font-bold mb-4">
                            {editingBoard ? 'Chỉnh sửa bảng' : 'Thêm bảng mới'}
                        </h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2 font-medium">Tên bảng:</label>
                            <input
                                type="text"
                                value={boardFormData.title}
                                onChange={(e) => setBoardFormData({ ...boardFormData, title: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập tên bảng"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2 font-medium">Mô tả:</label>
                            <textarea
                                value={boardFormData.description}
                                onChange={(e) => setBoardFormData({ ...boardFormData, description: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Mô tả về bảng"
                                rows="3"
                            ></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2 font-medium">Màu sắc:</label>
                            <div className="grid grid-cols-3 gap-2">
                                {colorOptions.map(color => (
                                    <div
                                        key={color.value}
                                        className={`h-10 rounded-lg cursor-pointer border-2 ${boardFormData.color === color.value ? 'border-black shadow-inner' : 'border-transparent'} ${color.value} transition-all duration-200 hover:opacity-90`}
                                        onClick={() => setBoardFormData({ ...boardFormData, color: color.value })}
                                        title={color.label}
                                    ></div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg mr-2 hover:bg-gray-300 transition-colors"
                                onClick={() => setShowNewBoardForm(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                                onClick={handleSaveBoard}
                                disabled={loading}
                            >
                                {loading ? 'Đang xử lý...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form thêm thành viên */}
            {showAddMemberForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
                        <h2 className="text-xl font-bold mb-4">Thêm thành viên mới</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2 font-medium">Tên thành viên:</label>
                            <input
                                type="text"
                                value={newMember}
                                onChange={(e) => setNewMember(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập tên thành viên"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg mr-2 hover:bg-gray-300 transition-colors"
                                onClick={() => setShowAddMemberForm(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                                onClick={handleAddMember}
                                disabled={loading}
                            >
                                {loading ? 'Đang xử lý...' : 'Thêm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading indicator */}
            {loading && (
                <div className="bg-white p-8 rounded-xl shadow text-center">
                    <p className="text-gray-500 text-lg">Đang tải dữ liệu...</p>
                </div>
            )}

            {/* Thông báo nếu không có kết quả tìm kiếm */}
            {!loading && filteredBoards.length === 0 && (
                <div className="bg-white p-8 rounded-xl shadow text-center">
                    <p className="text-gray-500 text-lg">Không tìm thấy dự án nào phù hợp với tìm kiếm của bạn</p>
                </div>
            )}

            {/* Danh sách các bảng */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBoards.map(board => (
                    <div
                        key={board.milestoneId || board.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden group transform hover:-translate-y-1"
                    >
                        {/* Gán màu tạm thời dựa trên ID milestone */}
                        <div className={`${getBoardColor(board.milestoneId || board.id)} h-2.5`}></div>
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg mb-1 text-gray-800 line-clamp-1">{board.name}</h3>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(board.milestoneId || board.id);
                                        }}
                                        className="text-lg transition-transform duration-300 hover:scale-110"
                                        title={board.isFavorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
                                    >
                                        <FontAwesomeIcon
                                            icon={faStar}
                                            className={board.isFavorite ? "text-amber-400" : "text-gray-300 opacity-0 group-hover:opacity-100"}
                                        />
                                    </button>
                                </div>
                                <div
                                    className="dropdown relative"
                                    ref={el => dropdownRefs.current[board.milestoneId || board.id] = el}
                                >
                                    <button
                                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                        onClick={() => toggleDropdown(board.milestoneId || board.id)}
                                    >
                                        <FontAwesomeIcon icon={faEllipsisV} />
                                    </button>
                                    {openDropdownId === (board.milestoneId || board.id) && (
                                        <div className="absolute right-0 mt-2 bg-white shadow-xl rounded-lg z-50 py-1 min-w-[160px] border border-gray-100 animate-fadeIn">
                                            <button
                                                className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                onClick={() => handleEditBoard(board)}
                                            >
                                                <FontAwesomeIcon icon={faPencilAlt} className="mr-2" /> Chỉnh sửa
                                            </button>
                                            <button
                                                className="block w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                                onClick={() => handleOpenAddMemberForm(board.milestoneId || board.id)}
                                            >
                                                <FontAwesomeIcon icon={faUserPlus} className="mr-2" /> Thêm thành viên
                                            </button>
                                            <button
                                                className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                onClick={() => handleDeleteBoard(board.milestoneId || board.id)}
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} className="mr-2" /> Xóa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2 h-12">{board.milestoneDescription || board.description}</p>

                            {/* Hiển thị thành viên */}
                            <div className="flex flex-wrap items-center mb-4">
                                {board.members && board.members.length > 0 ? (
                                    <div className="flex -space-x-2 mr-2">
                                        {board.members.slice(0, 3).map((member, index) => (
                                            <div
                                                key={index}
                                                className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-xs font-medium border-2 border-white text-white shadow-sm"
                                                title={member}
                                            >
                                                {typeof member === 'string' ? member.substring(0, 2) : 'N/A'}
                                            </div>
                                        ))}
                                        {board.members.length > 3 && (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm">
                                                +{board.members.length - 3}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500 italic">Chưa có thành viên</span>
                                )}
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={() => navigateToBoard(board.milestoneId || board.id)}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-lg flex items-center justify-center transition-all duration-300 hover:shadow-md"
                                >
                                    <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MilestoneBoards; 