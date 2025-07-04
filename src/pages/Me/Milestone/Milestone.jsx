import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisV, faPencilAlt, faTrashAlt, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    closestCorners,
    pointerWithin,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

// Component cho Task có thể kéo thả và sắp xếp
const SortableTask = ({ task, milestoneId, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: task.id,
        data: {
            type: 'task',
            task,
            milestoneId,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Hiển thị màu ưu tiên
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-400';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-400';
        }
    };

    // Hiển thị trạng thái task
    const getStatusBadge = (status) => {
        switch (status) {
            case 'todo':
                return <span className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">To Do</span>;
            case 'inProgress':
                return <span className="px-2 py-1 text-xs rounded bg-blue-200 text-blue-700">Đang làm</span>;
            case 'done':
                return <span className="px-2 py-1 text-xs rounded bg-green-200 text-green-700">Hoàn thành</span>;
            default:
                return null;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white p-4 rounded shadow cursor-move"
            {...attributes}
            {...listeners}
        >
            <div className="flex justify-between">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} mt-1`}></div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onEdit(milestoneId, task)}
                        className="text-gray-400 hover:text-blue-600"
                    >
                        <FontAwesomeIcon icon={faPencilAlt} size="xs" />
                    </button>
                    <button
                        onClick={() => onDelete(milestoneId, task.id)}
                        className="text-gray-400 hover:text-red-600"
                    >
                        <FontAwesomeIcon icon={faTrashAlt} size="xs" />
                    </button>
                </div>
            </div>
            <h4 className="font-semibold mt-2">{task.title}</h4>
            <p className="text-gray-600 text-sm mt-1">{task.description}</p>
            <div className="mt-3">
                {getStatusBadge(task.status)}
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                <div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {task.assignee}
                    </span>
                </div>
                <div className="flex items-center">
                    <FontAwesomeIcon icon={faClock} className="mr-1" />
                    <span>{task.dueDate}</span>
                </div>
            </div>
        </div>
    );
};

// Component cho Milestone
const DroppableMilestone = ({ milestone, onAddTask, onDeleteMilestone, tasks, onEditTask, onDeleteTask }) => {
    // Sử dụng useDroppable hook để biến milestone thành drop zone
    const { setNodeRef } = useDroppable({
        id: milestone.id,
        data: {
            type: 'milestone',
            milestone,
        },
    });

    // Lấy danh sách taskIds cho SortableContext
    const taskIds = tasks.map(task => task.id);

    return (
        <div
            ref={setNodeRef}
            className="bg-gray-100 rounded-lg shadow min-w-[320px] max-w-[320px] flex-shrink-0"
        >
            {/* Tiêu đề milestone */}
            <div className="bg-white p-4 rounded-t-lg border-b flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg">{milestone.title}</h3>
                    <p className="text-gray-500 text-sm">{milestone.description}</p>
                </div>
                <div className="dropdown relative">
                    <button className="text-gray-500 hover:text-gray-700">
                        <FontAwesomeIcon icon={faEllipsisV} />
                    </button>
                    {/* Dropdown menu - có thể triển khai sau */}
                    <div className="hidden absolute right-0 mt-2 bg-white shadow-lg rounded z-10">
                        <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                            Chỉnh sửa
                        </button>
                        <button
                            className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                            onClick={() => onDeleteMilestone(milestone.id)}
                        >
                            Xóa
                        </button>
                    </div>
                </div>
            </div>

            {/* Tasks trong milestone */}
            <div className="p-3 flex flex-col gap-3 min-h-[400px]">
                <SortableContext
                    items={taskIds}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableTask
                            key={task.id}
                            task={task}
                            milestoneId={milestone.id}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                        />
                    ))}
                </SortableContext>

                {/* Nút thêm task mới */}
                <button
                    onClick={() => onAddTask(milestone.id)}
                    className="mt-2 flex items-center justify-center w-full py-2 border border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" /> Thêm công việc
                </button>
            </div>
        </div>
    );
};

// Task component dành riêng cho DragOverlay
const TaskOverlay = ({ task }) => {
    // Hiển thị màu ưu tiên
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-400';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-400';
        }
    };

    // Hiển thị trạng thái task
    const getStatusBadge = (status) => {
        switch (status) {
            case 'todo':
                return <span className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">To Do</span>;
            case 'inProgress':
                return <span className="px-2 py-1 text-xs rounded bg-blue-200 text-blue-700">Đang làm</span>;
            case 'done':
                return <span className="px-2 py-1 text-xs rounded bg-green-200 text-green-700">Hoàn thành</span>;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white p-4 rounded shadow border-2 border-blue-400 w-[320px] opacity-95">
            <div className="flex justify-between">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} mt-1`}></div>
            </div>
            <h4 className="font-semibold mt-2">{task.title}</h4>
            <p className="text-gray-600 text-sm mt-1">{task.description}</p>
            <div className="mt-3">
                {getStatusBadge(task.status)}
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                <div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {task.assignee}
                    </span>
                </div>
                <div className="flex items-center">
                    <FontAwesomeIcon icon={faClock} className="mr-1" />
                    <span>{task.dueDate}</span>
                </div>
            </div>
        </div>
    );
};

