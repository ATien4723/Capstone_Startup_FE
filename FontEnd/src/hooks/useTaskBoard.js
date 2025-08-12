import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getUserId } from '@/apis/authService';
import { getStartupIdByAccountId, searchAccountByEmail, getStartupMembers } from '@/apis/startupService';
import {
    createMilestone,
    addMembersToMilestone,
    createColumn,
    getColumnsByMilestone,
    createTask,
    getTaskBoard,
    getAllMilestones,
} from '@/apis/taskService';

const useTask = () => {
    const [loading, setLoading] = useState(false);
    const [milestones, setMilestones] = useState([]);
    const [columns, setColumns] = useState([]);
    const [taskBoard, setTaskBoard] = useState(null);
    const [error, setError] = useState(null);

    // States cho quản lý bảng milestone
    const [startupId, setStartupId] = useState(null);
    const [showNewBoardForm, setShowNewBoardForm] = useState(false);
    const [editingBoard, setEditingBoard] = useState(null);
    const [boardFormData, setBoardFormData] = useState({
        title: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        color: 'bg-blue-500'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFavorites, setFilterFavorites] = useState(false);
    const [showAddMemberForm, setShowAddMemberForm] = useState(false);
    const [currentBoardId, setCurrentBoardId] = useState(null);
    const [newMember, setNewMember] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRefs = useRef({});

    // State cho tìm kiếm và thêm thành viên
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [startupMembers, setStartupMembers] = useState([]);

    // Danh sách màu sắc để chọn
    const colorOptions = [
        { value: 'bg-blue-500', label: 'Xanh dương' },
        { value: 'bg-green-500', label: 'Xanh lá' },
        { value: 'bg-red-500', label: 'Đỏ' },
        { value: 'bg-yellow-500', label: 'Vàng' },
        { value: 'bg-purple-500', label: 'Tím' },
        { value: 'bg-pink-500', label: 'Hồng' },
        { value: 'bg-indigo-500', label: 'Chàm' },
        { value: 'bg-amber-500', label: 'Hổ phách' },
        { value: 'bg-teal-500', label: 'Xanh lục lam' }
    ];

    // Hàm để lưu dữ liệu milestone vào localStorage khi người dùng nhấp vào một milestone
    const navigateToMilestoneDetail = (boardId) => {
        try {
            // Tìm milestone tương ứng từ danh sách đã fetch được
            const milestone = milestones.find(m => m.milestoneId == boardId);

            if (milestone) {
                // Tạo dữ liệu board từ milestone
                const boardInfo = {
                    id: milestone.milestoneId,
                    title: milestone.name || 'Task Board',
                    description: milestone.description || '',
                    color: milestone.color || 'bg-blue-500'
                };

                // Lưu vào localStorage để sử dụng trong useMilestone
                localStorage.setItem(`milestone_${boardId}`, JSON.stringify(boardInfo));
            }

            // Trả về đường dẫn đến trang chi tiết
            return `/me/milestones/${boardId}`;
        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu milestone vào localStorage:", error);
            return `/me/milestones/${boardId}`;
        }
    };

    // Lấy startupId từ API
    const fetchStartupId = async () => {
        try {
            setLoading(true);
            const userId = await getUserId();
            if (!userId) {
                toast.error("Không thể xác định người dùng hiện tại");
                return null;
            }

            const response = await getStartupIdByAccountId(userId);
            if (response) {
                setStartupId(response);
                // Lấy danh sách milestones
                await fetchMilestones(response);
                // Lấy danh sách thành viên startup để xác định vai trò
                await fetchStartupMembers(response);
                return response;
            } else {
                toast.warning("Bạn chưa thuộc về startup nào");
                return null;
            }
        } catch (error) {
            console.error("Lỗi khi lấy startupId:", error);
            toast.error("Không thể xác định startup của bạn");
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Tạo milestone mới
    const handleCreateMilestone = async (milestoneData) => {
        try {
            setLoading(true);
            setError(null);

            // Lấy ID người dùng hiện tại và thêm vào dữ liệu milestone
            const accountID = await getUserId();
            const milestonePayload = {
                ...milestoneData,
                accountID
            };

            const response = await createMilestone(milestonePayload);
            toast.success('Tạo milestone thành công!');
            return response;
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi khi tạo milestone');
            toast.error('Không thể tạo milestone. Vui lòng thử lại sau!');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Thêm thành viên vào milestone
    const handleAddMembersToMilestone = async (memberData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await addMembersToMilestone(memberData);
            toast.success('Thêm thành viên thành công!');
            return response;
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi khi thêm thành viên');
            toast.error('Không thể thêm thành viên. Vui lòng thử lại sau!');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Lấy tất cả các cột theo milestoneId
    const fetchColumns = async (milestoneId) => {
        try {
            setLoading(true);
            setError(null);
            const response = await getColumnsByMilestone(milestoneId);
            setColumns(response.data || []);
            return response.data;
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi khi lấy dữ liệu cột');
            toast.error('Không thể lấy dữ liệu cột. Vui lòng thử lại sau!');
            return [];
        } finally {
            setLoading(false);
        }
    };



    // Lấy tất cả milestone theo startupId
    const fetchMilestones = async (startupId) => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllMilestones(startupId);
            setMilestones(response || []);
            return response;
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi khi lấy dữ liệu milestone');
            toast.error('Không thể lấy dữ liệu milestone. Vui lòng thử lại sau!');
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Các hàm quản lý board từ MilestoneBoards.jsx
    // Mở form thêm bảng mới
    const handleAddBoard = () => {
        if (!startupId) {
            toast.warning("Bạn cần thuộc về một startup để tạo milestone");
            return;
        }

        setBoardFormData({
            title: '',
            description: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            color: 'bg-blue-500'
        });
        setShowNewBoardForm(true);
        setEditingBoard(null);
    };

    // Mở form chỉnh sửa bảng
    const handleEditBoard = (board) => {
        setBoardFormData({
            title: board.title || board.milestoneName || board.name,
            description: board.description || board.milestoneDescription,
            startDate: board.startDate ? new Date(board.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: board.endDate ? new Date(board.endDate).toISOString().split('T')[0] : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            color: board.color || 'bg-blue-500'
        });
        setShowNewBoardForm(true);
        setEditingBoard(board.id || board.milestoneId);
        setOpenDropdownId(null);
    };

    // Lưu bảng (thêm mới hoặc cập nhật)
    const handleSaveBoard = async () => {
        if (boardFormData.title.trim() === '') return;
        if (!startupId) {
            toast.error("Không thể xác định startup");
            return;
        }

        try {
            if (editingBoard) {
                // Cập nhật milestone hiện có (API chưa hỗ trợ, cần bổ sung)
                toast.info("aaa chua lam");
            } else {
                // Thêm milestone mới
                const newMilestoneData = {
                    startupId: startupId,
                    name: boardFormData.title,
                    description: boardFormData.description,
                    startDate: new Date(boardFormData.startDate).toISOString(),
                    endDate: new Date(boardFormData.endDate).toISOString(),
                    memberIds: [],
                    color: boardFormData.color
                };

                await handleCreateMilestone(newMilestoneData);
                // Refresh lại danh sách milestone sau khi tạo thành công
                await fetchMilestones(startupId);
            }

            // Đóng form
            setShowNewBoardForm(false);
            setEditingBoard(null);
        } catch (error) {
            toast.error("Có lỗi xảy ra khi lưu milestone");
        }
    };

    // Xóa bảng (API chưa hỗ trợ xóa milestone)
    const handleDeleteBoard = (boardId) => {
        toast.info("Chức năng xóa milestone sẽ được bổ sung sau");
        setOpenDropdownId(null);
    };

    // Mở/đóng dropdown menu
    const toggleDropdown = (boardId) => {
        setOpenDropdownId(openDropdownId === boardId ? null : boardId);
    };

    // Tìm kiếm người dùng theo email
    const searchMembers = async (query) => {
        // Nếu query rỗng, không hiển thị kết quả
        if (!query.trim()) {
            setSearchResults([]);
            //xoa du lieu tim kiem
            setIsSearching(false);
            return;
        }

        try {
            setIsSearching(true);

            // Lấy ID của người dùng hiện tại
            const currentUserId = await getUserId();

            // Thay vì gọi API, lọc từ danh sách thành viên startup
            const query_lower = query.toLowerCase();

            // Tìm kiếm trong danh sách thành viên
            const filteredResults = startupMembers.filter(member => {
                const fullName = member.fullName?.toLowerCase() || '';
                const email = member.email?.toLowerCase() || '';

                // Kiểm tra nếu tên hoặc email chứa từ khóa tìm kiếm
                return (fullName.includes(query_lower) || email.includes(query_lower)) &&
                    // Loại bỏ tài khoản người dùng hiện tại
                    String(member.accountId) !== String(currentUserId);
            });

            // Lọc bỏ các thành viên đã được chọn
            const results = filteredResults.filter(member =>
                !selectedMembers.some(selected => selected.accountId === member.accountId)
            );

            console.log('Search results from startup members:', results);
            setSearchResults(results);
        } catch (error) {
            console.error('Lỗi khi tìm kiếm thành viên:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Lấy danh sách thành viên của startup
    const fetchStartupMembers = async (startupId) => {
        try {
            // Lấy ID người dùng hiện tại
            const currentUserId = await getUserId();

            const response = await getStartupMembers(startupId);
            const members = response || [];

            // Giữ nguyên toàn bộ danh sách (bao gồm cả current user) để có thể kiểm tra role Founder
            setStartupMembers(members);
            return members;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách thành viên:', error);
            return [];
        }
    };

    // Thêm một thành viên vào danh sách đã chọn
    const addToSelectedMembers = (member) => {
        // Kiểm tra nếu thành viên đã được chọn
        if (!selectedMembers.some(m => m.accountId === member.accountId)) {
            setSelectedMembers([...selectedMembers, member]);
        }
    };

    // Xóa một thành viên khỏi danh sách đã chọn
    const removeFromSelectedMembers = (accountId) => {
        setSelectedMembers(selectedMembers.filter(m => m.accountId !== accountId));
    };

    // Reset form thêm thành viên
    const resetMemberForm = () => {
        setMemberSearchQuery('');
        setSearchResults([]);
        setSelectedMembers([]);
    };

    // Mở form thêm thành viên
    const handleOpenAddMemberForm = async (boardId) => {
        setCurrentBoardId(boardId);
        setNewMember('');
        resetMemberForm();
        setShowAddMemberForm(true);
        setOpenDropdownId(null);

        if (startupId) {
            await fetchStartupMembers(startupId);
        }
    };

    // Đóng form thêm thành viên
    const handleCloseAddMemberForm = () => {
        resetMemberForm();
        setShowAddMemberForm(false);
        setCurrentBoardId(null);
    };

    // Thêm thành viên mới
    const handleAddMember = async () => {
        if (selectedMembers.length === 0 || !currentBoardId) {
            toast.warning('Vui lòng chọn ít nhất một thành viên');
            return;
        }

        try {
            const memberIds = selectedMembers.map(member => member.memberid);

            const memberData = {
                milestoneId: currentBoardId,
                MemberIds: memberIds
            };

            await handleAddMembersToMilestone(memberData);
            // Refresh lại danh sách milestone
            await fetchMilestones(startupId);

            // Đóng form và reset form
            handleCloseAddMemberForm();

            toast.success('Thêm thành viên thành công!');
        } catch (error) {
            toast.error("Có lỗi xảy ra khi thêm thành viên");
        }
    };

    // Toggle favorite (API chưa hỗ trợ)
    const toggleFavorite = (boardId) => {
        // toast.info("Chức năng đánh dấu yêu thích sẽ được bổ sung sau");
    };

    // Filter boards theo search và favorites
    const getFilteredMilestones = () => {
        return milestones.filter(board => {
            const title = board.milestoneName || board.title || '';
            const description = board.milestoneDescription || board.description || '';

            // Apply search filter
            const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                description.toLowerCase().includes(searchQuery.toLowerCase());

            // Apply favorite filter (nếu API hỗ trợ)
            if (filterFavorites) {
                return matchesSearch && (board.isFavorite === true);
            }

            return matchesSearch;
        });
    };

    // Đóng dropdown menu khi click bên ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (openDropdownId &&
                dropdownRefs.current[openDropdownId] &&
                !dropdownRefs.current[openDropdownId].contains(event.target)) {
                setOpenDropdownId(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openDropdownId]);

    // Đặt debounce cho tìm kiếm - luôn gọi searchMembers khi memberSearchQuery thay đổi
    useEffect(() => {
        console.log('memberSearchQuery changed:', memberSearchQuery);
        const timeoutId = setTimeout(() => {
            // if (memberSearchQuery.trim()) {
            //     console.log('Calling searchMembers with:', memberSearchQuery);
            //     searchMembers(memberSearchQuery);
            // }
            console.log('Calling searchMembers with:', memberSearchQuery);
            searchMembers(memberSearchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [memberSearchQuery]);

    return {
        // Data states
        loading,
        error,
        milestones,
        columns,
        taskBoard,
        startupId,

        // Board UI states
        showNewBoardForm,
        editingBoard,
        boardFormData,
        searchQuery,
        filterFavorites,
        showAddMemberForm,
        currentBoardId,
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

        // Fetch functions
        fetchStartupId,
        fetchMilestones,
        fetchColumns,

        // API handlers
        handleCreateMilestone,
        handleAddMembersToMilestone,

        // Board UI handlers
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

        // Member handling
        searchMembers,
        addToSelectedMembers,
        removeFromSelectedMembers,
        resetMemberForm,

        // Expose fetchStartupMembers so component can call it
        fetchStartupMembers,

        // UI state setters
        setShowNewBoardForm,
        setBoardFormData,
        setSearchQuery,
        setFilterFavorites,
        setNewMember,
        setShowAddMemberForm,
        setMemberSearchQuery,

        // Mock data
        navigateToMilestoneDetail
    };
};

export default useTask; 