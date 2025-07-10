import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPenToSquare, faEllipsisV, faPencilAlt, faTrashAlt, faClock, faArrowLeft, faEdit, faCalendarAlt, faUserFriends, faTag, faArrowRight, faCopy, faLink, faArchive, faCheck, faComment, faPaperPlane, faColumns, faList } from '@fortawesome/free-solid-svg-icons';
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
import useMilestone from '@/hooks/useMilestone';

// Component cho Task có thể kéo thả và sắp xếp
const SortableTask = ({ task, milestoneId, onEdit, onDelete, onEditField, onTaskClick, teamMembers }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Đóng dropdown khi click ngoài menu
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

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
                return (
                    <span className="px-3 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700 flex items-center w-fit">
                        <span className="w-2 h-2 rounded-full bg-gray-500 mr-1.5"></span>
                        To Do
                    </span>
                );
            case 'inProgress':
                return (
                    <span className="px-3 py-1 text-xs rounded-full font-medium bg-blue-50 text-blue-700 flex items-center w-fit">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                        Đang làm
                    </span>
                );
            case 'done':
                return (
                    <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-50 text-green-700 flex items-center w-fit">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                        Hoàn thành
                    </span>
                );
            default:
                return null;
        }
    };

    // Handle mở dropdown menu
    const toggleDropdown = (e) => {
        e.stopPropagation();
        setShowDropdown(!showDropdown);
    };

    // Các action cho task
    const handleEditClick = (e) => {
        e.stopPropagation();
        setShowDropdown(false);
        onEdit(milestoneId, task);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDropdown(false);
        onDelete(milestoneId, task.id);
    };

    const handleEditFieldClick = (field, e) => {
        e.stopPropagation();
        setShowDropdown(false);
        onEditField(milestoneId, task.id, field);
    };

    // Xử lý click vào task
    const handleTaskClick = (e) => {
        // Chỉ xử lý click vào task, không xử lý click vào các button trong task
        if (!e.target.closest('button')) {
            e.stopPropagation();
            onTaskClick(milestoneId, task);
        }
    };

    // Đổi cấu trúc để task có thể có nhiều assignees
    const renderAssignees = (task, teamMembers) => {
        if (!task.assignees || task.assignees.length === 0) {
            return { type: 'notAssigned', content: 'Chưa giao' };
        }

        // Nếu chỉ có 1 thành viên
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

        // Nếu có nhiều thành viên, hiển thị số lượng
        const firstMember = teamMembers.find(m => m.id === task.assignees[0]);

        return {
            type: 'multipleMembers',
            memberId: firstMember?.id || task.assignees[0].charAt(0),
            count: task.assignees.length - 1,
            color: firstMember?.color || 'bg-blue-500'
        };
    };

    // Render assignees dựa trên đối tượng từ hook
    const renderAssigneesComponent = (task, teamMembers) => {
        const assigneeData = renderAssignees(task, teamMembers);

        if (assigneeData.type === 'notAssigned') {
            return (
                <span className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full font-medium">
                    {assigneeData.content}
                </span>
            );
        } else if (assigneeData.type === 'singleMember') {
            return (
                <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full ${assigneeData.color} flex items-center justify-center text-white font-medium`}>
                        {assigneeData.memberId}
                    </div>
                    <span className="ml-1 text-xs text-gray-600 truncate max-w-[60px]">{assigneeData.memberName}</span>
                </div>
            );
        } else if (assigneeData.type === 'multipleMembers') {
            return (
                <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full ${assigneeData.color} flex items-center justify-center text-white font-medium`}>
                        {assigneeData.memberId}
                    </div>
                    <span className="ml-1 text-xs text-gray-600">+{assigneeData.count}</span>
                </div>
            );
        }

        return null;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-100 relative task-card-hover"
            {...attributes}
            {...listeners}
            onClick={handleTaskClick}
        >
            <div className="flex justify-between items-center">
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                <button
                    onClick={toggleDropdown}
                    className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-50"
                >
                    <FontAwesomeIcon icon={faPenToSquare} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                    <div
                        ref={dropdownRef}
                        className="absolute right-2 top-10 bg-white shadow-lg rounded-lg overflow-hidden z-10 w-56 border border-gray-200 animate-fadeIn"
                    >
                        <div className="py-1">
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('title', e)}
                            >
                                <FontAwesomeIcon icon={faEdit} className="mr-3 text-gray-500" /> Chỉnh sửa nhiệm vụ
                            </button>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('assignee', e)}
                            >
                                <FontAwesomeIcon icon={faUserFriends} className="mr-3 text-gray-500" /> Thay đổi người giao
                            </button>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('dueDate', e)}
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} className="mr-3 text-gray-500" /> Chỉnh sửa ngày
                            </button>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('progress', e)}
                            >
                                <FontAwesomeIcon icon={faArrowRight} className="mr-3 text-gray-500" /> Cập nhật tiến độ
                            </button>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('priority', e)}
                            >
                                <FontAwesomeIcon icon={faTag} className="mr-3 text-gray-500" /> Đổi độ ưu tiên
                            </button>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('status', e)}
                            >
                                <FontAwesomeIcon icon={faCopy} className="mr-3 text-gray-500" /> Đổi trạng thái
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                onClick={handleDeleteClick}
                            >
                                <FontAwesomeIcon icon={faTrashAlt} className="mr-3" /> Xóa
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <h4 className="font-semibold mt-2 text-gray-800">{task.title}</h4>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{task.description}</p>
            <div className="mt-3">
                {getStatusBadge(task.status)}
            </div>

            {/* Thanh tiến độ */}
            <div className="mt-4">
                <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className="text-gray-600">Tiến độ</span>
                    <span className="text-blue-600 font-semibold">{task.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{
                            width: `${task.progress || 0}%`,
                            backgroundColor: task.progress >= 100 ? '#10B981' : task.progress > 50 ? '#3B82F6' : '#60A5FA'
                        }}
                    ></div>
                </div>
            </div>

            <div className="mt-4 flex justify-between items-center text-xs">
                <div>
                    {renderAssigneesComponent(task, teamMembers)}
                </div>
                <div className="flex items-center text-gray-500">
                    <FontAwesomeIcon icon={faClock} className="mr-1.5" />
                    <span>{task.dueDate}</span>
                </div>
            </div>
        </div>
    );
};