const Milestone = () => {
    const { boardId } = useParams();
    const navigate = useNavigate();

    // Thiết lập sensors cho DND Kit
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Dữ liệu mẫu cho bảng hiện tại
    const [boardData, setBoardData] = useState(null);

    // State cho việc hiển thị task đang được kéo
    const [activeId, setActiveId] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [activeContainer, setActiveContainer] = useState(null);

    // Dữ liệu mẫu cho các milestone và các task bên trong
    const [columns, setColumns] = useState({
        'milestone-1': {
            milestoneId: '2',
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
    });

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

    // Lấy dữ liệu của bảng dựa vào boardId
    useEffect(() => {
        if (boardId) {
            try {
                // Lấy dữ liệu từ localStorage nếu có
                const savedBoardData = localStorage.getItem('currentBoardData');
                if (savedBoardData) {
                    setBoardData(JSON.parse(savedBoardData));
                } else {
                    // Nếu không có dữ liệu trong localStorage, sử dụng mock data
                    setBoardData(mockBoardsData[boardId]);
                }

                // Lấy dữ liệu columns từ localStorage nếu có
                const savedColumns = localStorage.getItem('currentMilestoneColumns');
                if (savedColumns) {
                    setColumns(JSON.parse(savedColumns));
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ localStorage:', error);
                // Fallback to mockData
                setBoardData(mockBoardsData[boardId]);
            }
        }
    }, [boardId]);

    const [showNewMilestoneForm, setShowNewMilestoneForm] = useState(false);
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
    const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
    const [editingTask, setEditingTask] = useState(null);
    const [taskFormData, setTaskFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        dueDate: ''
    });

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
        const sourceMilestoneId = active.data.current.milestoneId;

        // Kiểm tra xem target có phải là milestone hay task
        const isMilestoneTarget = Object.keys(columns).includes(over.id);
        const targetMilestoneId = isMilestoneId(over, isMilestoneTarget, sourceMilestoneId);

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

    // Xử lý di chuyển task giữa các milestone
    const handleCrossMilestoneMovement = (taskId, sourceMilestoneId, targetMilestoneId) => {
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
            dueDate: ''
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
            dueDate: task.dueDate
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
                status: 'todo'
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
                task.id === taskId ? { ...task, ...taskFormData } : task
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
            dueDate: ''
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
    };

    // Xóa milestone
    const handleDeleteMilestone = (milestoneId) => {
        const newColumns = { ...columns };
        delete newColumns[milestoneId];
        setColumns(newColumns);
    };

    if (!boardData) {
        return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu bảng...</div>;
    }

    return (
        <div className="p-4">
            {/* Tiêu đề và nút thêm milestone */}
            <header className="bg-white shadow px-4 py-4 flex justify-between items-center mb-6 rounded-lg">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleBackToBoards}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                            <div className={`w-3 h-3 rounded-full ${boardData.color} mr-2`}></div>
                            {boardData.title}
                        </h1>
                        <p className="text-sm text-gray-500">{boardData.description}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowNewMilestoneForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"
                >
                    <FontAwesomeIcon icon={faPlus} /> Thêm Milestone
                </button>
            </header>

            {/* Form thêm milestone mới */}
            {showNewMilestoneForm && (
                <div className="bg-white p-6 mb-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Thêm Milestone mới</h2>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Tên milestone:</label>
                        <input
                            type="text"
                            value={newMilestoneTitle}
                            onChange={(e) => setNewMilestoneTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Ví dụ: Sprint 1 - Thiết kế UI"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Mô tả:</label>
                        <textarea
                            value={newMilestoneDescription}
                            onChange={(e) => setNewMilestoneDescription(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Mô tả chi tiết về milestone"
                            rows="3"
                        ></textarea>
                    </div>
                    <div className="flex justify-end">
                        <button
                            className="bg-gray-200 text-gray-800 px-4 py-2 rounded mr-2"
                            onClick={() => setShowNewMilestoneForm(false)}
                        >
                            Hủy
                        </button>
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                            onClick={handleAddMilestone}
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            )}

            {/* Form chỉnh sửa task */}
            {editingTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingTask.isNew ? 'Thêm công việc mới' : 'Chỉnh sửa công việc'}
                        </h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Tiêu đề:</label>
                            <input
                                type="text"
                                value={taskFormData.title}
                                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                placeholder="Nhập tiêu đề công việc"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Mô tả:</label>
                            <textarea
                                value={taskFormData.description}
                                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                placeholder="Mô tả chi tiết công việc"
                                rows="3"
                            ></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Độ ưu tiên:</label>
                            <select
                                value={taskFormData.priority}
                                onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="high">Cao</option>
                                <option value="medium">Trung bình</option>
                                <option value="low">Thấp</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Người được giao:</label>
                            <input
                                type="text"
                                value={taskFormData.assignee}
                                onChange={(e) => setTaskFormData({ ...taskFormData, assignee: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                placeholder="Nhập tên người được giao việc"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Hạn hoàn thành:</label>
                            <input
                                type="date"
                                value={taskFormData.dueDate}
                                onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                className="bg-gray-200 text-gray-800 px-4 py-2 rounded mr-2"
                                onClick={() => setEditingTask(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded"
                                onClick={handleSaveTask}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hiển thị các milestone và task */}
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToWindowEdges]}
            >
                <div className="flex overflow-x-auto pb-4 space-x-4">
                    {Object.values(columns).map(milestone => (
                        <DroppableMilestone
                            key={milestone.id}
                            milestone={milestone}
                            onAddTask={handleAddTask}
                            onDeleteMilestone={handleDeleteMilestone}
                            tasks={milestone.tasks}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                        />
                    ))}
                </div>

                {/* Hiển thị overlay khi kéo task */}
                <DragOverlay dropAnimation={null} modifiers={[restrictToWindowEdges]}>
                    {activeTask ? (
                        <TaskOverlay task={activeTask} />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default Milestone; 