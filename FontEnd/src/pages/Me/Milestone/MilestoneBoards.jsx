import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisV, faPencilAlt, faTrashAlt, faChartLine, faUserPlus, faStar, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import useTask from "@/hooks/useTaskBoard";
import { useAuth } from "@/contexts/AuthContext";
import { getMembersInMilestone } from "@/apis/taskService";

const MilestoneBoards = () => {
    const navigate = useNavigate();
    const {
        // Data
        loading,
        startupId,
        milestones,
        currentBoardId,

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

        // Member search states
        memberSearchQuery,
        searchResults,
        isSearching,
        selectedMembers,
        startupMembers,

        // Handlers
        fetchStartupId,
        handleAddBoard,
        handleEditBoard,
        handleSaveBoard,
        handleDeleteBoard,
        toggleDropdown,
        handleOpenAddMemberForm,
        handleCloseAddMemberForm,
        handleAddMember,
        toggleFavorite,
        getFilteredMilestones,
        navigateToMilestoneDetail,
        searchMembers,

        // State setters
        setShowNewBoardForm,
        setShowAddMemberForm,
        setBoardFormData,
        setNewMember,
        setMemberSearchQuery,
        setSearchResults,
        setIsSearching,
        addToSelectedMembers,
        removeFromSelectedMembers
    } = useTask();

    // Lấy startupId khi component mount
    React.useEffect(() => {
        fetchStartupId();
    }, []);

    // Lấy user hiện tại
    const { user } = useAuth();


    // Helper: kiểm tra member đã được chọn hoặc đã thuộc board hiện tại chưa
    const isMemberAlreadyAdded = (member) => {
        // Đã nằm trong selectedMembers
        const selected = selectedMembers.some(m => String(m.accountId) === String(member.accountId));

        // Đã nằm trong board hiện tại
        const board = milestones.find(b => String(b.milestoneId || b.id) === String(currentBoardId));
        const inBoard = Array.isArray(board?.members) && board.members.some(m => {
            if (typeof m === 'object') {
                return (m.accountId && String(m.accountId) === String(member.accountId))
                    || (m.memberid && String(m.memberid) === String(member.memberid))
                    || (m.email && m.email === member.email);
            }
            return false;
        });

        return selected || inBoard;
    };

    // Điều hướng đến trang chi tiết của bảng (chỉ nếu user là member của milestone)
    const navigateToBoard = async (boardId) => {
        try {
            const userId = user?.id;
            if (!userId) return;

            // Gọi API kiểm tra thành viên trong milestone
            const members = await getMembersInMilestone(boardId);
            const isMember = Array.isArray(members) && members.some(m => String(m.accountId) === String(userId));
            if (!isMember) {
                return; // Không cho vào nếu không phải member
            }

            const url = navigateToMilestoneDetail(boardId);
            navigate(url);
        } catch (e) {
            console.error('Error checking milestone membership:', e);
        }
    };

    // Lấy danh sách boards đã được lọc
    const filteredBoards = getFilteredMilestones();

    // Set các milestone mà user là member (để hiển thị View Details)
    const [memberMilestoneIds, setMemberMilestoneIds] = React.useState(new Set());

    React.useEffect(() => {
        const loadMembership = async () => {
            if (!user?.id) return;
            const ids = new Set();
            await Promise.all((filteredBoards || []).map(async (board) => {
                const id = board.milestoneId || board.id;
                try {
                    const members = await getMembersInMilestone(id);
                    const isMember = Array.isArray(members) && members.some(m => String(m.accountId) === String(user.id));
                    if (isMember) ids.add(String(id));
                } catch (e) {
                    console.error('Không tải được members cho milestone', id, e);
                }
            }));
            setMemberMilestoneIds(ids);
        };
        loadMembership();
    }, [filteredBoards, user]);

    // Thêm hàm xác định màu dựa trên ID
    const getBoardColor = () => {
        return 'bg-blue-500';
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            {/* Tiêu đề và nút thêm bảng */}
            <header className="bg-white shadow-md px-6 py-5 flex justify-between items-center mb-8 rounded-xl">
                <h1 className="text-2xl font-bold text-gray-800">Project Management</h1>
                {/* Nút Add New Board */}
                <button
                    onClick={handleAddBoard}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                >
                    <FontAwesomeIcon icon={faPlus} /> Add New Board
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
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl animate-fadeIn">
                        <h2 className="text-xl font-bold mb-4">
                            {editingBoard ? 'Edit Board' : 'Add New Board'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Board Name:</label>
                                    <input
                                        type="text"
                                        value={boardFormData.title}
                                        onChange={(e) => setBoardFormData({ ...boardFormData, title: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter board name"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Description:</label>
                                    <textarea
                                        value={boardFormData.description}
                                        onChange={(e) => setBoardFormData({ ...boardFormData, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Board description"
                                        rows="5"
                                    ></textarea>
                                </div>
                            </div>
                            <div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Start Date:</label>
                                    <input
                                        type="date"
                                        value={boardFormData.startDate || ''}
                                        onChange={(e) => setBoardFormData({ ...boardFormData, startDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">End Date:</label>
                                    <input
                                        type="date"
                                        value={boardFormData.endDate || ''}
                                        onChange={(e) => setBoardFormData({ ...boardFormData, endDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                {/* <div className="mb-4">
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
                                </div> */}
                            </div>
                        </div>
                        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
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
                                {loading ? 'Processing...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form thêm thành viên */}
            {showAddMemberForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg animate-fadeIn">
                        <h2 className="text-xl font-bold mb-4">Add Members to Project</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2 font-medium">Search Users:</label>
                            <div className="relative flex">
                                <input
                                    type="text"
                                    value={memberSearchQuery}
                                    onChange={(e) => {
                                        setMemberSearchQuery(e.target.value);
                                        console.log("Input changed:", e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            console.log("Search triggered by Enter key:", memberSearchQuery);
                                            searchMembers(memberSearchQuery);
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-l-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter email or username..."
                                />
                                {/* <button
                                    onClick={() => searchMembers(memberSearchQuery)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-0 rounded-r-lg transition-colors"
                                >
                                    Tìm
                                </button> */}
                            </div>
                        </div>

                        {/* Trạng thái tìm kiếm */}
                        {isSearching && (
                            <div className="my-4 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-r-2 border-blue-500 mr-2"></div>
                                <span className="text-gray-600">Searching...</span>
                            </div>
                        )}

                        {/* Thông báo không có kết quả */}
                        {!isSearching && memberSearchQuery.trim() && searchResults.length === 0 && (
                            <div className="my-4 text-center text-gray-500">
                                No matching members found
                            </div>
                        )}

                        {/* Kết quả tìm kiếm */}
                        {searchResults.length > 0 && (
                            <div className="mb-4">
                                <h3 className="font-medium text-gray-700 mb-2">Search Results:</h3>
                                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.accountId}
                                            className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                            onClick={() => { if (!isMemberAlreadyAdded(user)) addToSelectedMembers(user); }}
                                        >
                                            <div className="flex items-center">
                                                {user.avatarUrl ? (
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt={user.fullName || user.email}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                                        {user.fullName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                                <div className="ml-2">
                                                    <div className="font-medium">{user.fullName || user.email}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                            {isMemberAlreadyAdded(user) ? (
                                                <span className="text-gray-400 text-sm">Added</span>
                                            ) : (
                                                <button
                                                    className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToSelectedMembers(user);
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Thành viên đã chọn */}
                        <div className="mb-4">
                            <h3 className="font-medium text-gray-700 mb-2">Selected Members:</h3>
                            {selectedMembers.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {selectedMembers.map((member) => (
                                        <div
                                            key={member.accountId}
                                            className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full flex items-center gap-1.5"
                                        >
                                            <span className="text-sm font-medium">{member.fullName || member.email}</span>
                                            <button
                                                className="text-blue-700 hover:text-blue-900"
                                                onClick={() => removeFromSelectedMembers(member.accountId)}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No members selected yet</p>
                            )}
                        </div>

                        {/* Danh sách thành viên startup */}
                        {startupMembers.length > 0 && (
                            <div className="mb-4">
                                <h3 className="font-medium text-gray-700 mb-2">Startup Members:</h3>
                                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                    {startupMembers.map((member) => (
                                        <div
                                            key={member.accountId}
                                            className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                            onClick={() => { if (!isMemberAlreadyAdded(member)) addToSelectedMembers(member); }}
                                        >
                                            <div className="flex items-center">
                                                {member.avatarUrl ? (
                                                    <img
                                                        src={member.avatarUrl}
                                                        alt={member.fullName || member.email}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                                                        {member.fullName?.charAt(0) || member.email?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                                <div className="ml-2">
                                                    <div className="font-medium">{member.fullName}</div>
                                                    <div className="text-xs text-gray-500">{member.email}</div>
                                                </div>
                                            </div>
                                            {isMemberAlreadyAdded(member) ? (
                                                <span className="text-gray-400 text-sm">Added</span>
                                            ) : (
                                                <button
                                                    className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToSelectedMembers(member);
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                            <button
                                className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg mr-2 hover:bg-gray-300 transition-colors"
                                onClick={handleCloseAddMemberForm}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                                onClick={handleAddMember}
                                disabled={loading || selectedMembers.length === 0}
                            >
                                {loading ? 'Processing...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading indicator */}
            {loading && (
                <div className="bg-white p-8 rounded-xl shadow text-center">
                    <p className="text-gray-500 text-lg">Loading data...</p>
                </div>
            )}

            {/* Thông báo nếu không có kết quả tìm kiếm */}
            {!loading && filteredBoards.length === 0 && (
                <div className="bg-white p-8 rounded-xl shadow text-center">
                    <p className="text-gray-500 text-lg">No projects found matching your search</p>
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
                                        title={board.isFavorite ? "Remove from favorites" : "Add to favorites"}
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
                                    {/* Menu ellipsis */}
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
                                                <FontAwesomeIcon icon={faPencilAlt} className="mr-2" /> Edit
                                            </button>
                                            <button
                                                className="block w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                                onClick={() => handleOpenAddMemberForm(board.milestoneId || board.id)}
                                            >
                                                <FontAwesomeIcon icon={faUserPlus} className="mr-2" /> Add Members
                                            </button>
                                            <button
                                                className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                onClick={() => handleDeleteBoard(board.milestoneId || board.id)}
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} className="mr-2" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2 h-12">{board.description || board.milestoneDescription}</p>

                            {/* Hiển thị thời gian */}
                            {(board.startDate || board.endDate) && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500" />
                                    <span>
                                        {board.startDate && new Date(board.startDate).toLocaleDateString('vi-VN')}
                                        {board.startDate && board.endDate && ' - '}
                                        {board.endDate && new Date(board.endDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            )}

                            {/* Hiển thị thành viên */}
                            <div className="flex flex-wrap items-center mb-4">
                                {board.members && board.members.length > 0 ? (
                                    <div className="flex -space-x-2 mr-2">
                                        {board.members.slice(0, 3).map((member, index) => (
                                            <div
                                                key={index}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm overflow-hidden"
                                                title={typeof member === 'object' ? member.fullName : member}
                                            >
                                                {typeof member === 'object' && member.avatarUrl ? (
                                                    <img
                                                        src={member.avatarUrl}
                                                        alt={member.fullName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white">
                                                        {typeof member === 'object'
                                                            ? member.fullName.charAt(0).toUpperCase()
                                                            : (typeof member === 'string' ? member.charAt(0).toUpperCase() : 'N/A')}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {board.members.length > 3 && (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm">
                                                +{board.members.length - 3}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500 italic">No members yet</span>
                                )}
                            </div>

                            <div className="mt-4">
                                {/* Chỉ hiện nút View Details nếu user là member của milestone */}
                                {memberMilestoneIds.has(String(board.milestoneId || board.id)) && (
                                    <button
                                        onClick={() => navigateToBoard(board.milestoneId || board.id)}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-lg flex items-center justify-center transition-all duration-300 hover:shadow-md"
                                    >
                                        <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                                        View Details
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MilestoneBoards; 