// Component cho Milestone
const DroppableMilestone = ({ milestone, onAddTask, onDeleteMilestone, tasks, onEditTask, onDeleteTask, onEditTaskField, onTaskClick, teamMembers }) => {
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
            className="bg-gray-50 rounded-xl shadow-md min-w-[320px] max-w-[320px] flex-shrink-0 border border-gray-200"
        >
            {/* Tiêu đề milestone */}
            <div className="bg-white p-4 rounded-t-xl border-b flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-gray-800">{milestone.title}</h3>
                    <p className="text-gray-500 text-sm truncate max-w-[230px]">{milestone.description}</p>
                </div>
                <div className="dropdown relative">
                    <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <FontAwesomeIcon icon={faEllipsisV} />
                    </button>
                    {/* Dropdown menu - có thể triển khai sau */}
                    <div className="hidden absolute right-0 mt-2 bg-white shadow-lg rounded-lg z-10 overflow-hidden">
                        <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors">
                            Chỉnh sửa
                        </button>
                        <button
                            className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                            onClick={() => onDeleteMilestone(milestone.id)}
                        >
                            Xóa
                        </button>
                    </div>
                </div>
            </div>

            {/* Tasks trong milestone */}
            <div className="p-4 flex flex-col gap-3 min-h-[400px]">
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
                            onEditField={onEditTaskField}
                            onTaskClick={onTaskClick}
                            teamMembers={teamMembers}
                        />
                    ))}
                </SortableContext>

                {/* Nút thêm task mới */}
                <button
                    onClick={() => onAddTask(milestone.id)}
                    className="mt-2 flex items-center justify-center w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors hover:text-blue-600 hover:border-blue-300 group"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2 group-hover:scale-110 transition-transform" /> Thêm công việc
                </button>
            </div>
        </div>
    );
};

