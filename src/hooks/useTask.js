import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getUserId } from '@/apis/authService';
import { getStartupIdByAccountId } from '@/apis/startupService';
import {
    createMilestone,
    addMembersToMilestone,
    createColumn,
    getColumnsByMilestone,
    createTask,
    getTaskBoard,
    getAllMilestones,
    updateTaskColumn
} from '@/apis/taskService';

// Dữ liệu mẫu từ Milestone.jsx
const mockMilestoneData = {
    // Dữ liệu mẫu cho các milestone và các task bên trong
    columns: {
        'milestone-1': {
            id: 'milestone-1',
            title: 'Sprint 1: Thiết kế UI/UX',
            description: 'Hoàn thành thiết kế giao diện người dùng',
            tasks: [
                {
                    id: 'task-1',
                    title: 'Thiết kế Dashboard',
                    description: 'Tạo wireframe và mockup cho dashboard',
                    priority: 'high',
                    assignee: 'Nguyễn Văn A',
                    dueDate: '2023-12-15',
                    status: 'inProgress'
                },
                {
                    id: 'task-2',
                    title: 'Thiết kế trang Profile',
                    description: 'Tạo UI cho trang hồ sơ cá nhân',
                    priority: 'medium',
                    assignee: 'Trần Thị B',
                    dueDate: '2023-12-10',
                    status: 'done'
                }
            ]
        },
        'milestone-2': {
            id: 'milestone-2',
            title: 'Sprint 2: Phát triển Backend',
            description: 'Xây dựng API và cơ sở dữ liệu',
            tasks: [
                {
                    id: 'task-3',
                    title: 'Thiết kế Database Schema',
                    description: 'Tạo cấu trúc cơ sở dữ liệu cho ứng dụng',
                    priority: 'high',
                    assignee: 'Lê Văn C',
                    dueDate: '2023-12-20',
                    status: 'todo'
                },
                {
                    id: 'task-4',
                    title: 'Xây dựng REST API',
                    description: 'Phát triển các endpoint cho frontend',
                    priority: 'high',
                    assignee: 'Phạm Thị D',
                    dueDate: '2023-12-25',
                    status: 'inProgress'
                }
            ]
        },
        'milestone-3': {
            id: 'milestone-3',
            title: 'Sprint 3: Tích hợp và Kiểm thử',
            description: 'Kết nối frontend và backend, thực hiện kiểm thử',
            tasks: [
                {
                    id: 'task-5',
                    title: 'Tích hợp Authentication',
                    description: 'Kết nối API đăng nhập và đăng ký',
                    priority: 'high',
                    assignee: 'Nguyễn Văn A',
                    dueDate: '2024-01-05',
                    status: 'todo'
                }
            ]
        }
    },
    // Dữ liệu mẫu cho các bảng dự án
    boardData: {
        'board-1': {
            id: 'board-1',
            title: 'Phát triển ứng dụng di động',
            description: 'Ứng dụng iOS và Android cho startup',
            color: 'bg-blue-500',
            tasks: 12,
            members: ['NVA', 'TTB', 'LVC'],
            progress: 45
        },
        'board-2': {
            id: 'board-2',
            title: 'Phát triển website',
            description: 'Website chính thức của công ty',
            color: 'bg-green-500',
            tasks: 8,
            members: ['NVA', 'PQR'],
            progress: 60
        },
        'board-3': {
            id: 'board-3',
            title: 'Marketing Campaign Q4',
            description: 'Chiến dịch quảng cáo quý 4/2023',
            color: 'bg-purple-500',
            tasks: 15,
            members: ['TTB', 'LVC', 'XYZ'],
            progress: 30
        },
        'board-4': {
            id: 'board-4',
            title: 'Phát triển sản phẩm mới',
            description: 'Nghiên cứu và phát triển sản phẩm v2.0',
            color: 'bg-amber-500',
            tasks: 20,
            members: ['NVA', 'TTB', 'LVC', 'PQR'],
            progress: 15
        }
    }
};

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
        color: 'bg-blue-500'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFavorites, setFilterFavorites] = useState(false);
    const [showAddMemberForm, setShowAddMemberForm] = useState(false);
    const [currentBoardId, setCurrentBoardId] = useState(null);
    const [newMember, setNewMember] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRefs = useRef({});

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

    // Hàm để lưu dữ liệu mẫu vào localStorage khi người dùng nhấp vào một milestone
    const navigateToMilestoneDetail = (boardId) => {
        try {
            // Lưu dữ liệu mẫu từ mockMilestoneData vào localStorage
            localStorage.setItem('currentBoardData', JSON.stringify(mockMilestoneData.boardData[boardId] || mockMilestoneData.boardData['board-1']));
            localStorage.setItem('currentMilestoneColumns', JSON.stringify(mockMilestoneData.columns));
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
            const response = await createMilestone(milestoneData);
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

    // Tạo cột mới cho milestone
    const handleCreateColumn = async (columnData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await createColumn(columnData);
            toast.success('Tạo cột thành công!');
            return response;
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi khi tạo cột');
            toast.error('Không thể tạo cột. Vui lòng thử lại sau!');
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

    // Tạo task mới
    const handleCreateTask = async (taskData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await createTask(taskData);
            toast.success('Tạo task thành công!');
            return response;
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi khi tạo task');
            toast.error('Không thể tạo task. Vui lòng thử lại sau!');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Lấy task board theo milestoneId
    const fetchTaskBoard = async (milestoneId) => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTaskBoard(milestoneId);
            setTaskBoard(response.data || null);
            return response.data;
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi khi lấy dữ liệu task board');
            toast.error('Không thể lấy dữ liệu task board. Vui lòng thử lại sau!');
            return null;
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

    // Cập nhật cột cho task
    const handleUpdateTaskColumn = async (updateData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await updateTaskColumn(updateData);
            toast.success('Cập nhật task thành công!');
            return response;
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi khi cập nhật task');
            toast.error('Không thể cập nhật task. Vui lòng thử lại sau!');
            return null;
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
            color: 'bg-blue-500'
        });
        setShowNewBoardForm(true);
        setEditingBoard(null);
    };

    // Mở form chỉnh sửa bảng
    const handleEditBoard = (board) => {
        setBoardFormData({
            title: board.title || board.milestoneName,
            description: board.description || board.milestoneDescription,
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
                toast.info("Chức năng cập nhật milestone sẽ được bổ sung sau");
            } else {
                // Thêm milestone mới
                const newMilestoneData = {
                    startupId: startupId,
                    milestoneName: boardFormData.title,
                    milestoneDescription: boardFormData.description,
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

    // Mở form thêm thành viên
    const handleOpenAddMemberForm = (boardId) => {
        setCurrentBoardId(boardId);
        setNewMember('');
        setShowAddMemberForm(true);
        setOpenDropdownId(null);
    };

    // Thêm thành viên mới
    const handleAddMember = async () => {
        if (!newMember.trim() || !currentBoardId) return;

        try {
            const memberData = {
                milestoneId: currentBoardId,
                members: [newMember.trim()]
            };

            await handleAddMembersToMilestone(memberData);
            // Refresh lại danh sách milestone
            await fetchMilestones(startupId);

            // Đóng form
            setShowAddMemberForm(false);
            setCurrentBoardId(null);
            setNewMember('');
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

        // Fetch functions
        fetchStartupId,
        fetchMilestones,
        fetchColumns,
        fetchTaskBoard,

        // API handlers
        handleCreateMilestone,
        handleAddMembersToMilestone,
        handleCreateColumn,
        handleCreateTask,
        handleUpdateTaskColumn,

        // Board UI handlers
        handleAddBoard,
        handleEditBoard,
        handleSaveBoard,
        handleDeleteBoard,
        toggleDropdown,
        handleOpenAddMemberForm,
        handleAddMember,
        toggleFavorite,
        getFilteredMilestones,

        // UI state setters
        setShowNewBoardForm,
        setBoardFormData,
        setSearchQuery,
        setFilterFavorites,
        setNewMember,
        setShowAddMemberForm,

        // Mock data
        mockMilestoneData,
        navigateToMilestoneDetail
    };
};

export default useTask; 