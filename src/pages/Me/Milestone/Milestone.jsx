import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPenToSquare, faAngleDown, faClipboardList, faExclamationCircle, faEllipsisV, faPencilAlt, faTrashAlt, faClock, faArrowLeft, faEdit, faCalendarAlt, faUserFriends, faTag, faArrowRight, faCopy, faLink, faArchive, faCheck, faComment, faPaperPlane, faColumns, faList, faSearch, faAngleDoubleLeft, faAngleLeft, faAngleRight, faAngleDoubleRight, faHistory, faChartBar, faChartLine, faChartPie, faPercentage, faLayerGroup, faUsers, faTasks, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
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
import { formatVietnameseDate, getRelativeTime } from '@/utils/dateUtils';
import { getUserInfoFromToken } from '@/apis/authService';
import { getAccountInfo } from '@/apis/accountService';
import { getDashboardData, getMembersInMilestone } from '@/apis/taskService';
import { useAuth } from '@/contexts/AuthContext';

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

    // // Hiển thị trạng thái task
    // const getStatusBadge = (status) => {
    //     switch (status) {
    //         case 'todo':
    //             return (
    //                 <span className="px-3 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700 flex items-center w-fit">
    //                     <span className="w-2 h-2 rounded-full bg-gray-500 mr-1.5"></span>
    //                     To Do
    //                 </span>
    //             );
    //         case 'inProgress':
    //             return (
    //                 <span className="px-3 py-1 text-xs rounded-full font-medium bg-blue-50 text-blue-700 flex items-center w-fit">
    //                     <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
    //                     Đang làm
    //                 </span>
    //             );
    //         case 'done':
    //             return (
    //                 <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-50 text-green-700 flex items-center w-fit">
    //                     <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
    //                     Hoàn thành
    //                 </span>
    //             );
    //         default:
    //             return null;
    //     }
    // };

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


        // Kiểm tra trường "assignto" (viết thường)
        if (task.assignto && task.assignto.length > 0) {
            // Nếu chỉ có 1 thành viên
            if (task.assignto.length === 1) {
                const assignee = task.assignto[0];

                // Kiểm tra nếu là đối tượng có trường fullname và avatarURL
                if (typeof assignee === 'object' && assignee !== null) {
                    return {
                        type: 'singleMember',
                        memberId: assignee.id || 'unknown',
                        memberName: assignee.fullname || 'Thành viên',
                        avatar: assignee.avatarURL || assignee.avatar || null,
                        color: 'bg-blue-500'
                    };
                } else {
                    // Nếu là URL avatar (chuỗi)
                    return {
                        type: 'singleAvatar',
                        avatarUrl: assignee
                    };
                }
            }

            // Nếu có nhiều thành viên, hiển thị số lượng
            const firstAssignee = task.assignto[0];

            // Kiểm tra nếu là đối tượng có trường fullname và avatarURL
            if (typeof firstAssignee === 'object' && firstAssignee !== null) {
                return {
                    type: 'multipleMembers',
                    memberId: firstAssignee.id || 'unknown',
                    memberName: firstAssignee.fullname || 'Thành viên',
                    avatar: firstAssignee.avatarURL || null,
                    count: task.assignto.length - 1,
                    color: 'bg-blue-500'
                };
            } else {
                // Nếu là URL avatar (chuỗi)
                return {
                    type: 'multipleAvatars',
                    avatarUrl: firstAssignee,
                    count: task.assignto.length - 1
                };
            }
        }
        // Nếu không có cả hai
        return {
            type: 'notAssigned',
            content: 'Unassigned'
        };

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
                    avatar: member?.avatarURL || null,
                    color: member?.color || 'bg-blue-500'
                };
            }

            // Nếu có nhiều thành viên, hiển thị số lượng
            const firstMember = teamMembers.find(m => m.id === task.assignees[0]);

            return {
                type: 'multipleMembers',
                memberId: firstMember?.id || task.assignees[0],
                memberName: firstMember?.name || 'Thành viên',
                avatar: firstMember?.avatarURL || null,
                count: task.assignees.length - 1,
                color: firstMember?.color || 'bg-blue-500'
            };
        }


    };

    // Render assignees dựa trên đối tượng từ hook
    const renderAssigneesComponent = (task, teamMembers) => {
        const assigneeData = renderAssignees(task, teamMembers);
        // console.log('test:', assigneeData);

        // // Kiểm tra trực tiếp nếu có assignto và đó là object
        // if (task.assignto && task.assignto.length > 0 && typeof task.assignto[0] === 'object') {
        //     const firstAssignee = task.assignto[0];
        //     if (firstAssignee.avatarURL) {
        //         // console.log("Trực tiếp có avatarURL:", firstAssignee.avatarURL);
        //         return (
        //             <div className="flex items-center">
        //                 <img
        //                     src={firstAssignee.avatarURL}
        //                     alt={firstAssignee.fullname || "Người dùng"}
        //                     className="w-6 h-6 rounded-full object-cover mr-1"
        //                     onError={(e) => {
        //                         e.target.onerror = null;
        //                         e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(firstAssignee.fullname || "User") + "&background=random";
        //                     }}
        //                 />
        //                 <span className="ml-1 text-xs text-gray-600 truncate max-w-[60px]">{firstAssignee.fullname}</span>
        //             </div>
        //         );
        //     }
        // }
        if (assigneeData.type === 'notAssigned') {
            return (
                <span className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full font-medium">
                    {assigneeData.content}
                </span>
            );
        } else if (assigneeData.type === 'singleMember') {
            return (
                <div className="flex items-center">
                    {assigneeData.avatar ? (
                        <img
                            src={assigneeData.avatar}
                            alt={assigneeData.memberName}
                            className="w-6 h-6 rounded-full object-cover mr-1"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(assigneeData.memberName) + "&background=random";
                            }}
                        />
                    ) : (
                        <div className={`w-6 h-6 rounded-full ${assigneeData.color} flex items-center justify-center text-white font-medium`}>
                            {assigneeData.memberName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="ml-1 text-xs text-gray-600 truncate max-w-[60px]">{assigneeData.memberName}</span>
                </div>
            );
        } else if (assigneeData.type === 'multipleMembers') {
            return (
                <div className="flex items-center">
                    {assigneeData.avatar ? (
                        <img
                            src={assigneeData.avatar}
                            alt={assigneeData.memberName}
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(assigneeData.memberName) + "&background=random";
                            }}
                        />
                    ) : (
                        <div className={`w-6 h-6 rounded-full ${assigneeData.color} flex items-center justify-center text-white font-medium`}>
                            {assigneeData.memberName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="ml-1 text-xs text-gray-600">+{assigneeData.count}</span>
                </div>
            );
        } else if (assigneeData.type === 'singleAvatar') {
            return (
                <div className="flex items-center">
                    <img
                        src={assigneeData.avatarUrl}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://ui-avatars.com/api/?name=User&background=random";
                        }}
                    />
                </div>
            );
        } else if (assigneeData.type === 'multipleAvatars') {
            return (
                <div className="flex items-center">
                    <img
                        src={assigneeData.avatarUrl}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://ui-avatars.com/api/?name=User&background=random";
                        }}
                    />
                    <span className="ml-1 text-xs text-gray-600 truncate max-w-[60px]">{assigneeData.count}</span>
                </div>
            );
        }

        return null;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 relative task-card-hover"
            {...attributes}
            {...listeners}
            onClick={handleTaskClick}
        >
            {/* Màu bìa cho task nếu có */}
            {task.labelcolorID && (
                <div
                    style={{
                        backgroundColor: labelColors.find(l => l.labelID === task.labelcolorID)?.color || '#ccc',
                        height: '0.75rem'
                    }}
                    className={`w-full absolute top-0 left-0 right-0 rounded-t-lg`}
                ></div>
            )}
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
                                <FontAwesomeIcon icon={faEdit} className="mr-3 text-gray-500" /> Edit Task
                            </button>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('note', e)}
                            >
                                <FontAwesomeIcon icon={faClipboardList} className="mr-3 text-gray-500" /> Edit Note
                            </button>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('assignee', e)}
                            >
                                <FontAwesomeIcon icon={faUserFriends} className="mr-3 text-gray-500" /> Change Assignee
                            </button>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('dueDate', e)}
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} className="mr-3 text-gray-500" /> Edit Date
                            </button>
                            {/* <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('progress', e)}
                            >
                                <FontAwesomeIcon icon={faArrowRight} className="mr-3 text-gray-500" /> Cập nhật tiến độ
                            </button> */}
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('priority', e)}
                            >
                                <FontAwesomeIcon icon={faCopy} className="mr-3 text-gray-500" /> Change Priority
                            </button>
                            {/* 
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('coverColor', e)}
                            >
                                <FontAwesomeIcon icon={faTag} className="mr-3 text-gray-500" /> Change Cover Color
                            </button> */}

                            {/* <button
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                onClick={(e) => handleEditFieldClick('status', e)}
                            >
                                <FontAwesomeIcon icon={faCopy} className="mr-3 text-gray-500" /> Đổi trạng thái
                            </button> */}
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                onClick={handleDeleteClick}
                            >
                                <FontAwesomeIcon icon={faTrashAlt} className="mr-3" /> Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <h4 className="font-semibold mt-2 text-gray-800">{task.title}</h4>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{task.description}</p>
            {/* <div className="mt-3">
                {getStatusBadge(task.status)}
            </div> */}

            {/* Thanh tiến độ */}
            {/* <div className="mt-4">
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
            </div> */}

            <div className="mt-3 flex justify-between items-center text-xs">
                <div>
                    {renderAssigneesComponent(task, teamMembers)}
                </div>
                <div className="flex items-center text-gray-500">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                    <span className="truncate max-w-[100px]">{task.dueDate ? formatVietnameseDate(task.dueDate) : "No due date"}</span>
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
            className="bg-gray-50 rounded-xl shadow-md w-[300px] min-w-[300px] max-w-[300px] flex-shrink-0 border border-gray-200 flex flex-col max-h-full"
        >
            {/* Tiêu đề milestone */}
            <div className="bg-white p-3 rounded-t-xl border-b flex justify-between items-center">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-800 truncate">{milestone.title}</h3>
                    <p className="text-gray-500 text-sm truncate">{milestone.description}</p>
                </div>
                <div className="dropdown relative ml-2 flex-shrink-0">
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
            <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1">
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
                    <FontAwesomeIcon icon={faPlus} className="mr-2 group-hover:scale-110 transition-transform" /> Add Task
                </button>
            </div>
        </div>
    );
};