// Task component dành riêng cho DragOverlay
const TaskOverlay = ({ task, teamMembers }) => {
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
                return (
                    <span className="px-3 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700 flex items-center w-fit">
                        <span className="w-2 h-2 rounded-full bg-gray-500 mr-1.5"></span>
                        To Do
                    </span>
                );
            case 'inProgress':
                return (
                    <span className="px-3 py-1 text-xs rounded-full font-medium bg-blue-50 text-blue-700 flex items-center w-fit">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                        Đang làm
                    </span>
                );
            case 'done':
                return (
                    <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-50 text-green-700 flex items-center w-fit">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                        Hoàn thành
                    </span>
                );
            default:
                return null;
        }
    };

    // Render overlay assignees dựa trên đối tượng từ hook
    const renderOverlayAssigneesComponent = () => {
        const assigneeData = renderAssignees(task, teamMembers);

        if (assigneeData.type === 'notAssigned') {
            return (
                <span className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full font-medium">
                    {assigneeData.content}
                </span>
            );
        } else if (assigneeData.type === 'singleMember') {
            return (
                <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full ${assigneeData.color} flex items-center justify-center text-white font-medium mr-1`}>
                        {assigneeData.memberId}
                    </div>
                    <span className="text-sm">{assigneeData.memberName}</span>
                </div>
            );
        } else if (assigneeData.type === 'multipleMembers') {
            return (
                <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full ${assigneeData.color} flex items-center justify-center text-white font-medium mr-1`}>
                        {assigneeData.memberId}
                    </div>
                    <span className="text-sm">+{assigneeData.count}</span>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-400 w-[320px] opacity-95">
            <div className="flex justify-between items-center">
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
            </div>
            <h4 className="font-semibold mt-2 text-gray-800">{task.title}</h4>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{task.description}</p>
            <div className="mt-3">
                {getStatusBadge(task.status)}
            </div>

            {/* Thanh tiến độ */}
            <div className="mt-4">
                <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className="text-gray-600">Tiến độ</span>
                    <span className="text-blue-600 font-semibold">{task.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{
                            width: `${task.progress || 0}%`,
                            backgroundColor: task.progress >= 100 ? '#10B981' : task.progress > 50 ? '#3B82F6' : '#60A5FA'
                        }}
                    ></div>
                </div>
            </div>

            <div className="mt-4 flex justify-between items-center text-xs">
                <div>
                    {renderOverlayAssigneesComponent()}
                </div>
                <div className="flex items-center text-gray-500">
                    <FontAwesomeIcon icon={faClock} className="mr-1.5" />
                    <span>{task.dueDate}</span>
                </div>
            </div>
        </div>
    );
};

