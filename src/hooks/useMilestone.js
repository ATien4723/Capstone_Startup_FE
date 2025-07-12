import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { getColumnsByMilestone, getTaskBoard, getAllMilestones, changeTaskColumn, createColumn, getTaskDetail, getTasksByMilestone, getMembersInMilestone, assignTask, unassignAccountFromTask, updateTask, addCommentToTask, getCommentsByTaskId, deleteTaskComment } from "@/apis/taskService";
import { getUserId, getUserInfoFromToken } from "@/apis/authService";
import { getStartupIdByAccountId } from "@/apis/startupService";
import { toast } from "react-toastify";
import { getAccountInfo } from "@/apis/accountService";

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
        note: ''
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
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamMembersLoading, setTeamMembersLoading] = useState(false);

    // State mới cho chế độ xem danh sách
    const [tasksList, setTasksList] = useState([]);
    const [tasksListLoading, setTasksListLoading] = useState(false);
    const [pagination, setPagination] = useState({
        pageNumber: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
    });
    const [filterParams, setFilterParams] = useState({
        search: '',
        columnStatusId: null
    });

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
                    dueDate: task.dueDate || '',
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

    // Hàm để lấy danh sách thành viên trong milestone
    const fetchMembersInMilestone = async () => {
        if (!boardId) return;

        try {
            setTeamMembersLoading(true);
            const response = await getMembersInMilestone(boardId);
            console.log('Members in milestone:', response);

            if (response && Array.isArray(response)) {
                const formattedMembers = response.map(member => ({
                    id: member.accountId,
                    memberId: member.memberId,
                    name: member.fullName || 'Không có tên',
                    color: 'bg-blue-500', // Thêm màu mặc định
                    avatar: member.avatarUrl || null
                }));

                setTeamMembers(formattedMembers);
            } else {
                console.error('Định dạng phản hồi API không hợp lệ:', response);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách thành viên:', error);
        } finally {
            setTeamMembersLoading(false);
        }
    };


    //     // Tạo số ngẫu nhiên từ id
    //     let sum = 0;
    //     for (let i = 0; i < id.toString().length; i++) {
    //         sum += id.toString().charCodeAt(i);
    //     }

    //     return colors[sum % colors.length];
    // }// Hàm tạo màu ngẫu nhiên từ ID
    // // const generateRandomColor = (id) => {
    // //     const colors = [
    // //         'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    // //         'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    // //         'bg-orange-500', 'bg-gray-500'
    // //     ];;


    // Lấy dữ liệu của bảng và thành viên khi component mount
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
                Promise.all([fetchTaskBoard(boardId), fetchMembersInMilestone()])
                    .finally(() => {
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

                        // Gọi fetchTaskBoard và fetchMembersInMilestone song song
                        await Promise.all([fetchTaskBoard(boardId), fetchMembersInMilestone()]);
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

                        // Vẫn thử lấy danh sách thành viên
                        await fetchMembersInMilestone();
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
    const handleAddMilestone = async () => {
        if (newMilestoneTitle.trim() === '') {
            toast.error('Tên cột không được để trống!');
            return;
        }

        try {
            setLoading(true);
            // Gọi API để tạo cột mới
            const columnData = {
                milestoneId: parseInt(boardId),
                columnName: newMilestoneTitle,
                description: newMilestoneDescription
            };

            const response = await createColumn(columnData);
            console.log('API Response createColumn:', response);

            if (response) {

                //  // Cập nhật state sau khi tạo cột thành công
                //  const newColumn = {
                //     id: `milestone-${response.columnStatusId}`,
                //     columnId: response.columnStatusId,
                //     title: response.columnName,
                //     description: response.description || '',
                //     sortOrder: response.sortOrder || 0,
                //     tasks: []
                // };

                // setColumns({
                //     ...columns,
                //     [`milestone-${response.columnStatusId}`]: newColumn
                // });
                // Reset form
                setNewMilestoneTitle('');
                setNewMilestoneDescription('');
                setShowNewMilestoneForm(false);

                // Tải lại dữ liệu task board để cập nhật UI ngay lập tức
                await fetchTaskBoard(boardId);

                toast.success('Đã tạo cột mới thành công!');
                return response;
            } else {
                toast.error('Không thể tạo cột mới');
                return null;
            }
        } catch (error) {
            console.error('Lỗi khi tạo cột mới:', error);
            toast.error('Có lỗi xảy ra khi tạo cột mới');
            return null;
        } finally {
            setLoading(false);
        }
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
            note: '',
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
            note: task.note || '',
            progress: task.progress || 0
        });
    };

    // Lưu task (thêm mới hoặc cập nhật)
    const handleSaveTask = async () => {
        if (!editingTask || taskFormData.title.trim() === '') {
            toast.error('Tiêu đề không được để trống!');
            return;
        }

        const { milestoneId, taskId, isNew } = editingTask;
        const milestone = columns[milestoneId];

        try {
            if (isNew) {
                // Thêm task mới - xử lý trong một hàm khác
                // TODO: Implement API call for createTask
                const newTask = {
                    id: `task-${Date.now()}`,
                    ...taskFormData
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
                const task = milestone.tasks.find(t => t.id === taskId);
                if (!task) {
                    console.error("Không tìm thấy task:", taskId);
                    return;
                }

                // Lấy taskId thực tế (số nguyên)
                const actualTaskId = task.taskId || parseInt(task.id.split('-')[1]);

                // Tạo dữ liệu cập nhật cho API
                const updateData = {
                    taskId: actualTaskId,
                    title: taskFormData.title,
                    description: taskFormData.description || '',
                    priority: taskFormData.priority || 'medium',
                    dueDate: taskFormData.dueDate || null,
                    columnnStatusId: milestone.columnId,
                    note: taskFormData.note || ''
                };

                // Gọi API cập nhật task
                console.log('Calling updateTask API with data:', updateData);
                const response = await updateTask(updateData);
                console.log('API Response for updateTask:', response);

                // Cập nhật UI
                const updatedTasks = milestone.tasks.map(t =>
                    t.id === taskId ? {
                        ...t,
                        ...taskFormData
                    } : t
                );

                setColumns({
                    ...columns,
                    [milestoneId]: {
                        ...milestone,
                        tasks: updatedTasks
                    }
                });

                // Cập nhật viewingTask nếu đang xem task này
                if (viewingTask && viewingTask.id === taskId && viewingTask.milestoneId === milestoneId) {
                    setViewingTask({
                        ...viewingTask,
                        ...taskFormData
                    });
                }

                toast.success('Cập nhật công việc thành công!');
            }
        } catch (error) {
            console.error('Lỗi khi lưu task:', error);
            toast.error('Có lỗi xảy ra khi lưu công việc');
        } finally {
            // Reset form và trạng thái
            setEditingTask(null);
            setTaskFormData({
                title: '',
                description: '',
                priority: 'medium',
                assignee: '',
                dueDate: '',
                note: ''
            });
        }
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
    const handleSaveTaskField = async (newValue) => {
        const { field, taskId, milestoneId } = editFieldData;
        const milestone = columns[milestoneId];

        if (!milestone) return;

        // Tìm task trong milestone
        const task = milestone.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error("Không tìm thấy task:", taskId);
            return;
        }

        // Lấy taskId thực tế (số nguyên)
        const actualTaskId = task.taskId || parseInt(task.id.split('-')[1]);

        try {
            // Tạo dữ liệu cập nhật cho API
            let updateData = {
                taskId: actualTaskId,
                title: task.title,
                priority: task.priority,
                description: task.description,
                dueDate: task.dueDate,
                columnnStatusId: milestone.columnId,
                note: task.note || ''
            };

            // Cập nhật trường tương ứng
            switch (field) {
                case 'title':
                    updateData.title = newValue;
                    break;
                case 'dueDate':
                    // Đảm bảo định dạng ngày phù hợp với API
                    updateData.dueDate = newValue;
                    break;
                case 'priority':
                    updateData.priority = newValue;
                    break;
                default:
                    break;
            }

            // Gọi API cập nhật task
            console.log('Calling updateTask API with data:', updateData);
            const response = await updateTask(updateData);
            console.log('API Response for updateTask:', response);

            // Cập nhật state UI
            const updatedTasks = milestone.tasks.map(t =>
                t.id === taskId ? { ...t, [field]: newValue } : t
            );

            setColumns({
                ...columns,
                [milestoneId]: {
                    ...milestone,
                    tasks: updatedTasks
                }
            });

            // Cập nhật viewingTask nếu đang xem task này
            if (viewingTask && viewingTask.id === taskId && viewingTask.milestoneId === milestoneId) {
                setViewingTask({
                    ...viewingTask,
                    [field]: newValue
                });
            }

            toast.success('Cập nhật thành công!');
        } catch (error) {
            console.error('Lỗi khi cập nhật task:', error);
            toast.error('Có lỗi xảy ra khi cập nhật task');
        } finally {
            setEditingTaskField(null);
        }
    };

    // Xử lý khi click vào task
    const handleTaskClick = async (milestoneId, task) => {
        try {
            // Hiển thị loading hoặc thông báo đang tải dữ liệu
            setLoading(true);

            // Lấy taskId thực tế (số nguyên) từ task.taskId hoặc từ id nếu task.taskId không tồn tại
            const actualTaskId = task.taskId || parseInt(task.id.split('-')[1]);

            if (!actualTaskId) {
                console.error('Không tìm thấy taskId hợp lệ:', task);
                toast.error('Không thể tải thông tin chi tiết task');
                return;
            }

            // Gọi API để lấy chi tiết task
            const response = await getTaskDetail(actualTaskId);

            // Lấy bình luận của task từ API
            let comments = [];
            try {
                const commentsResponse = await getCommentsByTaskId(actualTaskId);
                console.log('Comments response:', commentsResponse);

                // Chuyển đổi cấu trúc bình luận từ API sang định dạng phù hợp để hiển thị
                if (commentsResponse && Array.isArray(commentsResponse)) {
                    comments = commentsResponse.map(comment => ({
                        id: comment.commentTaskId,
                        text: comment.comment,
                        userId: comment.accountId,
                        userName: comment.fullName,
                        timestamp: comment.createAt,
                        userAvatar: comment.avatarUrl
                    }));
                }
            } catch (error) {
                console.error('Lỗi khi lấy bình luận:', error);
            }

            if (response) {
                // Chuyển đổi dữ liệu API thành định dạng viewingTask
                const taskDetail = {
                    ...task,
                    milestoneId,
                    description: response.description || task.description,
                    priority: response.priority?.toLowerCase() || task.priority,
                    dueDate: response.dueDate || task.dueDate,
                    status: response.status || task.status,
                    progress: response.progress || task.progress || 0,
                    assignees: response.assignees || task.assignees || [],
                    comments: comments, // Sử dụng comments từ API
                    note: response.note || task.note || '',
                    createdBy: response.createdBy || task.createdBy || '',
                    asignTo: response.asignTo || task.asignTo || []
                };

                setViewingTask(taskDetail);
                setShowTaskDetailModal(true);
            } else {
                // Nếu không lấy được dữ liệu từ API, sử dụng dữ liệu từ state
                setViewingTask({
                    ...task,
                    milestoneId,
                    comments: comments // Vẫn sử dụng comments từ API nếu có
                });
                setShowTaskDetailModal(true);
                console.warn('Không thể lấy dữ liệu chi tiết từ API, sử dụng dữ liệu local');
            }
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết task:', error);
            // Trong trường hợp lỗi, vẫn hiển thị dữ liệu từ state
            setViewingTask({
                ...task,
                milestoneId
            });
            setShowTaskDetailModal(true);
            toast.error('Có lỗi xảy ra khi tải thông tin chi tiết');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý thêm thành viên vào task
    const handleAddMember = async (taskId, milestoneId, memberId) => {
        const milestone = columns[milestoneId];

        if (!milestone || !milestone.tasks) {
            console.error("⛔ Milestone không tồn tại hoặc chưa có tasks:", milestoneId);
            return;
        }

        try {
            // Tìm task trong milestone
            const task = milestone.tasks.find(t => t.id === taskId);
            if (!task) {
                console.error("⛔ Không tìm thấy task:", taskId);
                return;
            }

            // Lấy taskId thực tế (số nguyên)
            const actualTaskId = task.taskId || parseInt(task.id.split('-')[1]);

            if (!actualTaskId) {
                console.error('Không tìm thấy taskId hợp lệ:', task);
                toast.error('Không thể gán thành viên cho task');
                return;
            }

            // Gọi API để gán task cho người dùng
            const response = await assignTask({
                taskId: actualTaskId,
                accountId: memberId
            });

            console.log('Assign task response:', response);

            // Cập nhật UI ngay lập tức (optimistic update)
            const updatedTasks = milestone.tasks.map(t => {
                if (t.id === taskId) {
                    // Tạo mảng assignees nếu chưa có hoặc thêm vào mảng hiện có
                    const assignees = t.assignees || [];
                    // Chỉ thêm thành viên nếu chưa tồn tại
                    if (!assignees.includes(memberId)) {
                        return {
                            ...t,
                            assignees: [...assignees, memberId]
                        };
                    }
                }
                return t;
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

            toast.success('Đã thêm thành viên thành công');
        } catch (error) {
            console.error('Lỗi khi gán task cho người dùng:', error);
            toast.error('Có lỗi xảy ra khi thêm thành viên');
        }
    };

    // Xử lý xóa thành viên khỏi task
    const handleRemoveMember = async (taskId, milestoneId, memberIdToRemove) => {
        const milestone = columns[milestoneId];

        if (!milestone || !milestone.tasks) {
            console.error("⛔ Milestone không tồn tại hoặc chưa có tasks:", milestoneId);
            return;
        }

        try {
            // Tìm task trong milestone
            const task = milestone.tasks.find(t => t.id === taskId);
            if (!task) {
                console.error("⛔ Không tìm thấy task:", taskId);
                return;
            }

            // Lấy taskId thực tế (số nguyên)
            const actualTaskId = task.taskId || parseInt(task.id.split('-')[1]);

            if (!actualTaskId) {
                console.error('Không tìm thấy taskId hợp lệ:', task);
                toast.error('Không thể xóa thành viên khỏi task');
                return;
            }

            // Gọi API để hủy gán task cho người dùng
            const response = await unassignAccountFromTask(actualTaskId, memberIdToRemove);

            console.log('Unassign task response:', response);

            // Cập nhật UI ngay lập tức (optimistic update)
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

            toast.success('Đã xóa thành viên thành công');
        } catch (error) {
            console.error('Lỗi khi hủy gán task cho người dùng:', error);
            toast.error('Có lỗi xảy ra khi xóa thành viên');
        }
    };

    // Thêm bình luận cho task
    const handleAddComment = async (taskId, milestoneId, text) => {
        if (!text.trim()) return;

        const milestone = columns[milestoneId];
        if (!milestone || !milestone.tasks) return;

        try {
            // Tìm task trong milestone
            const task = milestone.tasks.find(t => t.id === taskId);
            if (!task) {
                console.error("Không tìm thấy task:", taskId);
                return;
            }

            // Lấy taskId thực tế (số nguyên)
            const actualTaskId = task.taskId || parseInt(task.id.split('-')[1]);

            if (!actualTaskId) {
                console.error('Không tìm thấy taskId hợp lệ:', task);
                toast.error('Không thể thêm bình luận');
                return;
            }

            // Lấy thông tin người dùng từ token
            const userInfo = getUserInfoFromToken();
            if (!userInfo || !userInfo.userId) {
                console.error('Không thể xác thực người dùng');
                toast.error('Bạn cần đăng nhập để thêm bình luận');
                return;
            }

            // Tạo dữ liệu comment để gửi lên API
            const commentData = {
                taskId: actualTaskId,
                accountId: userInfo.userId, // Sử dụng ID từ token
                comment: text.trim()
            };

            // Gọi API để thêm bình luận
            const response = await addCommentToTask(commentData);
            console.log('API Response for addCommentToTask:', response);

            // Sau khi thêm bình luận thành công, lấy lại danh sách bình luận mới từ API
            try {
                const commentsResponse = await getCommentsByTaskId(actualTaskId);

                // Chuyển đổi cấu trúc bình luận từ API sang định dạng phù hợp để hiển thị
                if (commentsResponse && Array.isArray(commentsResponse)) {
                    const comments = commentsResponse.map(comment => ({
                        id: comment.commentTaskId,
                        text: comment.comment,
                        userId: comment.accountId,
                        userName: comment.fullName,
                        timestamp: comment.createAt,
                        userAvatar: comment.avatarUrl
                    }));

                    // Cập nhật task hiện tại với danh sách bình luận mới
                    const updatedTasks = milestone.tasks.map(t => {
                        if (t.id === taskId) {
                            return {
                                ...t,
                                comments: comments
                            };
                        }
                        return t;
                    });

                    // Cập nhật state columns
                    setColumns({
                        ...columns,
                        [milestoneId]: {
                            ...milestone,
                            tasks: updatedTasks
                        }
                    });

                    // Cập nhật viewingTask nếu đang xem task này
                    if (viewingTask && viewingTask.id === taskId) {
                        setViewingTask({
                            ...viewingTask,
                            comments: comments
                        });
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy lại danh sách bình luận:', error);

                // Nếu không lấy được danh sách bình luận mới, thêm bình luận vào UI theo cách thông thường
                // Lấy thông tin chi tiết người dùng từ API getAccountInfo
                let userDetails = null;
                try {
                    userDetails = await getAccountInfo(userInfo.userId);
                } catch (error) {
                    console.error('Lỗi khi lấy thông tin chi tiết người dùng:', error);
                }

                // Cập nhật UI ngay lập tức (optimistic update)
                const updatedTasks = milestone.tasks.map(t => {
                    if (t.id === taskId) {
                        const comments = t.comments || [];
                        return {
                            ...t,
                            comments: [
                                ...comments,
                                {
                                    id: response?.id || `comment-${Date.now()}`,
                                    text: text.trim(),
                                    userId: userInfo.userId,
                                    userName: userDetails?.fullname || userInfo.email || 'Người dùng',
                                    timestamp: response?.createAt,
                                    userAvatar: userDetails?.avatarUrl || null
                                }
                            ]
                        };
                    }
                    return t;
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
                if (viewingTask && viewingTask.id === taskId) {
                    const updatedTask = updatedTasks.find(t => t.id === taskId);
                    setViewingTask({
                        ...viewingTask,
                        comments: updatedTask.comments
                    });
                }
            }

            toast.success('Đã thêm bình luận thành công');

            // Reset input
            setCommentText('');
        } catch (error) {
            console.error('Lỗi khi thêm bình luận:', error);
            toast.error('Có lỗi xảy ra khi thêm bình luận');
        }
    };

    // Xóa bình luận
    const handleDeleteComment = async (taskId, milestoneId, commentId) => {
        const milestone = columns[milestoneId];
        if (!milestone || !milestone.tasks) return;

        try {
            // Gọi API xóa bình luận
            await deleteTaskComment(commentId);
            toast.success('Đã xóa bình luận thành công');

            // Tìm task trong milestone
            const task = milestone.tasks.find(t => t.id === taskId);
            if (!task) {
                console.error("Không tìm thấy task:", taskId);
                return;
            }

            // Lấy taskId thực tế (số nguyên)
            const actualTaskId = task.taskId || parseInt(task.id.split('-')[1]);

            if (!actualTaskId) {
                console.error('Không tìm thấy taskId hợp lệ:', task);
                return;
            }

            // Lấy lại danh sách bình luận mới từ API
            try {
                const commentsResponse = await getCommentsByTaskId(actualTaskId);

                // Chuyển đổi cấu trúc bình luận từ API sang định dạng phù hợp để hiển thị
                if (commentsResponse && Array.isArray(commentsResponse)) {
                    const comments = commentsResponse.map(comment => ({
                        id: comment.commentTaskId,
                        text: comment.comment,
                        userId: comment.accountId,
                        userName: comment.fullName,
                        timestamp: comment.createAt,
                        userAvatar: comment.avatarUrl
                    }));

                    // Cập nhật task hiện tại với danh sách bình luận mới
                    const updatedTasks = milestone.tasks.map(t => {
                        if (t.id === taskId) {
                            return {
                                ...t,
                                comments: comments
                            };
                        }
                        return t;
                    });

                    // Cập nhật state columns
                    setColumns({
                        ...columns,
                        [milestoneId]: {
                            ...milestone,
                            tasks: updatedTasks
                        }
                    });

                    // Cập nhật viewingTask nếu đang xem task này
                    if (viewingTask && viewingTask.id === taskId) {
                        setViewingTask({
                            ...viewingTask,
                            comments: comments
                        });
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy lại danh sách bình luận:', error);

                // Nếu không lấy được danh sách bình luận mới, chỉ xóa bình luận trong UI
                const updatedTasks = milestone.tasks.map(task => {
                    if (task.id === taskId && task.comments) {
                        return {
                            ...task,
                            comments: task.comments.filter(comment => comment.id !== commentId)
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
                if (viewingTask && viewingTask.id === taskId) {
                    const updatedTask = updatedTasks.find(t => t.id === taskId);
                    setViewingTask({
                        ...viewingTask,
                        comments: updatedTask.comments
                    });
                }
            }
        } catch (error) {
            console.error('Lỗi khi xóa bình luận:', error);
            toast.error('Có lỗi xảy ra khi xóa bình luận');
        }
    };

    // Render danh sách thành viên được giao
    const renderAssignees = (task, teamMembers) => {
        // Nếu có assignees (mảng các id), ưu tiên sử dụng
        if (task.assignees && task.assignees.length > 0) {
            // Nếu chỉ có 1 thành viên
            if (task.assignees.length === 1) {
                const memberId = task.assignees[0];
                const member = teamMembers.find(m => m.id === memberId);

                return {
                    type: 'singleMember',
                    memberId: member?.id || memberId,
                    memberName: member?.name || memberId,
                    avatar: member?.avatar || null,
                    color: member?.color || 'bg-blue-500'
                };
            }

            // Nếu có nhiều thành viên, hiển thị số lượng
            const firstMember = teamMembers.find(m => m.id === task.assignees[0]);

            return {
                type: 'multipleMembers',
                memberId: firstMember?.id || task.assignees[0],
                memberName: firstMember?.name || 'Thành viên',
                avatar: firstMember?.avatar || null,
                count: task.assignees.length - 1,
                color: firstMember?.color || 'bg-blue-500'
            };
        }

        // Nếu có asignTo (mảng các URL avatar), sử dụng
        if (task.asignTo && task.asignTo.length > 0) {
            // Nếu chỉ có 1 URL avatar
            if (task.asignTo.length === 1) {
                return {
                    type: 'singleAvatar',
                    avatarUrl: task.asignTo[0]
                };
            }

            // Nếu có nhiều URL avatar
            return {
                type: 'multipleAvatars',
                avatarUrl: task.asignTo[0],
                count: task.asignTo.length - 1
            };
        }

        // Nếu không có cả hai
        return {
            type: 'notAssigned',
            content: 'Chưa giao'
        };
    };

    // Render người được giao cho TaskOverlay
    const renderOverlayAssignees = (task, teamMembers) => {
        // Nếu có assignees (mảng các id), ưu tiên sử dụng
        if (task.assignees && task.assignees.length > 0) {
            // Nếu chỉ có 1 thành viên
            if (task.assignees.length === 1) {
                const memberId = task.assignees[0];
                const member = teamMembers.find(m => m.id === memberId);

                return {
                    type: 'singleMember',
                    memberId: member?.id || memberId,
                    memberName: member?.name || memberId,
                    avatar: member?.avatar || null,
                    color: member?.color || 'bg-blue-500'
                };
            }

            // Nếu có nhiều thành viên, hiển thị số lượng
            const firstMember = teamMembers.find(m => m.id === task.assignees[0]);

            return {
                type: 'multipleMembers',
                memberId: firstMember?.id || task.assignees[0],
                memberName: firstMember?.name || 'Thành viên',
                avatar: firstMember?.avatar || null,
                count: task.assignees.length - 1,
                color: firstMember?.color || 'bg-blue-500'
            };
        }

        // Nếu có asignTo (mảng các URL avatar), sử dụng
        if (task.asignTo && task.asignTo.length > 0) {
            // Nếu chỉ có 1 URL avatar
            if (task.asignTo.length === 1) {
                return {
                    type: 'singleAvatar',
                    avatarUrl: task.asignTo[0]
                };
            }

            // Nếu có nhiều URL avatar
            return {
                type: 'multipleAvatars',
                avatarUrl: task.asignTo[0],
                count: task.asignTo.length - 1
            };
        }

        // Nếu không có cả hai
        return {
            type: 'notAssigned',
            content: 'Chưa giao'
        };
    };

    // Hàm lấy danh sách task theo milestone cho chế độ xem danh sách
    const fetchTasksList = async (milestoneId, pageNumber = 1, pageSize = 10, search = null, columnStatusId = null) => {
        if (!milestoneId) return;

        try {
            setTasksListLoading(true);
            const response = await getTasksByMilestone(milestoneId, pageNumber, pageSize, search, columnStatusId);

            if (response && response.items) {
                setTasksList(response.items);
                setPagination({
                    pageNumber: response.pageNumber || 1,
                    pageSize: response.pageSize || 10,
                    totalItems: response.totalItems || 0,
                    totalPages: response.totalPages || 0
                });
            } else {
                console.error('Định dạng phản hồi API không hợp lệ:', response);
                toast.error('Không thể tải danh sách task');
                setTasksList([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách task:', error);
            setTasksList([]);
        } finally {
            setTasksListLoading(false);
        }
    };

    // Hàm xử lý thay đổi trang
    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        setPagination({ ...pagination, pageNumber: newPage });
        fetchTasksList(boardId, newPage, pagination.pageSize, filterParams.search, filterParams.columnStatusId);
    };

    // Hàm xử lý thay đổi kích thước trang
    const handlePageSizeChange = (newSize) => {
        setPagination({ ...pagination, pageSize: newSize, pageNumber: 1 });
        fetchTasksList(boardId, 1, newSize, filterParams.search, filterParams.columnStatusId);
    };

    // Hàm xử lý tìm kiếm
    const handleSearch = (searchTerm) => {
        setFilterParams({ ...filterParams, search: searchTerm });
        fetchTasksList(boardId, 1, pagination.pageSize, searchTerm, filterParams.columnStatusId);
    };

    // Hàm xử lý lọc theo trạng thái cột
    const handleFilterByColumn = (columnId) => {
        setFilterParams({ ...filterParams, columnStatusId: columnId });
        fetchTasksList(boardId, 1, pagination.pageSize, filterParams.search, columnId);
    };

    // Hàm xử lý tìm kiếm cục bộ
    const handleLocalSearch = (searchTerm) => {
        // Cập nhật state filterParams
        const newFilterParams = { ...filterParams, search: searchTerm };
        setFilterParams(newFilterParams);

        // Luôn bắt đầu từ danh sách gốc
        let filteredTasks = [...originalTasksList];

        // Lọc tasks theo từ khóa tìm kiếm
        if (searchTerm && searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            filteredTasks = filteredTasks.filter(task =>
                task.title?.toLowerCase().includes(searchLower) ||
                task.description?.toLowerCase().includes(searchLower) ||
                task.note?.toLowerCase().includes(searchLower)
            );
        }

        // Lọc theo columnStatusId nếu có
        if (newFilterParams.columnStatusId) {
            filteredTasks = filteredTasks.filter(task =>
                task.columnStatusId == newFilterParams.columnStatusId
            );
        }

        // Cập nhật state tasksList với kết quả lọc
        setTasksList(filteredTasks);

        // Cập nhật phân trang
        const totalItems = filteredTasks.length;
        const totalPages = Math.ceil(totalItems / pagination.pageSize);
        setPagination({
            ...pagination,
            totalItems,
            totalPages,
            pageNumber: 1 // Reset về trang đầu tiên khi tìm kiếm
        });
    };

    // Hàm lọc theo cột cục bộ
    const handleLocalFilterByColumn = (columnId) => {
        // Cập nhật state filterParams
        const newFilterParams = { ...filterParams, columnStatusId: columnId };
        setFilterParams(newFilterParams);

        // Luôn bắt đầu từ danh sách gốc
        let filteredTasks = [...originalTasksList];

        // Lọc tasks theo từ khóa tìm kiếm hiện tại
        if (newFilterParams.search && newFilterParams.search.trim() !== '') {
            const searchLower = newFilterParams.search.toLowerCase();
            filteredTasks = filteredTasks.filter(task =>
                task.title?.toLowerCase().includes(searchLower) ||
                task.description?.toLowerCase().includes(searchLower) ||
                task.note?.toLowerCase().includes(searchLower)
            );
        }

        // Lọc theo columnStatusId
        if (columnId) {
            filteredTasks = filteredTasks.filter(task =>
                task.columnStatusId == columnId
            );
        }

        // Cập nhật state tasksList với kết quả lọc
        setTasksList(filteredTasks);

        // Cập nhật phân trang
        const totalItems = filteredTasks.length;
        const totalPages = Math.ceil(totalItems / pagination.pageSize);
        setPagination({
            ...pagination,
            totalItems,
            totalPages,
            pageNumber: 1 // Reset về trang đầu tiên khi lọc
        });
    };

    // Hàm để phân trang cục bộ
    const handleLocalPageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        setPagination({ ...pagination, pageNumber: newPage });
    };

    // Hàm xử lý thay đổi kích thước trang cục bộ
    const handleLocalPageSizeChange = (newSize) => {
        const totalPages = Math.ceil(pagination.totalItems / newSize);
        setPagination({
            ...pagination,
            pageSize: newSize,
            pageNumber: 1,
            totalPages
        });
    };

    // Lưu trữ danh sách task gốc từ API
    const [originalTasksList, setOriginalTasksList] = useState([]);

    // Gọi API lấy danh sách task khi chuyển sang chế độ xem danh sách
    const loadTasksListView = async () => {
        try {
            setTasksListLoading(true);
            const response = await getTasksByMilestone(boardId, 1, 1000); // Lấy tất cả task với pageSize lớn

            if (response && response.items) {
                // Lưu trữ danh sách gốc và danh sách hiển thị
                setOriginalTasksList(response.items);
                setTasksList(response.items);

                // Cập nhật phân trang
                setPagination({
                    pageNumber: 1,
                    pageSize: 10,
                    totalItems: response.items.length,
                    totalPages: Math.ceil(response.items.length / 10)
                });
            } else {
                console.error('Định dạng phản hồi API không hợp lệ:', response);
                toast.error('Không thể tải danh sách task');
                setTasksList([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách task:', error);
            setTasksList([]);
        } finally {
            setTasksListLoading(false);
        }
    };

    // // Thêm column mới bằng API
    // const handleCreateColumn = async (columnData) => {
    //     if (!columnData.columnName || !columnData.milestoneId) {
    //         toast.error('Tên cột và milestoneId không được để trống!');
    //         return;
    //     }

    //     try {
    //         setLoading(true);
    //         const response = await createColumn(columnData);
    //         console.log('API Response createColumn:', response);

    //         if (response) {
    //             // Cập nhật state sau khi tạo cột thành công
    //             const newColumn = {
    //                 id: response.columnStatusId,
    //                 columnId: response.columnStatusId,
    //                 title: response.columnName,
    //                 description: response.description || '',
    //                 sortOrder: response.sortOrder || 0,
    //                 tasks: []
    //             };

    //             setColumns({
    //                 ...columns,
    //                 [`milestone-${response.columnStatusId}`]: newColumn
    //             });

    //             toast.success('Đã tạo cột mới thành công!');
    //             return response;
    //         } else {
    //             toast.error('Không thể tạo cột mới');
    //             return null;
    //         }
    //     } catch (error) {
    //         console.error('Lỗi khi tạo cột mới:', error);
    //         toast.error('Có lỗi xảy ra khi tạo cột mới');
    //         return null;
    //     } finally {
    //         setLoading(false);
    //     }
    // };

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
        tasksList,
        tasksListLoading,
        pagination,
        filterParams,


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
        renderAssignees,
        renderOverlayAssignees,
        fetchTaskBoard,
        fetchTasksList,
        handlePageChange,
        handlePageSizeChange,
        handleSearch,
        handleFilterByColumn,
        loadTasksListView,
        setEditFieldData,
        handleLocalSearch,
        handleLocalFilterByColumn,
        handleLocalPageChange,
        handleLocalPageSizeChange,
        originalTasksList
        // handleCreateColumn,
    };
};

export default useMilestone; 