// Task component dành riêng cho DragOverlay
const TaskOverlay = ({ task, teamMembers, renderOverlayAssignees }) => {
    // Hiển thị màu ưu tiên
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-400';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-400';
        }
    };

    // // Hiển thị trạng thái task
    // const getStatusBadge = (status) => {
    //     switch (status) {
    //         case 'todo':
    //             return (
    //                 <span className="px-3 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700 flex items-center w-fit">
    //                     <span className="w-2 h-2 rounded-full bg-gray-500 mr-1.5"></span>
    //                     To Do
    //                 </span>
    //             );
    //         case 'inProgress':
    //             return (
    //                 <span className="px-3 py-1 text-xs rounded-full font-medium bg-blue-50 text-blue-700 flex items-center w-fit">
    //                     <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
    //                     Đang làm
    //                 </span>
    //             );
    //         case 'done':
    //             return (
    //                 <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-50 text-green-700 flex items-center w-fit">
    //                     <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
    //                     Hoàn thành
    //                 </span>
    //             );
    //         default:
    //             return null;
    //     }
    // };

    // Render overlay assignees dựa trên đối tượng từ hook
    const renderOverlayAssigneesComponent = () => {
        const assigneeData = renderOverlayAssignees(task, teamMembers);

        if (assigneeData.type === 'notAssigned') {
            return (
                <span className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full font-medium">
                    {assigneeData.content}
                </span>
            );
        } else if (assigneeData.type === 'singleMember') {
            return (
                <div className="flex items-center">
                    {assigneeData.avatar ? (
                        <img
                            src={assigneeData.avatar}
                            alt={assigneeData.memberName}
                            className="w-6 h-6 rounded-full object-cover mr-1"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(assigneeData.memberName) + "&background=random";
                            }}
                        />
                    ) : (
                        <div className={`w-6 h-6 rounded-full ${assigneeData.color} flex items-center justify-center text-white font-medium mr-1`}>
                            {assigneeData.memberName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="text-sm">{assigneeData.memberName}</span>
                </div>
            );
        } else if (assigneeData.type === 'multipleMembers') {
            return (
                <div className="flex items-center">
                    {assigneeData.avatar ? (
                        <img
                            src={assigneeData.avatar}
                            alt={assigneeData.memberName}
                            className="w-6 h-6 rounded-full object-cover mr-1"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(assigneeData.memberName) + "&background=random";
                            }}
                        />
                    ) : (
                        <div className={`w-6 h-6 rounded-full ${assigneeData.color} flex items-center justify-center text-white font-medium mr-1`}>
                            {assigneeData.memberName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="text-sm">+{assigneeData.count}</span>
                </div>
            );
        } else if (assigneeData.type === 'singleAvatar') {
            return (
                <div className="flex items-center">
                    <img
                        src={assigneeData.avatarUrl}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover mr-1"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://ui-avatars.com/api/?name=User&background=random";
                        }}
                    />
                </div>
            );
        } else if (assigneeData.type === 'multipleAvatars') {
            return (
                <div className="flex items-center">
                    <img
                        src={assigneeData.avatarUrl}
                        alt="a"
                        className="w-6 h-6 rounded-full object-cover mr-1"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://ui-avatars.com/api/?name=User&background=random";
                        }}
                    />
                    <span className="ml-1 text-xs text-gray-600 truncate max-w-[60px]">{assigneeData.count}</span>
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
            {/* <div className="mt-3">
                {getStatusBadge(task.status)}
            </div> */}

            {/* Thanh tiến độ */}
            {/* <div className="mt-4">
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
            </div> */}

            <div className="mt-4 flex justify-between items-center text-xs">
                <div>
                    {renderOverlayAssigneesComponent()}
                </div>
                <div className="flex items-center text-gray-500">
                    <FontAwesomeIcon icon={faClock} className="mr-1.5" />
                    <span>{task.dueDate ? formatVietnameseDate(task.dueDate) : "Chưa đặt hạn"}</span>
                </div>
            </div>
        </div>
    );
};