const Milestone = () => {
    // Sử dụng hook useMilestone để lấy toàn bộ state và handler
    const {
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
        setShowNewMilestoneForm,
        setNewMilestoneTitle,
        setNewMilestoneDescription,
        setTaskFormData,
        setShowTaskDetailModal,
        setShowMemberDropdown,
        setMemberSearchQuery,
        setCommentText,
        setShowComments,
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
        formatCommentTime,
        renderAssignees,
        renderOverlayAssignees,
        setEditingTask
    } = useMilestone();

    // Thêm state để quản lý chế độ xem (kanban hoặc list)
    const [viewMode, setViewMode] = useState('kanban');

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

    // State cho các thành viên
    const [selectedMember, setSelectedMember] = useState(null);

    // State cho bình luận
    const commentInputRef = useRef(null);

    // Lấy tất cả các tasks từ tất cả các milestone
    const getAllTasks = () => {
        const allTasks = [];
        Object.values(columns).forEach(milestone => {
            milestone.tasks.forEach(task => {
                allTasks.push({
                    ...task,
                    milestoneId: milestone.id,
                    columnStatus: milestone.title
                });
            });
        });
        return allTasks;
    };

    // Hàm xử lý hiển thị màu ưu tiên cho chế độ list
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-500';
            case 'medium': return 'text-yellow-500';
            case 'low': return 'text-green-500';
            default: return 'text-gray-500';
        }
    };

    // Hàm xử lý hiển thị màu badge ưu tiên
    const getPriorityBadgeColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Hàm hiển thị tên ưu tiên
    const getPriorityName = (priority) => {
        switch (priority) {
            case 'high': return 'Cao';
            case 'medium': return 'Trung bình';
            case 'low': return 'Thấp';
            default: return 'Không xác định';
        }
    };

    // Hàm hiển thị trạng thái
    const getStatusName = (status) => {
        switch (status) {
            case 'todo': return 'Cần làm';
            case 'inProgress': return 'Đang làm';
            case 'done': return 'Hoàn thành';
            default: return 'Không xác định';
        }
    };

    // Hàm hiển thị màu trạng thái
    const getStatusColor = (status) => {
        switch (status) {
            case 'todo': return 'bg-gray-100 text-gray-700';
            case 'inProgress': return 'bg-blue-100 text-blue-700';
            case 'done': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (!boardData) {
        return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu bảng...</div>;
    }

    return (
        <div className="p-4">
            {/* Tiêu đề và nút thêm milestone */}
            <header className="bg-white shadow-md px-6 py-5 flex justify-between items-center mb-8 rounded-xl">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleBackToBoards}
                        className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                            <div className={`w-4 h-4 rounded-full ${boardData.color} mr-3`}></div>
                            {boardData.title}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">{boardData.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Toggle chế độ xem */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                            onClick={() => setViewMode('kanban')}
                        >
                            <FontAwesomeIcon icon={faColumns} className="mr-2" /> Kanban
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <FontAwesomeIcon icon={faList} className="mr-2" /> Danh sách
                        </button>
                    </div>
                    <button
                        onClick={() => setShowNewMilestoneForm(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow flex items-center gap-2 transition-all font-medium"
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-sm" /> Thêm Milestone
                    </button>
                </div>
            </header>

            {/* Form thêm milestone mới (dạng popup) */}
            {showNewMilestoneForm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-7 rounded-xl  shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Thêm Milestone mới</h2>
                        <div className="mb-5">
                            <label className="block text-gray-700 mb-2 font-medium">Tên milestone:</label>
                            <input
                                type="text"
                                value={newMilestoneTitle}
                                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Ví dụ: Sprint 1 - Thiết kế UI"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2 font-medium">Mô tả:</label>
                            <textarea
                                value={newMilestoneDescription}
                                onChange={(e) => setNewMilestoneDescription(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Mô tả chi tiết về milestone"
                                rows="4"
                            ></textarea>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setShowNewMilestoneForm(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={handleAddMilestone}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Form chỉnh sửa task */}
            {editingTask && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-7 rounded-xl max-h-[90vh] overflow-y-auto shadow-xl w-full max-w-3xl transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">
                            {editingTask.isNew ? 'Thêm công việc mới' : 'Chỉnh sửa công việc'}
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Tiêu đề:</label>
                                    <input
                                        type="text"
                                        value={taskFormData.title}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Nhập tiêu đề công việc"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Mô tả:</label>
                                    <textarea
                                        value={taskFormData.description}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Mô tả chi tiết công việc"
                                        rows="5"
                                    ></textarea>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Độ ưu tiên:</label>
                                    <select
                                        value={taskFormData.priority}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                                    >
                                        <option value="high">Cao</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="low">Thấp</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Người được giao:</label>
                                    <input
                                        type="text"
                                        value={taskFormData.assignee}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, assignee: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Nhập tên người được giao việc"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Hạn hoàn thành:</label>
                                    <input
                                        type="date"
                                        value={taskFormData.dueDate}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="block text-gray-700 mb-2 font-medium">Tiến độ (%):</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={taskFormData.progress}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, progress: Math.min(100, Math.max(0, e.target.value)) })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Nhập phần trăm hoàn thành (0-100)"
                                    />
                                    <div className="mt-2 w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="h-2.5 rounded-full transition-all duration-300 progress-bar-animate"
                                            style={{
                                                width: `${taskFormData.progress || 0}%`,
                                                backgroundColor: taskFormData.progress >= 100 ? '#10B981' : taskFormData.progress > 50 ? '#3B82F6' : '#60A5FA'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Trạng thái:</label>
                                    <select
                                        value={taskFormData.status || 'todo'}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="inProgress">Đang làm</option>
                                        <option value="done">Hoàn thành</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4">
                            <button
                                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTask(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={handleSaveTask}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa tiêu đề và mô tả */}
            {editingTaskField === 'title' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Chỉnh sửa nhiệm vụ</h2>
                        <div className="mb-3">
                            <label className="block text-gray-700 mb-1 font-medium">Tiêu đề:</label>
                            <input
                                type="text"
                                value={editFieldData.currentValue}
                                onChange={(e) => setEditFieldData({ ...editFieldData, currentValue: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Nhập tiêu đề công việc"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 font-medium">Mô tả:</label>
                            <textarea
                                value={
                                    columns[editFieldData.milestoneId]?.tasks.find(
                                        t => t.id === editFieldData.taskId
                                    )?.description || ''
                                }
                                onChange={(e) => {
                                    const milestone = columns[editFieldData.milestoneId];
                                    const updatedTasks = milestone.tasks.map(task =>
                                        task.id === editFieldData.taskId ?
                                            { ...task, description: e.target.value } :
                                            task
                                    );
                                    setColumns({
                                        ...columns,
                                        [editFieldData.milestoneId]: {
                                            ...milestone,
                                            tasks: updatedTasks
                                        }
                                    });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Mô tả chi tiết công việc"
                                rows="3"
                            ></textarea>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTaskField(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(editFieldData.currentValue)}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa ngày */}
            {editingTaskField === 'dueDate' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Chỉnh sửa ngày hạn</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 font-medium">Ngày hạn hoàn thành:</label>
                            <input
                                type="date"
                                value={editFieldData.currentValue}
                                onChange={(e) => setEditFieldData({ ...editFieldData, currentValue: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTaskField(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(editFieldData.currentValue)}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa tiến độ */}
            {editingTaskField === 'progress' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Cập nhật tiến độ</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 font-medium">Tiến độ (%):</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={editFieldData.currentValue}
                                onChange={(e) => setEditFieldData({ ...editFieldData, currentValue: Math.min(100, Math.max(0, e.target.value)) })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Nhập phần trăm hoàn thành (0-100)"
                            />
                            <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-2 rounded-full transition-all duration-300 progress-bar-animate"
                                    style={{
                                        width: `${editFieldData.currentValue || 0}%`,
                                        backgroundColor: editFieldData.currentValue >= 100 ? '#10B981' : editFieldData.currentValue > 50 ? '#3B82F6' : '#60A5FA'
                                    }}
                                ></div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTaskField(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(Number(editFieldData.currentValue))}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa người được giao */}
            {editingTaskField === 'assignee' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Thành viên</h2>
                            <button
                                onClick={() => setEditingTaskField(null)}
                                className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                value={memberSearchQuery}
                                onChange={(e) => setMemberSearchQuery(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Tìm kiếm các thành viên"
                            />
                        </div>

                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Thành viên của thẻ</h3>
                            {(editFieldData.taskId && columns[editFieldData.milestoneId]?.tasks.find(t => t.id === editFieldData.taskId)?.assignees?.length > 0) ? (
                                <div className="space-y-2">
                                    {columns[editFieldData.milestoneId]?.tasks.find(t => t.id === editFieldData.taskId)?.assignees?.map((assigneeId, idx) => {
                                        const member = teamMembers.find(m => m.id === assigneeId) ||
                                            { id: assigneeId, name: assigneeId, color: 'bg-gray-500' };
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                                                <div className="flex items-center">
                                                    <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white font-medium mr-2`}>
                                                        {member.id}
                                                    </div>
                                                    <span>{member.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMember(editFieldData.taskId, editFieldData.milestoneId, member.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-3 text-gray-500">Chưa có thành viên nào</div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Thành viên của bảng</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {teamMembers
                                    .filter(member => {
                                        // Lọc theo search query và loại bỏ thành viên đã được gán
                                        const taskAssignees = columns[editFieldData.milestoneId]?.tasks.find(t => t.id === editFieldData.taskId)?.assignees || [];
                                        return !taskAssignees.includes(member.id) &&
                                            member.name.toLowerCase().includes(memberSearchQuery.toLowerCase());
                                    })
                                    .map((member, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                                            onClick={() => handleAddMember(editFieldData.taskId, editFieldData.milestoneId, member.id)}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white font-medium mr-2`}>
                                                {member.id}
                                            </div>
                                            <span>{member.name}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa độ ưu tiên */}
            {editingTaskField === 'priority' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Đổi độ ưu tiên</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 font-medium">Độ ưu tiên:</label>
                            <select
                                value={editFieldData.currentValue}
                                onChange={(e) => setEditFieldData({ ...editFieldData, currentValue: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                            >
                                <option value="high">Cao</option>
                                <option value="medium">Trung bình</option>
                                <option value="low">Thấp</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTaskField(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(editFieldData.currentValue)}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa trạng thái */}
            {editingTaskField === 'status' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Đổi trạng thái</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 font-medium">Trạng thái:</label>
                            <select
                                value={editFieldData.currentValue}
                                onChange={(e) => setEditFieldData({ ...editFieldData, currentValue: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                            >
                                <option value="todo">To Do</option>
                                <option value="inProgress">Đang làm</option>
                                <option value="done">Hoàn thành</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTaskField(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(editFieldData.currentValue)}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chi tiết task */}
            {showTaskDetailModal && viewingTask && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-7 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all animate-scaleIn">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Chi tiết công việc</h2>
                            <button
                                onClick={() => setShowTaskDetailModal(false)}
                                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors btn-hover-effect"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-gray-800">{viewingTask.title}</h3>
                                <div className="flex space-x-2">
                                    {/* <button
                                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                        onClick={() => {
                                            setShowTaskDetailModal(false);
                                            handleEditTask(viewingTask.milestoneId, viewingTask);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button> */}
                                    <button
                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                        onClick={() => {
                                            setShowTaskDetailModal(false);
                                            handleDeleteTask(viewingTask.milestoneId, viewingTask.id);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center space-x-2">
                                {/* Hiển thị trạng thái task */}
                                {viewingTask.status === 'todo' && (
                                    <span className="px-3 py-1 text-sm rounded-full font-medium bg-gray-100 text-gray-700 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-gray-500 mr-1.5"></span>
                                        Cần làm
                                    </span>
                                )}
                                {viewingTask.status === 'inProgress' && (
                                    <span className="px-3 py-1 text-sm rounded-full font-medium bg-blue-50 text-blue-700 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                                        Đang làm
                                    </span>
                                )}
                                {viewingTask.status === 'done' && (
                                    <span className="px-3 py-1 text-sm rounded-full font-medium bg-green-50 text-green-700 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                                        Hoàn thành
                                    </span>
                                )}

                                {/* Hiển thị độ ưu tiên */}
                                {viewingTask.priority === 'high' && (
                                    <span className="px-3 py-1 text-sm rounded-full font-medium bg-red-50 text-red-700 flex items-center">
                                        Ưu tiên cao
                                    </span>
                                )}
                                {viewingTask.priority === 'medium' && (
                                    <span className="px-3 py-1 text-sm rounded-full font-medium bg-yellow-50 text-yellow-700 flex items-center">
                                        Ưu tiên trung bình
                                    </span>
                                )}
                                {viewingTask.priority === 'low' && (
                                    <span className="px-3 py-1 text-sm rounded-full font-medium bg-green-50 text-green-700 flex items-center">
                                        Ưu tiên thấp
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Mô tả</h4>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">{viewingTask.description || "Không có mô tả"}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-medium text-gray-500">Người được giao</h4>
                                    <button
                                        onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center btn-hover-effect"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="mr-1" size="xs" />
                                        Thêm
                                    </button>
                                </div>

                                {/* Dropdown thêm thành viên */}
                                {showMemberDropdown && (
                                    <div className="bg-white shadow-md rounded-lg mt-1 p-2 absolute z-10 w-64 border border-gray-200 animate-fadeIn">
                                        <div className="max-h-48 overflow-y-auto">
                                            {teamMembers.filter(member =>
                                                !(viewingTask.assignees || []).includes(member.id)
                                            ).map((member, index) => (
                                                <div
                                                    key={index}
                                                    className="px-3 py-2 hover:bg-blue-50 rounded-md cursor-pointer flex items-center justify-between"
                                                    onClick={() => handleAddMember(viewingTask.id, viewingTask.milestoneId, member.id)}
                                                >
                                                    <span>{member.name}</span>
                                                    <FontAwesomeIcon icon={faPlus} className="text-blue-500" size="xs" />
                                                </div>
                                            ))}
                                        </div>
                                        {teamMembers.filter(member =>
                                            !(viewingTask.assignees || []).includes(member.id)
                                        ).length === 0 && (
                                                <div className="px-3 py-2 text-gray-500 text-sm text-center">
                                                    Đã thêm tất cả thành viên
                                                </div>
                                            )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(viewingTask.assignees && viewingTask.assignees.length > 0) ? (
                                        viewingTask.assignees.map((memberId, index) => {
                                            const member = teamMembers.find(m => m.id === memberId);
                                            return (
                                                <div
                                                    key={index}
                                                    className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm flex items-center group relative"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-1">
                                                        {member?.id || memberId.charAt(0)}
                                                    </div>
                                                    <span className="mr-1">{member?.name || memberId}</span>
                                                    <button
                                                        onClick={() => handleRemoveMember(viewingTask.id, viewingTask.milestoneId, memberId)}
                                                        className="text-blue-400 hover:text-red-500 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <FontAwesomeIcon icon={faTrashAlt} size="xs" />
                                                    </button>
                                                    {/* Tooltip hiển thị khi hover */}
                                                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block">
                                                        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                                            Gỡ bỏ
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-gray-500 text-sm italic">Chưa có người được giao</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Hạn hoàn thành</h4>
                                <div className="flex items-center text-gray-800">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-500" />
                                    {viewingTask.dueDate || "Chưa đặt hạn"}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Tiến độ</h4>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-gray-700">Hoàn thành</span>
                                <span className="text-sm font-medium text-blue-600">{viewingTask.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-3 rounded-full transition-all duration-300 ease-out progress-bar-animate"
                                    style={{
                                        width: `${viewingTask.progress || 0}%`,
                                        backgroundColor: viewingTask.progress >= 100 ? '#10B981' : viewingTask.progress > 50 ? '#3B82F6' : '#60A5FA'
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-5 flex justify-between">
                            <button
                                onClick={() => {
                                    setShowTaskDetailModal(false);
                                    handleEditTaskField(viewingTask.milestoneId, viewingTask.id, 'status');
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors font-medium btn-hover-effect"
                            >
                                <FontAwesomeIcon icon={faCheck} />
                                Đánh dấu hoàn thành
                            </button>

                            <button
                                onClick={() => {
                                    setShowMemberDropdown(!showMemberDropdown);
                                    setShowComments(false); // Đóng phần bình luận nếu đang mở
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium btn-hover-effect"
                            >
                                <FontAwesomeIcon icon={faUserFriends} />
                                Thành viên
                            </button>

                            <button
                                onClick={() => {
                                    setShowComments(!showComments);
                                    setShowMemberDropdown(false); // Đóng dropdown thành viên nếu đang mở
                                    // Focus vào ô input khi mở phần bình luận
                                    if (!showComments) {
                                        setTimeout(() => {
                                            if (commentInputRef.current) {
                                                commentInputRef.current.focus();
                                            }
                                        }, 100);
                                    }
                                }}
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${showComments ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'} text-white transition-colors font-medium btn-hover-effect`}
                            >
                                <FontAwesomeIcon icon={faComment} />
                                Bình luận {(viewingTask.comments?.length > 0) && `(${viewingTask.comments.length})`}
                            </button>
                        </div>

                        {/* Phần bình luận */}
                        {showComments && (
                            <div className="mt-6 border-t border-gray-200 pt-4 animate-fadeIn">
                                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                                    <FontAwesomeIcon icon={faComment} className="mr-2 text-indigo-500" /> Bình luận
                                </h3>

                                {/* Danh sách bình luận */}
                                <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto">
                                    {viewingTask.comments && viewingTask.comments.length > 0 ? (
                                        viewingTask.comments.map((comment) => (
                                            <div key={comment.id} className="flex space-x-3 group">
                                                <div className={`w-8 h-8 rounded-full ${comment.userColor || 'bg-gray-500'} flex items-center justify-center text-white font-medium`}>
                                                    {comment.userId.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-gray-50 p-3 rounded-lg shadow-sm relative">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-medium text-gray-900">{comment.userName}</span>
                                                            <span className="text-xs text-gray-500">{formatCommentTime(comment.timestamp)}</span>
                                                        </div>
                                                        <p className="text-gray-700">{comment.text}</p>

                                                        {/* Nút xóa chỉ hiển thị cho bình luận của người dùng hiện tại */}
                                                        {comment.userId === currentUser.id && (
                                                            <button
                                                                onClick={() => handleDeleteComment(viewingTask.id, viewingTask.milestoneId, comment.id)}
                                                                className="absolute right-2 top-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <FontAwesomeIcon icon={faTrashAlt} size="xs" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-gray-500">
                                            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                                        </div>
                                    )}
                                </div>

                                {/* Form nhập bình luận */}
                                <div className="flex items-center mt-4">
                                    <div className={`w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-medium mr-3`}>
                                        {currentUser.id.charAt(0)}
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            ref={commentInputRef}
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Thêm bình luận..."
                                            className="w-full border border-gray-300 rounded-full px-4 py-2 pr-10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddComment(viewingTask.id, viewingTask.milestoneId, commentText);
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => handleAddComment(viewingTask.id, viewingTask.milestoneId, commentText)}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-500 hover:text-indigo-700 p-1.5"
                                            disabled={!commentText.trim()}
                                        >
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chế độ xem Kanban */}
            {viewMode === 'kanban' && (
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
                                onEditTaskField={handleEditTaskField}
                                onTaskClick={handleTaskClick}
                                teamMembers={teamMembers}
                            />
                        ))}
                    </div>

                    {/* Hiển thị overlay khi kéo task */}
                    <DragOverlay dropAnimation={null} modifiers={[restrictToWindowEdges]}>
                        {activeTask ? (
                            <TaskOverlay
                                task={activeTask}
                                teamMembers={teamMembers}
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Chế độ xem danh sách */}
            {viewMode === 'list' && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tiêu đề
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ưu tiên
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mô tả
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hạn hoàn thành
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tiến độ
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ghi chú
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người tạo
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người được giao
                                    </th>
                                    {/* <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th> */}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getAllTasks().map((task) => (
                                    <tr
                                        key={task.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => handleTaskClick(task.milestoneId, task)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{task.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(task.priority)}`}>
                                                {getPriorityName(task.priority)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 max-w-[200px] truncate">{task.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{task.dueDate}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="h-2.5 rounded-full transition-all duration-300 ease-out"
                                                    style={{
                                                        width: `${task.progress || 0}%`,
                                                        backgroundColor: task.progress >= 100 ? '#10B981' : task.progress > 50 ? '#3B82F6' : '#60A5FA'
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1 text-center">{task.progress || 0}%</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                                                {getStatusName(task.status)}
                                            </span>
                                            <div className="text-xs text-gray-500 mt-1">{task.columnStatus}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">{task.note || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{task.createdBy || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                {task.assignees && task.assignees.length > 0 ? (
                                                    task.assignees.slice(0, 2).map((assigneeId, idx) => {
                                                        const member = teamMembers.find(m => m.id === assigneeId);
                                                        return (
                                                            <div key={idx} className={`w-6 h-6 rounded-full ${member?.color || 'bg-gray-500'} flex items-center justify-center text-white text-xs`}>
                                                                {member?.id.charAt(0) || assigneeId.charAt(0)}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-sm text-gray-500">Chưa giao</span>
                                                )}
                                                {task.assignees && task.assignees.length > 2 && (
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                                                        +{task.assignees.length - 2}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        {/* Thao tác */}
                                        {/* <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditTaskField(task.milestoneId, task.id, 'title');
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTask(task.milestoneId, task.id);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </button>
                                            </div>
                                        </td> */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Milestone; 