import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { getColumnsByMilestone, getTaskBoard, getAllMilestones, changeTaskColumn } from "@/apis/taskService";
import { getUserId } from "@/apis/authService";
import { getStartupIdByAccountId } from "@/apis/startupService";
import { toast } from "react-toastify";

const useMilestone = () => {
    const { boardId } = useParams();
    const navigate = useNavigate();

    // Thiết lập state cho các dữ liệu
    const [boardData, setBoardData] = useState(null);
    const [loading, setLoading] = useState(false);

    // State cho việc hiển thị task đang được kéo
    const [activeId, setActiveId] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [activeContainer, setActiveContainer] = useState(null);

    // State cho dữ liệu columns và tasks
    const [columns, setColumns] = useState({});

    // Dữ liệu mẫu cho các bảng dự án
    const mockBoardsData = {
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
    };

    // State cho việc tạo/chỉnh sửa milestone và task
    const [showNewMilestoneForm, setShowNewMilestoneForm] = useState(false);
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
    const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
    const [editingTask, setEditingTask] = useState(null);
    const [taskFormData, setTaskFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        dueDate: '',
        progress: 0
    });

    const [editingTaskField, setEditingTaskField] = useState(null);
    const [editFieldData, setEditFieldData] = useState({
        field: '',
        taskId: '',
        milestoneId: '',
        currentValue: ''
    });

    // State cho việc xem chi tiết task
    const [viewingTask, setViewingTask] = useState(null);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

    // State cho thành viên
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);

    // State cho người dùng hiện tại và bình luận
    const [currentUser, setCurrentUser] = useState({ id: 'LT', name: 'aa' });
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);

    // Danh sách thành viên
    const [teamMembers, setTeamMembers] = useState([
        { id: 'aa', name: 'aa', username: '@leanhtin5', color: 'bg-red-500' },
        { id: 'bb', name: 'bb', color: 'bg-gray-500' },
        { id: 'cc', name: 'cc', color: 'bg-indigo-600' },
        { id: 'dd', name: 'dd', color: 'bg-yellow-500', avatar: '/path/to/avatar.jpg' },
        { id: 'ee', name: 'ee', color: 'bg-teal-500' },
        { id: 'ff', name: 'ff', color: 'bg-purple-600' }
    ]);

    // Hàm chuyển đổi dữ liệu API sang định dạng cần thiết
    const mapApiDataToColumns = (data) => {
        const columnsData = {};

        if (data && Array.isArray(data)) {
            data.forEach(column => {
                const tasks = column.tasks ? column.tasks.map(task => ({
                    id: `task-${task.taskId}`,
                    taskId: task.taskId,
                    title: task.title || 'Chưa có tiêu đề',
                    description: task.description || '',
                    priority: task.priority?.toLowerCase() || 'medium',
                    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                    status: task.status || 'todo',
                    progress: task.progress || 0,
                    avatarURL: task.avatarURL || [],
                    assignees: task.assignees || [] // Nếu API trả về assignees, sử dụng nó
                })) : [];

                columnsData[`milestone-${column.columnStatusId}`] = {
                    id: `milestone-${column.columnStatusId}`,
                    columnId: column.columnStatusId,
                    title: column.columnName || 'Không có tên',
                    description: column.description || '',
                    sortOrder: column.sortOrder || 0,
                    tasks: tasks
                };
            });
        } else {
            console.error('Data từ API không phải là một mảng:', data);
        }

        return columnsData;
    };

    // Lấy dữ liệu task board từ API
    const fetchTaskBoard = async (milestoneId) => {
        if (!milestoneId) {
            console.error('Không có milestoneId');
            return;
        }

        setLoading(true);
        try {
            const response = await getTaskBoard(milestoneId);
            console.log('API Response:', response);

            if (response && Array.isArray(response)) {
                console.log('Response data structure:', JSON.stringify(response.data));
                const columnsData = mapApiDataToColumns(response);
                setColumns(columnsData);
            } else {
                console.error('Response structure is invalid:', response);
                toast.error('Không thể lấy dữ liệu task board');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu task board:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // Lấy dữ liệu của bảng dựa vào boardId
    useEffect(() => {
        if (boardId) {
            setLoading(true);

            // Đầu tiên, kiểm tra xem có dữ liệu board trong localStorage không
            const savedBoardData = localStorage.getItem(`milestone_${boardId}`);

            if (savedBoardData) {
                // Nếu có, sử dụng dữ liệu từ localStorage
                const parsedData = JSON.parse(savedBoardData);
                setBoardData(parsedData);

                // Vẫn gọi fetchTaskBoard để lấy dữ liệu columns và tasks
                fetchTaskBoard(boardId).finally(() => {
                    setLoading(false);
                });
            } else {
                // Nếu không có trong localStorage, thử lấy từ API getAllMilestones
                const fetchData = async () => {
                    try {
                        // Lấy userId và startupId
                        const userId = await getUserId();
                        if (!userId) {
                            throw new Error('Không thể xác định người dùng');
                        }

                        const startupId = await getStartupIdByAccountId(userId);
                        if (!startupId) {
                            throw new Error('Không thể xác định startup');
                        }

                        // Lấy tất cả milestones
                        const milestonesResponse = await getAllMilestones(startupId);

                        // Tìm milestone hiện tại theo boardId
                        const currentMilestone = milestonesResponse.find(
                            milestone => milestone.milestoneId == boardId
                        );

                        if (currentMilestone) {
                            // Tạo boardData từ milestone tìm được
                            const boardInfo = {
                                id: currentMilestone.milestoneId,
                                title: currentMilestone.name || 'Task Board',
                                description: currentMilestone.description || '',
                                color: currentMilestone.color || 'bg-blue-500'
                            };

                            // Lưu vào state và localStorage
                            setBoardData(boardInfo);
                            localStorage.setItem(`milestone_${boardId}`, JSON.stringify(boardInfo));
                        } else {
                            // Nếu không tìm thấy, sử dụng mock data
                            setBoardData(mockBoardsData[boardId] || {
                                id: boardId,
                                title: 'Task Board',
                                description: '',
                                color: 'bg-blue-500'
                            });
                        }

                        // Gọi fetchTaskBoard để lấy columns và tasks
                        await fetchTaskBoard(boardId);
                    } catch (error) {
                        console.error('Lỗi khi lấy dữ liệu từ API:', error);

                        // Sử dụng mock data nếu không lấy được từ API
                        setBoardData(mockBoardsData[boardId] || {
                            id: boardId,
                            title: 'Task Board',
                            description: '',
                            color: 'bg-blue-500'
                        });

                        // Lấy columns từ localStorage nếu có
                        const savedColumns = localStorage.getItem('currentMilestoneColumns');
                        if (savedColumns) {
                            setColumns(JSON.parse(savedColumns));
                        }
                    } finally {
                        setLoading(false);
                    }
                };

                fetchData();
            }
        }
    }, [boardId]);

    // Quay lại trang danh sách bảng
    const handleBackToBoards = () => {
        navigate('/me/milestones');
    };

    // Xử lý sự kiện DragStart
    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);

        // Lấy thông tin task và milestoneId từ active.data.current
        if (active.data.current) {
            setActiveTask(active.data.current.task);
            setActiveContainer(active.data.current.milestoneId);
        }
    };

    // Hàm xác định milestone đích
    const isMilestoneId = (over, isMilestoneTarget, defaultMilestoneId) => {
        if (isMilestoneTarget) return over.id;

        // Nếu over.data.current không tồn tại, hoặc không có milestoneId
        // có thể đây là task, cần lấy milestone chứa nó
        if (over.data.current && over.data.current.milestoneId) {
            return over.data.current.milestoneId;
        }

        // Nếu không xác định được, trả về milestone hiện tại
        return defaultMilestoneId;
    };

    // Xử lý sự kiện DragEnd
    const handleDragEnd = (event) => {
        const { active, over } = event;

        console.log('DragEnd:', { active, over });

        if (!active || !over) {
            setActiveId(null);
            setActiveTask(null);
            setActiveContainer(null);
            return;
        }

        // Lấy task id
        const taskId = active.id;

        // Lấy milestone id từ data
        const sourceMilestoneId = active.data.current?.milestoneId;

        if (!sourceMilestoneId) {
            console.error('Không tìm thấy milestoneId nguồn:', active.data.current);
            setActiveId(null);
            setActiveTask(null);
            setActiveContainer(null);
            return;
        }

        // Kiểm tra xem target có phải là milestone hay task
        const isMilestoneTarget = Object.keys(columns).includes(over.id);
        const targetMilestoneId = isMilestoneId(over, isMilestoneTarget, sourceMilestoneId);

        if (!targetMilestoneId || !columns[targetMilestoneId]) {
            console.error('Không tìm thấy milestone đích:', { targetMilestoneId, available: Object.keys(columns) });
            setActiveId(null);
            setActiveTask(null);
            setActiveContainer(null);
            return;
        }

        console.log(`Handling task movement:`, { taskId, sourceMilestoneId, targetMilestoneId, isMilestoneTarget });

        // Nếu là kéo thả giữa các milestone
        if (sourceMilestoneId !== targetMilestoneId) {
            handleCrossMilestoneMovement(taskId, sourceMilestoneId, targetMilestoneId);
        }
        // Nếu là sắp xếp lại trong cùng một milestone
        else if (active.id !== over.id) {
            handleSameContainerSorting(sourceMilestoneId, active.id, over.id);
        }

        // Reset active states
        setActiveId(null);
        setActiveTask(null);
        setActiveContainer(null);
    };

    // Xử lý di chuyển task giữa các milestone
    const handleCrossMilestoneMovement = async (taskId, sourceMilestoneId, targetMilestoneId) => {
        console.log(`Moving task between milestones: ${sourceMilestoneId} -> ${targetMilestoneId}`);

        const sourceColumn = columns[sourceMilestoneId];
        const destColumn = columns[targetMilestoneId];

        if (!sourceColumn || !destColumn) {
            console.error('Không tìm thấy milestone nguồn hoặc đích', { sourceColumn, destColumn });
            return;
        }

        // Tìm task được kéo
        const taskToMove = sourceColumn.tasks.find(task => task.id === taskId);

        if (!taskToMove) {
            console.error('Không tìm thấy task cần di chuyển');
            return;
        }

        console.log('Moving task between milestones:', taskToMove);

        // Cập nhật state columns
        const newSourceTasks = sourceColumn.tasks.filter(task => task.id !== taskId);

        const newColumns = {
            ...columns,
            [sourceMilestoneId]: {
                ...sourceColumn,
                tasks: newSourceTasks
            },
            [targetMilestoneId]: {
                ...destColumn,
                tasks: [...destColumn.tasks, taskToMove]
            }
        };

        console.log('Updated columns for cross-milestone move:', newColumns);
        setColumns(newColumns);

        // Gọi API để thay đổi cột của task
        try {
            // Lấy taskId thực tế (số nguyên) từ taskToMove.taskId
            const actualTaskId = taskToMove.taskId;

            // Lấy columnStatusId từ destColumn
            // columnId hoặc columnStatusId tùy vào cấu trúc dữ liệu
            const targetColumnStatusId = destColumn.columnId || parseInt(targetMilestoneId.split('-')[1]);

            if (!actualTaskId || !targetColumnStatusId) {
                console.error('Thiếu thông tin để gọi API:', { actualTaskId, targetColumnStatusId, taskToMove, destColumn });
                return;
            }

            const apiData = {
                taskId: actualTaskId,
                newColumnStatusId: targetColumnStatusId
            };

            console.log('Calling changeTaskColumn API with data:', apiData);
            const response = await changeTaskColumn(apiData);

            console.log('API Response for changeTaskColumn:', response);
            // if (response.success) {
            //     toast.success('Đã di chuyển task thành công!');
            // } else {
            //     toast.error('Có lỗi xảy ra khi di chuyển task.');
            // }
        } catch (error) {
            console.error('Lỗi khi gọi API changeTaskColumn:', error);
            toast.error('Có lỗi xảy ra khi di chuyển task.');
        }
    };

    // Xử lý sắp xếp lại trong cùng milestone
    const handleSameContainerSorting = (milestoneId, activeId, overId) => {
        console.log(`Sorting within milestone ${milestoneId}: ${activeId} -> ${overId}`);

        const milestone = columns[milestoneId];
        if (!milestone) {
            console.error('Không tìm thấy milestone', milestoneId);
            return;
        }

        const activeIndex = milestone.tasks.findIndex(t => t.id === activeId);
        const overIndex = milestone.tasks.findIndex(t => t.id === overId);

        if (activeIndex !== -1 && overIndex !== -1) {
            const newTasks = arrayMove(milestone.tasks, activeIndex, overIndex);

            console.log('Sorted tasks:', { activeIndex, overIndex, newTasks });

            setColumns({
                ...columns,
                [milestoneId]: {
                    ...milestone,
                    tasks: newTasks
                }
            });
        }
    };

    // Thêm milestone mới
    const handleAddMilestone = () => {
        if (newMilestoneTitle.trim() === '') return;

        const newMilestoneId = `milestone-${Date.now()}`;
        const newMilestone = {
            id: newMilestoneId,
            title: newMilestoneTitle,
            description: newMilestoneDescription,
            tasks: []
        };

        setColumns({
            ...columns,
            [newMilestoneId]: newMilestone
        });

        setNewMilestoneTitle('');
        setNewMilestoneDescription('');
        setShowNewMilestoneForm(false);
    };

    // Xử lý thêm task mới
    const handleAddTask = (milestoneId) => {
        setEditingTask({
            milestoneId,
            taskId: null,
            isNew: true
        });

        setTaskFormData({
            title: '',
            description: '',
            priority: 'medium',
            assignee: '',
            dueDate: '',
            progress: 0
        });
    };

    // Xử lý chỉnh sửa task
    const handleEditTask = (milestoneId, task) => {
        setEditingTask({
            milestoneId,
            taskId: task.id,
            isNew: false
        });

        setTaskFormData({
            title: task.title,
            description: task.description,
            priority: task.priority,
            assignee: task.assignee,
            dueDate: task.dueDate,
            progress: task.progress || 0
        });
    };

    // Lưu task (thêm mới hoặc cập nhật)
    const handleSaveTask = () => {
        if (!editingTask || taskFormData.title.trim() === '') return;

        const { milestoneId, taskId, isNew } = editingTask;
        const milestone = columns[milestoneId];

        if (isNew) {
            // Thêm task mới
            const newTask = {
                id: `task-${Date.now()}`,
                ...taskFormData,
                status: 'todo',
                progress: Number(taskFormData.progress) || 0
            };

            setColumns({
                ...columns,
                [milestoneId]: {
                    ...milestone,
                    tasks: [...milestone.tasks, newTask]
                }
            });
        } else {
            // Cập nhật task hiện có
            const updatedTasks = milestone.tasks.map(task =>
                task.id === taskId ? {
                    ...task,
                    ...taskFormData,
                    progress: Number(taskFormData.progress) || 0
                } : task
            );

            setColumns({
                ...columns,
                [milestoneId]: {
                    ...milestone,
                    tasks: updatedTasks
                }
            });
        }

        // Reset form và trạng thái
        setEditingTask(null);
        setTaskFormData({
            title: '',
            description: '',
            priority: 'medium',
            assignee: '',
            dueDate: '',
            progress: 0
        });
    };

    // Xóa task
    const handleDeleteTask = (milestoneId, taskId) => {
        const milestone = columns[milestoneId];
        const updatedTasks = milestone.tasks.filter(task => task.id !== taskId);

        setColumns({
            ...columns,
            [milestoneId]: {
                ...milestone,
                tasks: updatedTasks
            }
        });

        // Đóng modal chi tiết task nếu đang xem task bị xóa
        if (viewingTask && viewingTask.id === taskId) {
            setShowTaskDetailModal(false);
        }
    };

    // Xóa milestone
    const handleDeleteMilestone = (milestoneId) => {
        const newColumns = { ...columns };
        delete newColumns[milestoneId];
        setColumns(newColumns);
    };

    // Xử lý chỉnh sửa một trường cụ thể của task
    const handleEditTaskField = (milestoneId, taskId, field) => {
        const milestone = columns[milestoneId];

        if (!milestone || !milestone.tasks) {
            console.error("⛔ Milestone không tồn tại hoặc chưa có tasks:", milestoneId);
            console.log("📦 columns hiện tại:", columns);
            return;
        }

        const task = milestone.tasks.find(t => t.id === taskId);
        if (task) {
            setEditFieldData({
                field,
                taskId,
                milestoneId,
                currentValue: task[field] || ''
            });
            setEditingTaskField(field);
        }
    };

    // Lưu giá trị mới cho trường đang được chỉnh sửa
    const handleSaveTaskField = (newValue) => {
        const { field, taskId, milestoneId } = editFieldData;
        const milestone = columns[milestoneId];

        if (!milestone) return;

        const updatedTasks = milestone.tasks.map(task =>
            task.id === taskId ? { ...task, [field]: newValue } : task
        );

        setColumns({
            ...columns,
            [milestoneId]: {
                ...milestone,
                tasks: updatedTasks
            }
        });

        setEditingTaskField(null);
    };

    // Xử lý khi click vào task
    const handleTaskClick = (milestoneId, task) => {
        setViewingTask({
            ...task,
            milestoneId
        });
        setShowTaskDetailModal(true);
    };

    // Xử lý thêm thành viên vào task
    const handleAddMember = (taskId, milestoneId, memberId) => {
        const milestone = columns[milestoneId];

        if (!milestone || !milestone.tasks) {
            console.error("⛔ Milestone không tồn tại hoặc chưa có tasks:", milestoneId);
            return;
        }

        const updatedTasks = milestone.tasks.map(task => {
            if (task.id === taskId) {
                // Tạo mảng assignees nếu chưa có
                const assignees = task.assignees || [];
                // Chỉ thêm thành viên nếu chưa tồn tại
                if (!assignees.includes(memberId)) {
                    return {
                        ...task,
                        assignees: [...assignees, memberId]
                    };
                }
            }
            return task;
        });

        // Cập nhật state để UI hiển thị ngay lập tức
        setColumns({
            ...columns,
            [milestoneId]: {
                ...milestone,
                tasks: updatedTasks
            }
        });

        // Cập nhật viewingTask nếu đang xem task này
        if (viewingTask && viewingTask.id === taskId && viewingTask.milestoneId === milestoneId) {
            const updatedTask = updatedTasks.find(t => t.id === taskId);
            setViewingTask({
                ...viewingTask,
                assignees: updatedTask.assignees
            });
        }

        // Vẫn giữ dropdown mở để người dùng tiếp tục thêm thành viên khác
        // setShowMemberDropdown(false);
    };

    // Xử lý xóa thành viên khỏi task
    const handleRemoveMember = (taskId, milestoneId, memberIdToRemove) => {
        const milestone = columns[milestoneId];

        if (!milestone || !milestone.tasks) {
            console.error("⛔ Milestone không tồn tại hoặc chưa có tasks:", milestoneId);
            return;
        }

        const updatedTasks = milestone.tasks.map(task => {
            if (task.id === taskId && task.assignees) {
                return {
                    ...task,
                    assignees: task.assignees.filter(memberId => memberId !== memberIdToRemove)
                };
            }
            return task;
        });

        // Cập nhật state để UI hiển thị ngay lập tức
        setColumns({
            ...columns,
            [milestoneId]: {
                ...milestone,
                tasks: updatedTasks
            }
        });

        // Cập nhật viewingTask nếu đang xem task này
        if (viewingTask && viewingTask.id === taskId && viewingTask.milestoneId === milestoneId) {
            const updatedTask = updatedTasks.find(t => t.id === taskId);
            setViewingTask({
                ...viewingTask,
                assignees: updatedTask.assignees
            });
        }

        // Không đóng dropdown sau khi xóa thành viên
    };

    // Format thời gian bình luận
    const formatCommentTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;

        // Hiển thị ngày tháng
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    };

    // Thêm bình luận cho task
    const handleAddComment = (taskId, milestoneId, text) => {
        if (!text.trim()) return;

        const milestone = columns[milestoneId];
        if (!milestone || !milestone.tasks) return;

        const updatedTasks = milestone.tasks.map(task => {
            if (task.id === taskId) {
                const comments = task.comments || [];
                return {
                    ...task,
                    comments: [
                        ...comments,
                        {
                            id: `comment-${Date.now()}`,
                            text: text.trim(),
                            userId: currentUser.id,
                            userName: currentUser.name,
                            timestamp: new Date().toISOString(),
                            userColor: 'bg-red-500' // Màu của người dùng hiện tại
                        }
                    ]
                };
            }
            return task;
        });

        setColumns({
            ...columns,
            [milestoneId]: {
                ...milestone,
                tasks: updatedTasks
            }
        });

        // Cập nhật viewingTask nếu đang xem task này
        if (viewingTask && viewingTask.id === taskId) {
            const updatedTask = updatedTasks.find(t => t.id === taskId);
            setViewingTask({
                ...viewingTask,
                comments: updatedTask.comments
            });
        }

        // Reset input
        setCommentText('');
    };

    // Xóa bình luận
    const handleDeleteComment = (taskId, milestoneId, commentId) => {
        const milestone = columns[milestoneId];
        if (!milestone || !milestone.tasks) return;

        const updatedTasks = milestone.tasks.map(task => {
            if (task.id === taskId && task.comments) {
                return {
                    ...task,
                    comments: task.comments.filter(comment => comment.id !== commentId)
                };
            }
            return task;
        });

        setColumns({
            ...columns,
            [milestoneId]: {
                ...milestone,
                tasks: updatedTasks
            }
        });

        // Cập nhật viewingTask nếu đang xem task này
        if (viewingTask && viewingTask.id === taskId) {
            const updatedTask = updatedTasks.find(t => t.id === taskId);
            setViewingTask({
                ...viewingTask,
                comments: updatedTask.comments
            });
        }
    };

    // Render danh sách thành viên được giao
    const renderAssignees = (task, teamMembers) => {
        // Sử dụng asignTo thay vì assignees để phù hợp với API
        if (!task.asignTo || task.asignTo.length === 0) {
            return {
                type: 'notAssigned',
                content: 'Chưa giao'
            };
        }

        // Nếu chỉ có 1 thành viên

        // if (task.assignees.length === 1) {
        //     const memberId = task.assignees[0];
        //     const member = teamMembers.find(m => m.id === memberId);

        if (task.asignTo.length === 1) {
            const avatarUrl = task.asignTo[0];
            // Sử dụng URL hình ảnh trực tiếp thay vì tìm trong teamMembers
            return {
                type: 'singleMember',
                memberId: member?.id || memberId.charAt(0),
                memberName: member?.name || memberId,
                color: member?.color || 'bg-blue-500'
            };
        }

        // Nếu có nhiều thành viên, hiển thị số lượng
        const firstMember = teamMembers.find(m => m.id === task.assignees[0]);

        return {
            type: 'multipleMembers',
            memberId: firstMember?.id || task.assignees[0].charAt(0),
            count: task.assignees.length - 1,
            color: firstMember?.color || 'bg-blue-500'
        };
    };

    // Render người được giao cho TaskOverlay
    const renderOverlayAssignees = (task, teamMembers) => {
        if (!task.assignees || task.assignees.length === 0) {
            return {
                type: 'notAssigned',
                content: 'Chưa giao'
            };
        }

        // Nếu chỉ có 1 người được giao
        if (task.assignees.length === 1) {
            const memberId = task.assignees[0];
            const member = teamMembers.find(m => m.id === memberId);

            return {
                type: 'singleMember',
                memberId: member?.id || memberId.charAt(0),
                memberName: member?.name || memberId,
                color: member?.color || 'bg-blue-500'
            };
        }

        // Nếu có nhiều người, hiển thị người đầu tiên + số lượng
        const firstMember = teamMembers.find(m => m.id === task.assignees[0]);

        return {
            type: 'multipleMembers',
            memberId: firstMember?.id || task.assignees[0].charAt(0),
            count: task.assignees.length - 1,
            color: firstMember?.color || 'bg-blue-500'
        };
    };

    return {
        // State
        boardData,
        columns,
        activeId,
        activeTask,
        showNewMilestoneForm,
        newMilestoneTitle,
        newMilestoneDescription,
        editingTask,
        taskFormData,
        editingTaskField,
        editFieldData,
        viewingTask,
        showTaskDetailModal,
        showMemberDropdown,
        memberSearchQuery,
        teamMembers,
        currentUser,
        commentText,
        showComments,
        loading,

        // State setters
        setShowNewMilestoneForm,
        setNewMilestoneTitle,
        setNewMilestoneDescription,
        setTaskFormData,
        setShowTaskDetailModal,
        setShowMemberDropdown,
        setMemberSearchQuery,
        setCommentText,
        setShowComments,
        setEditingTask,
        setEditingTaskField,

        // Handlers
        handleBackToBoards,
        handleDragStart,
        handleDragEnd,
        handleAddMilestone,
        handleAddTask,
        handleEditTask,
        handleSaveTask,
        handleDeleteTask,
        handleDeleteMilestone,
        handleEditTaskField,
        handleSaveTaskField,
        handleTaskClick,
        handleAddMember,
        handleRemoveMember,
        handleAddComment,
        handleDeleteComment,
        fetchTaskBoard,

        // Utils
        formatCommentTime,
        renderAssignees,
        renderOverlayAssignees
    };
};

export default useMilestone; 