const UserAvatar = ({ userId }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!userId) return;

            try {
                setLoading(true);
                const info = await getAccountInfo(userId);
                setUserInfo(info);
            } catch (error) {
                console.error('Lỗi khi lấy thông tin người dùng:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, [userId]);

    if (loading) {
        return (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center animate-pulse mr-3">
            </div>
        );
    }

    if (userInfo?.avatarUrl) {
        return (
            <img
                src={userInfo.avatarUrl}
                alt={userInfo.fullname || 'Avatar'}
                className="w-8 h-8 rounded-full object-cover mr-3"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.fullname || 'User')}&background=random`;
                }}
            />
        );
    } else {
        // Lấy chữ cái đầu tiên để hiển thị
        const displayChar = userInfo?.fullname?.charAt(0) ||
            userInfo?.email?.charAt(0) ||
            userId?.charAt(0) || '?';

        return (
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-medium mr-3">
                {displayChar.toUpperCase()}
            </div>
        );
    }
};

// Thêm component ActivityLogItem
const ActivityLogItem = ({ activity }) => {
    // Xử lý định dạng thời gian
    const formatTime = (dateString) => {
        const date = new Date(dateString);

        // Format ngày
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        // Format giờ
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    // Xác định màu cho từng loại action
    const getActionTypeColor = (actionType) => {
        switch (actionType.toLowerCase()) {
            case 'change status task':
                return 'bg-blue-100 text-blue-700';
            case 'assign task':
                return 'bg-green-100 text-green-700';
            case 'create task':
                return 'bg-purple-100 text-purple-700';
            case 'update task':
                return 'bg-orange-100 text-orange-700';
            case 'comment task':
                return 'bg-yellow-100 text-yellow-700';
            case 'delete task':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // Xác định icon cho từng loại action
    const getActionTypeIcon = (actionType) => {
        switch (actionType.toLowerCase()) {
            case 'change status task':
                return faArrowRight;
            case 'assign task':
                return faUserFriends;
            case 'create task':
                return faPlus;
            case 'update task':
                return faEdit;
            case 'comment task':
                return faComment;
            case 'delete task':
                return faTrashAlt;
            default:
                return faHistory;
        }
    };

    return (
        <div className="flex items-start p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <img
                src={activity.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activity.fullName || "User") + "&background=random"}
                alt={activity.fullName || "Người dùng"}
                className="w-10 h-10 rounded-full object-cover mr-4"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(activity.fullName || "User") + "&background=random";
                }}
            />
            <div className="flex-1">
                <div className="flex items-center mb-1">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getActionTypeColor(activity.actionType)}`}>
                        <FontAwesomeIcon icon={getActionTypeIcon(activity.actionType)} className="mr-1.5" />
                        {activity.actionType}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">{formatTime(activity.atTime)}</span>
                </div>
                <p className="text-sm text-gray-700">{activity.content}</p>
                <div className="mt-1 text-xs text-gray-500">
                    Task ID: {activity.taskId}
                </div>
            </div>
        </div>
    );
};

// Thêm component ActivityLogsList
const ActivityLogsList = ({ activities, loading }) => {
    return (
        <div className="bg-white rounded-lg shadow-md max-h-[70vh] overflow-y-auto">

            {loading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                    <span className="text-gray-500">Đang tải nhật ký...</span>
                </div>
            ) : activities.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {activities.map((activity) => (
                        <ActivityLogItem key={activity.activityId} activity={activity} />
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center text-gray-500">
                    <FontAwesomeIcon icon={faHistory} className="text-3xl mb-2 text-gray-300" />
                    <p>Chưa có hoạt động nào được ghi nhận</p>
                </div>
            )}
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
        taskMembers,
        currentUser,
        commentText,
        showComments,
        loading,
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
        renderAssignees,
        renderOverlayAssignees,
        fetchTaskBoard,
        setEditingTask,
        setEditingTaskField,
        filterParams,
        tasksList,
        pagination,
        tasksListLoading,
        loadTasksListView,
        teamMembersLoading,
        handleFilterByColumn,
        handleSearch,
        handleLocalSearch,
        handleLocalFilterByColumn,
        handleLocalPageSizeChange,
        handleLocalPageChange,
        setEditFieldData,
        setViewingTask,
        setTaskMembers,
        labelColors,
        labelsLoading,
        activityLogs,
        activityLogsLoading,
        fetchActivityLogs,
        setShowActivityLogs,
        showActivityLogs,
        // Dashboard related imports
        dashboardData,
        dashboardLoading,
        fetchDashboardData,
        getStatusColorClass,
        formatPercentage
    } = useMilestone();

    // Thêm state để quản lý chế độ xem (kanban, list hoặc dashboard)
    const [viewMode, setViewMode] = useState('kanban');

    const { boardId } = useParams();
    const navigate = useNavigate();

    // Lấy user từ AuthContext
    const { user } = useAuth();
    const [membershipChecked, setMembershipChecked] = useState(false);

    // Chặn truy cập trực tiếp nếu user không phải member của milestone
    useEffect(() => {
        const verifyMembership = async () => {
            try {
                const userId = user?.id;
                if (!userId || !boardId) return;
                const members = await getMembersInMilestone(boardId);
                const isMember = Array.isArray(members) && members.some(m => String(m.accountId) === String(userId));
                if (!isMember) {
                    toast.warning('Bạn không có quyền truy cập milestone này', { toastId: 'milestone-no-access' });
                    navigate('/me/milestones', { replace: true });
                    return;
                }
                setMembershipChecked(true);
            } catch (err) {
                console.error('Lỗi kiểm tra quyền truy cập milestone:', err);
                toast.error('Không thể xác thực quyền truy cập milestone');
                navigate('/me/milestone-boards');
            }
        };
        verifyMembership();
    }, [boardId, user]);

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
            case 'high': return 'High';
            case 'medium': return 'Medium';
            case 'low': return 'Low';
            default: return 'Undefined';
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

    // Thêm useEffect để tải dữ liệu danh sách khi chuyển chế độ xem
    useEffect(() => {
        if (viewMode === 'list' && boardId) {
            loadTasksListView();
        } else if (viewMode === 'dashboard' && boardId) {
            fetchDashboardData();
        }
    }, [viewMode, boardId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                    <p className="text-gray-500">Loading board data...</p>
                </div>
            </div>
        );
    }

    if (!boardData) {
        return (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <div className="mb-4">
                    <FontAwesomeIcon icon={faExclamationCircle} className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">Could not load board data</h3>
                <p className="mb-4">Unable to load milestone data. Please try again later.</p>
                <button
                    onClick={handleBackToBoards}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to board list
                </button>
            </div>
        );
    }

    const hasColumns = Object.keys(columns).length > 0;

    return (
        <div className="p-4">
            {/* Tiêu đề và nút thêm milestone */}
            <header className="bg-white shadow-md px-6 py-5 flex justify-between items-center mb-8 rounded-xl sticky top-0 z-20">
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
                <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Button để hiển thị nhật ký hoạt động */}
                    <button
                        onClick={() => setShowActivityLogs(true)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faHistory} /> Activity Log
                    </button>

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
                            <FontAwesomeIcon icon={faList} className="mr-2" /> List
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'dashboard' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                            onClick={() => setViewMode('dashboard')}
                        >
                            <FontAwesomeIcon icon={faChartBar} className="mr-2" /> Dashboard
                        </button>
                    </div>
                    <button
                        onClick={() => setShowNewMilestoneForm(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow flex items-center gap-2 transition-all font-medium whitespace-nowrap"
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-sm" /> Add Collums
                    </button>
                </div>
            </header>

            {/* Form add new milestone (popup) */}
            {showNewMilestoneForm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-7 rounded-xl  shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Add New Collums</h2>
                        <div className="mb-5">
                            <label className="block text-gray-700 mb-2 font-medium">Collums Name:</label>
                            <input
                                type="text"
                                value={newMilestoneTitle}
                                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Example: Sprint 1 - UI Design"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2 font-medium">Description:</label>
                            <textarea
                                value={newMilestoneDescription}
                                onChange={(e) => setNewMilestoneDescription(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Detailed milestone description"
                                rows="4"
                            ></textarea>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setShowNewMilestoneForm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={handleAddMilestone}
                            >
                                Save
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
                            {editingTask.isNew ? 'Add New Task' : 'Edit Task'}
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Title:</label>
                                    <input
                                        type="text"
                                        value={taskFormData.title}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Enter task title"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Description:</label>
                                    <textarea
                                        value={taskFormData.description}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Detailed task description"
                                        rows="5"
                                    ></textarea>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Priority:</label>
                                    <select
                                        value={taskFormData.priority}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>

                            </div>

                            <div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Notes:</label>
                                    <textarea
                                        value={taskFormData.note}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, note: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Additional notes for the task"
                                        rows="3"
                                    ></textarea>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Assignee:</label>
                                    <div className="relative">
                                        <select
                                            value={taskFormData.assignee || ''}
                                            onChange={(e) => setTaskFormData({ ...taskFormData, assignee: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white appearance-none"
                                        >
                                            <option value="">Select assignee</option>
                                            {teamMembers.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <FontAwesomeIcon icon={faAngleDown} />
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Due Date:</label>
                                    <input
                                        type="date"
                                        value={taskFormData.dueDate}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>
                                {/* <div className="mb-4">
                                    <label className="block text-gray-700 mb-2 font-medium">Màu bìa:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {labelColors.map((colorOption) => (
                                            <div
                                                key={colorOption.labelID}
                                                className={`w-8 h-8 rounded-lg cursor-pointer hover:opacity-90 border-2 ${taskFormData.labelcolorID === colorOption.labelID ? 'border-black' : 'border-transparent'}`}
                                                title={colorOption.labelName}
                                                onClick={() => setTaskFormData({ ...taskFormData, labelcolorID: colorOption.labelID })}
                                                style={{ backgroundColor: colorOption.color }}
                                            ></div>
                                        ))}
                                        <div
                                            className="w-8 h-8 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                                            title="Xóa màu bìa"
                                            onClick={() => setTaskFormData({ ...taskFormData, labelcolorID: null })}
                                        >
                                            <span className="text-gray-500">✕</span>
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4">
                            <button
                                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTask(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={handleSaveTask}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa tiêu đề và mô tả */}
            {editingTaskField === 'title' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Task</h2>
                        <div className="mb-3">
                            <label className="block text-gray-700 mb-1 font-medium">Title:</label>
                            <input
                                type="text"
                                value={editFieldData.currentValue}
                                onChange={(e) => setEditFieldData({ ...editFieldData, currentValue: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Enter task title"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 font-medium">Description:</label>
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
                                placeholder="Detailed task description"
                                rows="3"
                            ></textarea>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTaskField(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(editFieldData.currentValue)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa ngày */}
            {editingTaskField === 'dueDate' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Edit due date</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 font-medium">Due date:</label>
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
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(editFieldData.currentValue)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa tiến độ */}
            {editingTaskField === 'progress' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Update progress</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 font-medium">Progress (%):</label>
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
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(Number(editFieldData.currentValue))}
                            >
                                Save
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
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Card Members</h3>
                            {(editFieldData.taskId && taskMembers.length > 0) ? (
                                <div className="space-y-2">
                                    {taskMembers.map((member, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                                            <div className="flex items-center">
                                                {member.avatar ? (
                                                    <img
                                                        src={member.avatar}
                                                        alt={member.name}
                                                        className="w-8 h-8 rounded-full object-cover mr-2"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.name) + "&background=random";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white font-medium mr-2`}>
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span>{member.name}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    handleRemoveMember(editFieldData.taskId, editFieldData.milestoneId, member.id);
                                                    // Cập nhật UI ngay bằng cách xóa thành viên khỏi taskMembers
                                                    const updatedMembers = taskMembers.filter(m => m.id !== member.id);
                                                    setTaskMembers(updatedMembers);
                                                }}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (viewingTask && viewingTask.asignTo && viewingTask.asignTo.length > 0) ? (
                                <div className="space-y-2">
                                    {viewingTask.asignTo.map((member, idx) => {
                                        const memberId = typeof member === 'object' ? member.id : member;
                                        return (
                                            <div key={`asignto-${idx}-${memberId}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                                                <div className="flex items-center">
                                                    {typeof member === 'object' && member !== null && member.avatarURL ? (
                                                        <img
                                                            src={member.avatarURL}
                                                            alt={member.fullname}
                                                            className="w-8 h-8 rounded-full object-cover mr-2"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.fullname || 'User') + "&background=random";
                                                            }}
                                                        />
                                                    ) : (typeof member === 'string' && member.includes('http')) ? (
                                                        <img
                                                            src={member}
                                                            alt={""}
                                                            className="w-8 h-8 rounded-full object-cover mr-2"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = "https://ui-avatars.com/api/?name=User&background=random";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-2">
                                                            {typeof member === 'object' ?
                                                                (member.fullname?.charAt(0) || 'U') :
                                                                (typeof member === 'string' ? member.charAt(0).toUpperCase() : 'U')}
                                                        </div>
                                                    )}
                                                    <span>
                                                        {typeof member === 'object' ?
                                                            (member.fullname || "Người dùng") :
                                                            (typeof member === 'string' && !member.includes('http') ? member : "Người dùng")}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        handleRemoveMember(viewingTask.id, viewingTask.milestoneId, memberId);
                                                        // Cập nhật UI ngay bằng cách cập nhật viewingTask
                                                        const updatedAsignTo = viewingTask.asignTo.filter((_, i) => i !== idx);
                                                        setViewingTask({ ...viewingTask, asignTo: updatedAsignTo });
                                                    }}
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
                                {teamMembersLoading ? (
                                    <div className="flex justify-center items-center py-4">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                        <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
                                    </div>
                                ) : (
                                    teamMembers
                                        .filter(member => {
                                            // Lọc theo search query và loại bỏ thành viên đã được gán
                                            const alreadyInTask = taskMembers.some(tm => tm.id === member.id);

                                            // Nếu không có trong taskMembers, kiểm tra trong asignTo
                                            const isInAsignTo = viewingTask?.asignTo?.some(assignee =>
                                                (typeof assignee === 'object' && assignee?.id === member.id) ||
                                                assignee === member.id
                                            );

                                            return !alreadyInTask && !isInAsignTo &&
                                                member.name.toLowerCase().includes(memberSearchQuery.toLowerCase());
                                        })
                                        .map((member, idx) => (
                                            <div
                                                key={`team-member-${idx}-${member.id}`}
                                                className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                                                onClick={() => {
                                                    handleAddMember(viewingTask.id, viewingTask.milestoneId, member.id);
                                                    // Cập nhật UI ngay bằng cách thêm thành viên vào taskMembers
                                                    setTaskMembers([...taskMembers, member]);
                                                }}
                                            >
                                                {member.avatar ? (
                                                    <img
                                                        src={member.avatar}
                                                        alt={member.name}
                                                        className="w-8 h-8 rounded-full object-cover mr-2"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.name) + "&background=random";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full ${member.color || 'bg-blue-500'} flex items-center justify-center text-white font-medium mr-2`}>
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span>{member.name}</span>
                                            </div>
                                        ))
                                )}
                                {!teamMembersLoading && teamMembers.filter(member => {
                                    const alreadyInTask = taskMembers.some(tm => tm.id === member.id);
                                    const isInAsignTo = viewingTask?.asignTo?.some(assignee =>
                                        (typeof assignee === 'object' && assignee?.id === member.id) ||
                                        assignee === member.id
                                    );
                                    return !alreadyInTask && !isInAsignTo &&
                                        member.name.toLowerCase().includes(memberSearchQuery.toLowerCase());
                                }).length === 0 && (
                                        <div className="text-center py-3 text-gray-500">
                                            {memberSearchQuery ? 'No matching members found' : 'All members have been added'}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa độ ưu tiên */}
            {editingTaskField === 'priority' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Change Priority</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 font-medium">Độ ưu tiên:</label>
                            <select
                                value={editFieldData.currentValue}
                                onChange={(e) => setEditFieldData({ ...editFieldData, currentValue: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                            >
                                <option value="high">High</option>
                                <option value="medium">Trung bình</option>
                                <option value="low">Thấp</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTaskField(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(editFieldData.currentValue)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa ghi chú */}
            {editingTaskField === 'note' && (
                <div className="fixed inset-0  bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Note</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1 font-medium">Ghi chú:</label>
                            <textarea
                                value={editFieldData.currentValue}
                                onChange={(e) => setEditFieldData({ ...editFieldData, currentValue: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Nhập ghi chú cho công việc này"
                                rows="4"
                            ></textarea>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTaskField(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(editFieldData.currentValue)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chọn màu bìa */}
            {editingTaskField === 'coverColor' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Chọn màu bìa</h2>
                        <div className="mb-4">
                            <div className="grid grid-cols-4 gap-4">
                                {labelColors.map((colorOption) => (
                                    <button
                                        key={colorOption.labelID}
                                        className={`w-full h-12 rounded-lg flex items-center justify-center hover:opacity-90 border-2 ${editFieldData.currentValue === colorOption.labelID ? 'border-black' : 'border-transparent'}`}
                                        title={colorOption.labelName}
                                        onClick={() => setEditFieldData({ ...editFieldData, currentValue: colorOption.labelID })}
                                        style={{ backgroundColor: colorOption.color }}
                                    >
                                        <span className="text-white font-medium text-xs text-center">{colorOption.labelName}</span>
                                    </button>
                                ))}
                                {/* <button
                                    className="w-full h-12 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                    title="Xóa màu bìa"
                                    onClick={() => setEditFieldData({ ...editFieldData, currentValue: null })}
                                >
                                    <span className="text-gray-500 font-medium">Xóa màu</span>
                                </button> */}
                            </div>

                            {labelsLoading && (
                                <div className="flex justify-center items-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                    <span className="ml-2 text-sm text-gray-500">Đang tải danh sách màu...</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setEditingTaskField(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(editFieldData.currentValue)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup chỉnh sửa trạng thái */}
            {/* {editingTaskField === 'status' && (
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
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
                                onClick={() => handleSaveTaskField(editFieldData.currentValue)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )} */}

            {/* Modal chi tiết task */}
            {showTaskDetailModal && viewingTask && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden transform transition-all animate-scaleIn">
                        {loading ? (
                            <div className="py-12 flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                                <p className="text-gray-500">Loading details...</p>
                            </div>
                        ) : (
                            <div className="flex h-full">
                                {/* Phần thông tin chi tiết task - bên trái */}
                                <div className="w-[60%] p-6 overflow-y-auto max-h-[90vh]">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-gray-800">Task Details</h2>
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
                                            {viewingTask.priority === 'high' && (
                                                <span className="px-3 py-1 text-sm rounded-full font-medium bg-red-50 text-red-700 flex items-center">
                                                    High Priority
                                                </span>
                                            )}
                                            {viewingTask.priority === 'medium' && (
                                                <span className="px-3 py-1 text-sm rounded-full font-medium bg-yellow-50 text-yellow-700 flex items-center">
                                                    Medium Priority
                                                </span>
                                            )}
                                            {viewingTask.priority === 'low' && (
                                                <span className="px-3 py-1 text-sm rounded-full font-medium bg-green-50 text-green-700 flex items-center">
                                                    Low Priority
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* <div className="mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-medium text-gray-500">Màu bìa</h4>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            {[
                                                { color: 'bg-blue-500', name: 'Xanh dương' },
                                                { color: 'bg-green-500', name: 'Xanh lá' },
                                                { color: 'bg-red-500', name: 'Đỏ' },
                                                { color: 'bg-yellow-500', name: 'Vàng' },
                                                { color: 'bg-purple-500', name: 'Tím' },
                                                { color: 'bg-pink-500', name: 'Hồng' },
                                                { color: 'bg-indigo-500', name: 'Chàm' },
                                                { color: 'bg-gray-500', name: 'Xám' },
                                            ].map((colorOption) => (
                                                <button
                                                    key={colorOption.color}
                                                    className={`w-8 h-8 rounded-lg ${colorOption.color} hover:opacity-90 border-2 ${viewingTask.coverColor === colorOption.color ? 'border-black' : 'border-transparent'}`}
                                                    title={colorOption.name}
                                                    onClick={() => {
                                                        const updatedTask = { ...viewingTask, coverColor: colorOption.color };
                                                        setViewingTask(updatedTask);
                                                        handleSaveTaskField(colorOption.color, 'coverColor');
                                                    }}
                                                ></button>
                                            ))}
                                            {viewingTask.coverColor && (
                                                <button
                                                    className="w-8 h-8 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                    title="Xóa màu bìa"
                                                    onClick={() => {
                                                        const updatedTask = { ...viewingTask, coverColor: null };
                                                        setViewingTask(updatedTask);
                                                        handleSaveTaskField(null, 'coverColor');
                                                    }}
                                                >
                                                    <span className="text-gray-500">✕</span>
                                                </button>
                                            )}
                                        </div>
                                    </div> */}

                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">{viewingTask.description || "No description"}</p>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            {viewingTask.note ? viewingTask.note : "No notes"}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-sm font-medium text-gray-500">Assignees</h4>
                                                <button
                                                    onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center btn-hover-effect"
                                                >
                                                    <FontAwesomeIcon icon={faPlus} className="mr-1" size="xs" />
                                                    Add
                                                </button>
                                            </div>

                                            {/* Dropdown thêm thành viên */}
                                            {showMemberDropdown && (
                                                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                                                    <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md transform transition-all animate-scaleIn">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h2 className="text-xl font-bold text-gray-800">Members</h2>
                                                            <button
                                                                onClick={() => setShowMemberDropdown(false)}
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
                                                                placeholder="Search members..."
                                                            />
                                                        </div>

                                                        <div className="mb-4">
                                                            <h3 className="text-sm font-medium text-gray-500 mb-2">Card Members</h3>
                                                            {taskMembers && taskMembers.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {taskMembers.map((member, idx) => (
                                                                        <div key={`member-${idx}-${member.id}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                                                                            <div className="flex items-center">
                                                                                {member.avatar ? (
                                                                                    <img
                                                                                        src={member.avatar}
                                                                                        alt={member.name}
                                                                                        className="w-8 h-8 rounded-full object-cover mr-2"
                                                                                        onError={(e) => {
                                                                                            e.target.onerror = null;
                                                                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.name) + "&background=random";
                                                                                        }}
                                                                                    />
                                                                                ) : (
                                                                                    <div className={`w-8 h-8 rounded-full ${member.color || 'bg-blue-500'} flex items-center justify-center text-white font-medium mr-2`}>
                                                                                        {member.name?.charAt(0).toUpperCase() || 'U'}
                                                                                    </div>
                                                                                )}
                                                                                <span>{member.name}</span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => {
                                                                                    handleRemoveMember(viewingTask.id, viewingTask.milestoneId, member.id);
                                                                                    const updatedMembers = taskMembers.filter(m => m.id !== member.id);
                                                                                    setTaskMembers(updatedMembers);
                                                                                }}
                                                                                className="text-gray-400 hover:text-red-500"
                                                                            >
                                                                                <FontAwesomeIcon icon={faTrashAlt} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-3 text-gray-500">No members yet</div>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <h3 className="text-sm font-medium text-gray-500 mb-2">Board Members</h3>
                                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                {teamMembersLoading ? (
                                                                    <div className="flex justify-center items-center py-4">
                                                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                                                        <span className="ml-2 text-sm text-gray-500">Loading...</span>
                                                                    </div>
                                                                ) : (
                                                                    teamMembers
                                                                        .filter(member => {
                                                                            const alreadyInTask = taskMembers.some(tm => tm.id === member.id);
                                                                            const isInAsignTo = viewingTask?.asignTo?.some(assignee =>
                                                                                (typeof assignee === 'object' && assignee?.id === member.id) ||
                                                                                assignee === member.id
                                                                            );
                                                                            return !alreadyInTask && !isInAsignTo &&
                                                                                member.name.toLowerCase().includes(memberSearchQuery.toLowerCase());
                                                                        })
                                                                        .map((member, idx) => (
                                                                            <div
                                                                                key={`team-member-${idx}-${member.id}`}
                                                                                className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                                                                                onClick={() => {
                                                                                    handleAddMember(viewingTask.id, viewingTask.milestoneId, member.id);
                                                                                    setTaskMembers([...taskMembers, member]);
                                                                                }}
                                                                            >
                                                                                {member.avatar ? (
                                                                                    <img
                                                                                        src={member.avatar}
                                                                                        alt={member.name}
                                                                                        className="w-8 h-8 rounded-full object-cover mr-2"
                                                                                        onError={(e) => {
                                                                                            e.target.onerror = null;
                                                                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.name) + "&background=random";
                                                                                        }}
                                                                                    />
                                                                                ) : (
                                                                                    <div className={`w-8 h-8 rounded-full ${member.color || 'bg-blue-500'} flex items-center justify-center text-white font-medium mr-2`}>
                                                                                        {member.name.charAt(0).toUpperCase()}
                                                                                    </div>
                                                                                )}
                                                                                <span>{member.name}</span>
                                                                            </div>
                                                                        ))
                                                                )}
                                                                {!teamMembersLoading && teamMembers.filter(member => {
                                                                    const alreadyInTask = taskMembers.some(tm => tm.id === member.id);
                                                                    const isInAsignTo = viewingTask?.asignTo?.some(assignee =>
                                                                        (typeof assignee === 'object' && assignee?.id === member.id) ||
                                                                        assignee === member.id
                                                                    );
                                                                    return !alreadyInTask && !isInAsignTo &&
                                                                        member.name.toLowerCase().includes(memberSearchQuery.toLowerCase());
                                                                }).length === 0 && (
                                                                        <div className="text-center py-3 text-gray-500">
                                                                            {memberSearchQuery ? 'No matching members found' : 'All members have been added'}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}


                                            {/* Người được giao trong chi tiet task */}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {taskMembers && taskMembers.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {taskMembers.map((member, index) => (
                                                            <div
                                                                key={`task-member-${index}`}
                                                                className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm flex items-center group relative"
                                                            >
                                                                {member.avatar ? (
                                                                    <img
                                                                        src={member.avatar}
                                                                        alt={member.name || ""}
                                                                        className="w-6 h-6 rounded-full object-cover mr-1"
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.name || "User") + "&background=random";
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-1">
                                                                        {member.name?.charAt(0).toUpperCase() || "U"}
                                                                    </div>
                                                                )}
                                                                <span className="mr-1">{member.name}</span>
                                                                <button
                                                                    onClick={() => handleRemoveMember(viewingTask.id, viewingTask.milestoneId, member.id)}
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
                                                        ))}
                                                    </div>
                                                ) : viewingTask.asignTo && viewingTask.asignTo.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {viewingTask.asignTo.map((member, index) => (
                                                            <div key={index} className="bg-blue-50 px-2 py-1 rounded-full flex items-center">
                                                                {typeof member === 'object' && member !== null && member.avatarURL ? (
                                                                    <img
                                                                        src={member.avatarURL}
                                                                        alt={member.fullname}
                                                                        className="w-6 h-6 rounded-full object-cover mr-2"
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.fullname || 'User') + "&background=random";
                                                                        }}
                                                                    />
                                                                ) : (typeof member === 'string' && member.includes('http')) ? (
                                                                    <img
                                                                        src={member}
                                                                        alt={""}
                                                                        className="w-6 h-6 rounded-full object-cover mr-2"
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.src = "https://ui-avatars.com/api/?name=User&background=random";
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-1">
                                                                        {typeof member === 'object' ? member.fullname?.charAt(0) || 'U' : member?.charAt(0) || 'U'}
                                                                    </div>
                                                                )}
                                                                {typeof member !== 'string' && member.fullname && <span className="text-xs text-gray-700">{member.fullname}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500 text-sm italic">No assignees yet</div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Due date</h4>
                                            <div className="flex items-center text-gray-800">
                                                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-500" />
                                                {viewingTask.dueDate ? formatVietnameseDate(viewingTask.dueDate) : "No due date"}
                                            </div>
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
                                            Mark as Complete
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowMemberDropdown(!showMemberDropdown);
                                            }}
                                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium btn-hover-effect"
                                        >
                                            <FontAwesomeIcon icon={faUserFriends} />
                                            Members
                                        </button>
                                    </div>
                                </div>

                                {/* Phần bình luận - bên phải */}
                                <div className="w-[40%] border-l border-gray-200 p-6 overflow-y-auto max-h-[90vh] bg-gray-50">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                                        <FontAwesomeIcon icon={faComment} className="mr-2 text-indigo-500" /> Comments {(viewingTask.comments?.length > 0) && `(${viewingTask.comments.length})`}
                                    </h3>

                                    {/* Danh sách bình luận */}
                                    <div className="space-y-4 mb-4 max-h-[calc(90vh-180px)] overflow-y-auto">
                                        {viewingTask?.comments && viewingTask.comments.length > 0 ? (
                                            viewingTask.comments.map((comment) => (
                                                <div key={comment.id} className="flex space-x-3 group">
                                                    <UserAvatar userId={comment.userId} />
                                                    <div className="flex-1">
                                                        <div className="bg-white p-3 rounded-lg shadow-sm relative">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-medium text-gray-900">{comment.userName}</span>
                                                                <span className="text-xs text-gray-500">{getRelativeTime(comment.timestamp)}</span>
                                                            </div>
                                                            <p className="text-gray-700">{comment.text}</p>

                                                            {/* Nút xóa chỉ hiển thị cho bình luận của người dùng hiện tại */}
                                                            {(() => {
                                                                const userInfo = getUserInfoFromToken();
                                                                return userInfo && userInfo.userId === comment.userId && (
                                                                    <button
                                                                        onClick={() => handleDeleteComment(viewingTask.id, viewingTask.milestoneId, comment.id)}
                                                                        className="absolute right-2 top-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrashAlt} size="xs" />
                                                                    </button>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Form nhập bình luận */}
                                    <div className="sticky bottom-0 bg-gray-50 pt-4">
                                        <div className="flex items-center">
                                            <UserAvatar userId={getUserInfoFromToken()?.userId} />
                                            <div className="flex-1 relative">
                                                <input
                                                    ref={commentInputRef}
                                                    type="text"
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    placeholder="Add a comment..."
                                                    className="w-full border border-gray-300 rounded-full px-4 py-2 pr-10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
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
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chế độ xem Kanban */}
            {viewMode === 'kanban' && (
                <div className="fixed left-64 right-0 bottom-0 top-[190px] bg-gray-100 z-10 overflow-hidden">
                    {hasColumns ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={pointerWithin}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToWindowEdges]}
                        >
                            <div className="flex overflow-x-auto h-full pb-4 space-x-4 p-4 px-6">
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
                                        renderOverlayAssignees={renderOverlayAssignees}
                                    />
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    ) : (
                        <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col items-center m-4">
                            <div className="mb-4">
                                <FontAwesomeIcon icon={faClipboardList} className="text-4xl text-gray-400" />
                            </div>
                            <h3 className="text-xl font-medium mb-2">No columns yet</h3>
                            <p className="mb-6">This milestone has no columns. Add a milestone to get started.</p>
                            <button
                                onClick={() => setShowNewMilestoneForm(true)}
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow flex items-center gap-2 transition-all font-medium"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" /> Add Milestone
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Chế độ xem danh sách */}
            {viewMode === 'list' && (
                hasColumns ? (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                        {/* Thanh tìm kiếm và lọc */}
                        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex gap-3 items-center">
                                <div className="relative max-w-xs">
                                    <input
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={filterParams.search}
                                        onChange={(e) => handleLocalSearch(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    />
                                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500">
                                        <FontAwesomeIcon icon={faSearch} />
                                    </button>
                                </div>
                                <select
                                    className="border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-gray-700"
                                    value={filterParams.columnStatusId || ''}
                                    onChange={(e) =>
                                        handleFilterByColumn(e.target.value === '' ? null : Number(e.target.value))
                                    }                                >
                                    <option value="">All columns</option>
                                    {Object.values(columns).map(milestone => (
                                        <option key={milestone.id} value={milestone.columnId}>
                                            {milestone.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* <div className="text-gray-500 text-sm">
                                Hiển thị {tasksList.length} trên tổng số {pagination.totalItems} task
                            </div> */}
                        </div>

                        {tasksListLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                                    <p className="text-gray-500">Loading task list...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ID
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Title
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Priority
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Description
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Due date
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Notes
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Created by
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Assignees
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {tasksList
                                                .slice(
                                                    (pagination.pageNumber - 1) * pagination.pageSize,
                                                    pagination.pageNumber * pagination.pageSize
                                                )
                                                .map((task) => (
                                                    <tr
                                                        key={task.taskId || task.id}
                                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                        onClick={() => {
                                                            const col = Object.values(columns).find(c =>
                                                                (c.title || c.columnName)?.toLowerCase() === (task.columnStatus || '').toLowerCase()
                                                            );
                                                            const milestoneId = col?.id;                // 'milestone-<columnStatusId>'
                                                            const normalizedTask = { ...task, id: `task-${task.taskId}` };
                                                            handleTaskClick(milestoneId, normalizedTask);
                                                        }}                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{task.taskId || task.id}</div>
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
                                                            <div className="text-sm text-gray-900">
                                                                {task.dueDate ? formatVietnameseDate(task.dueDate) : "No due date"}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-500 max-w-[200px] truncate">
                                                                {task.note || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <img
                                                                    src={task.createdBy || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                    alt="Người tạo"
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                                                {(task.asignTo && task.asignTo.length > 0) ? (
                                                                    task.asignTo.slice(0, 2).map((assignee, idx) => (
                                                                        <div key={idx}>
                                                                            {(typeof assignee === 'object' && assignee !== null && assignee.avatarURL) ? (
                                                                                <img
                                                                                    src={assignee.avatarURL}
                                                                                    alt={assignee.fullname}
                                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                                    onError={(e) => {
                                                                                        e.target.onerror = null;
                                                                                        e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(assignee.fullname || 'User') + "&background=random";
                                                                                    }}
                                                                                />
                                                                            ) : (typeof assignee === 'string' && assignee.includes('http')) ? (
                                                                                <img
                                                                                    src={assignee}
                                                                                    alt=""
                                                                                    className="w-6 h-6 rounded-full object-cover"
                                                                                    onError={(e) => {
                                                                                        e.target.onerror = null;
                                                                                        e.target.src = "https://ui-avatars.com/api/?name=User&background=random";
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs">
                                                                                    {typeof assignee === 'string' ?
                                                                                        assignee?.charAt(0) || 'U' :
                                                                                        (assignee?.fullname?.charAt(0) || 'U')}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-sm text-gray-500">Chưa giao</span>
                                                                )}
                                                                {task.asignTo && task.asignTo.length > 2 && (
                                                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                                                                        +{task.asignTo.length - 2}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Phân trang */}
                                {pagination.totalPages > 1 && (
                                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                                        <div className="flex items-center">
                                            <span className="text-sm text-gray-700 mr-2">Hiển thị</span>
                                            <select
                                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                                                value={pagination.pageSize}
                                                onChange={(e) => handleLocalPageSizeChange(Number(e.target.value))}
                                            >
                                                <option value="5">5</option>
                                                <option value="10">10</option>
                                                <option value="20">20</option>
                                                <option value="50">50</option>
                                            </select>
                                            <span className="text-sm text-gray-700 ml-2">mục mỗi trang</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleLocalPageChange(1)}
                                                disabled={pagination.pageNumber === 1}
                                                className={`px-3 py-1 rounded ${pagination.pageNumber === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                                            >
                                                <FontAwesomeIcon icon={faAngleDoubleLeft} />
                                            </button>
                                            <button
                                                onClick={() => handleLocalPageChange(pagination.pageNumber - 1)}
                                                disabled={pagination.pageNumber === 1}
                                                className={`px-3 py-1 rounded ${pagination.pageNumber === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                                            >
                                                <FontAwesomeIcon icon={faAngleLeft} />
                                            </button>

                                            {/* Hiển thị các nút trang */}
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (pagination.totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (pagination.pageNumber <= 3) {
                                                    pageNum = i + 1;
                                                } else if (pagination.pageNumber >= pagination.totalPages - 2) {
                                                    pageNum = pagination.totalPages - 4 + i;
                                                } else {
                                                    pageNum = pagination.pageNumber - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handleLocalPageChange(pageNum)}
                                                        className={`px-3 py-1 rounded ${pagination.pageNumber === pageNum ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                onClick={() => handleLocalPageChange(pagination.pageNumber + 1)}
                                                disabled={pagination.pageNumber === pagination.totalPages}
                                                className={`px-3 py-1 rounded ${pagination.pageNumber === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                                            >
                                                <FontAwesomeIcon icon={faAngleRight} />
                                            </button>
                                            <button
                                                onClick={() => handleLocalPageChange(pagination.totalPages)}
                                                disabled={pagination.pageNumber === pagination.totalPages}
                                                className={`px-3 py-1 rounded ${pagination.pageNumber === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                                            >
                                                <FontAwesomeIcon icon={faAngleDoubleRight} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col items-center">
                        <div className="mb-4">
                            <FontAwesomeIcon icon={faClipboardList} className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No data</h3>
                        <p className="mb-6">There are no tasks yet. Add milestones and tasks to get started.</p>
                        <button
                            onClick={() => setShowNewMilestoneForm(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow flex items-center gap-2 transition-all font-medium"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-sm" /> Add Milestone
                        </button>
                    </div>
                )
            )}

            {/* Modal hiển thị Activity Logs */}
            {showActivityLogs && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl transform transition-all animate-scaleIn">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h2 className="font-semibold text-xl text-gray-800">Activity Log</h2>
                                <p className="text-sm text-gray-500">History of actions on tasks</p>
                            </div>
                            <button
                                onClick={() => setShowActivityLogs(false)}
                                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <ActivityLogsList activities={activityLogs} loading={activityLogsLoading} />
                        </div>
                        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    fetchActivityLogs();
                                    toast.info('Activity log refreshed');
                                }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg mr-2 transition-colors"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={() => setShowActivityLogs(false)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chế độ xem Dashboard */}
            {viewMode === 'dashboard' && (
                <div className="space-y-8">
                    {dashboardLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                                <p className="text-gray-500">Loading dashboard data...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Status statistics */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                                    <FontAwesomeIcon icon={faLayerGroup} className="mr-3 text-blue-600" />
                                    Status Summary
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {dashboardData.statusCounts && dashboardData.statusCounts.map((status, index) => (
                                        <div key={index} className="bg-gray-50 p-5 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Status</span>
                                                    <h3 className="text-xl font-bold mt-1">{status.statusName}</h3>
                                                </div>
                                                <div className={`w-12 h-12 rounded-full ${getStatusColorClass(status.statusName)} flex items-center justify-center text-white`}>
                                                    <span className="text-lg font-bold">{status.count}</span>
                                                </div>
                                            </div>
                                            {/* <div className="mt-4">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`${getStatusColorClass(status.statusName)} h-2 rounded-full`}
                                                        style={{
                                                            width: `${dashboardData.statusCounts.reduce((acc, curr) => acc + curr.count, 0) > 0
                                                                ? (status.count / dashboardData.statusCounts.reduce((acc, curr) => acc + curr.count, 0) * 100)
                                                                : 0}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2">
                                                    {dashboardData.statusCounts.reduce((acc, curr) => acc + curr.count, 0) > 0
                                                        ? ((status.count / dashboardData.statusCounts.reduce((acc, curr) => acc + curr.count, 0)) * 100).toFixed(1)
                                                        : 0}% công việc
                                                </p>
                                            </div> */}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Members statistics */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                                    <FontAwesomeIcon icon={faUsers} className="mr-3 text-indigo-600" />
                                    Member Summary
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full divide-y divide-gray-300">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Member
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <div className="flex items-center">
                                                        <FontAwesomeIcon icon={faTasks} className="mr-1" /> Total tasks
                                                    </div>
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <div className="flex items-center">
                                                        <FontAwesomeIcon icon={faCheck} className="mr-1 text-green-500" /> Completed
                                                    </div>
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <div className="flex items-center">
                                                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-yellow-500" /> Overdue
                                                    </div>
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <div className="flex items-center">
                                                        <FontAwesomeIcon icon={faPercentage} className="mr-1 text-blue-500" /> Completion rate
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {dashboardData.memberTaskStats && dashboardData.memberTaskStats.length > 0 ? (
                                                dashboardData.memberTaskStats.map((member, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10">
                                                                    <img
                                                                        className="h-10 w-10 rounded-full object-cover"
                                                                        src={member.accountAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.accountName)}&background=random`}
                                                                        alt={member.accountName}
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.accountName)}&background=random`;
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{member.accountName}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium">{member.totalTasks}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-green-600">{member.completedTasks}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-yellow-500">{member.overdueTasks}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 max-w-[150px]">
                                                                <div
                                                                    className="bg-blue-600 h-2.5 rounded-full"
                                                                    style={{ width: formatPercentage(member.completionRate) }}
                                                                ></div>
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-900">{formatPercentage(member.completionRate)}</div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                        No member data
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Milestone;