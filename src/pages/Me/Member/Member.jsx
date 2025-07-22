import React, { useState, useEffect } from 'react';
import { getUserId } from '@/apis/authService';
import useMemberManagement from '@/hooks/useMemberManagement';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserPlus, faUserEdit, faUserMinus,
    faSearch, faTimes, faCheck, faSpinner, faEllipsisV,
    faPlus, faTags, faFilter, faCog
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Dropdownstartup from '@/components/Dropdown/Dropdownstartup';
import { getStartupIdByAccountId } from '@/apis/startupService';

// Import SVG icons
import updateSvg from '/update-icon-svgrepo-com.svg';
import deleteSvg from '/delete-svgrepo-com.svg';
import roleSvg from '/user-role-svgrepo-com.svg';

const roleOptions = [
    { value: 'Founder', label: 'Founder' },
    { value: 'Admin', label: 'Administrator' },
    { value: 'Member', label: 'Member' }
];

const Member = () => {
    const [startupId, setStartupId] = useState(null);
    const [openMenuIndex, setOpenMenuIndex] = useState(null);
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [editingRoleName, setEditingRoleName] = useState("");
    const [memberSearchTerm, setMemberSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);



    useEffect(() => {
        const fetchStartupId = async () => {
            try {
                const userId = await getUserId();
                const response = await getStartupIdByAccountId(userId);
                if (response) {
                    setStartupId(response);
                } else {
                    toast.warning('You do not belong to any startup yet');
                }
            } catch (error) {
                console.error('Error fetching startup ID:', error);
                toast.error('Cannot determine your startup');
            }
        };

        fetchStartupId();
    }, []);




    const {
        members,
        loading,
        error,
        selectedMember,
        showAddMemberModal,
        showEditMemberModal,
        showAddRoleModal,
        searchEmail,
        searchResults,
        isSearching,
        newMemberRole,
        roles,
        newRole,

        setSelectedMember,
        setShowAddMemberModal,
        setShowEditMemberModal,
        setShowAddRoleModal,
        setSearchEmail,
        setNewMemberRole,
        setNewRole,

        fetchMembers,
        fetchRoles,
        handleEmailInputChange,
        handleSelectUser,
        inviteMember,
        updateMemberRole,
        removeMember,
        createRole,
        updateRole,
        deleteRole,
        selectedUser,
        setSelectedUser,
        leaveStartup,
        showPermissionsModal,
        openPermissionsModal,
        selectedRolePermissions,
        setSelectedRolePermissions,
        setShowPermissionsModal,
        updatePermissions
    } = useMemberManagement(startupId);

    // Bắt đầu chỉnh sửa vai trò
    const handleStartEditRole = (role) => {
        setEditingRoleId(role.roleId);
        setEditingRoleName(role.roleName);
    };

    // Đặt giá trị mặc định cho vai trò khi mở modal
    const handleOpenAddMemberModal = () => {
        // Đặt giá trị ban đầu của vai trò là rỗng để hiển thị lựa chọn "Hãy chọn vai trò"
        setNewMemberRole("");
        setShowAddMemberModal(true);
    };

    // Lưu chỉnh sửa vai trò
    const handleSaveRoleEdit = () => {
        if (editingRoleId && editingRoleName.trim()) {
            updateRole({
                role_ID: editingRoleId,
                roleName: editingRoleName
            });
            setEditingRoleId(null);
            setEditingRoleName("");
        }
    };

    // Hủy chỉnh sửa vai trò
    const handleCancelRoleEdit = () => {
        setEditingRoleId(null);
        setEditingRoleName("");
    };

    // Xử lý mở modal sửa thành viên
    const handleOpenEditModal = (member) => {
        setSelectedMember(member);
        setNewMemberRole(member.roleName);
        setShowEditMemberModal(true);
    };

    // Xử lý lưu thay đổi vai trò
    const handleSaveRoleChange = () => {
        if (!selectedMember) return;
        updateMemberRole(selectedMember.memberId, newMemberRole);
    };

    // Lọc thành viên theo từ khóa tìm kiếm và vai trò
    const filteredMembers = members.filter(member => {
        const matchesSearch = member.fullName?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(memberSearchTerm.toLowerCase());

        const matchesRole = roleFilter ? member.roleName === roleFilter : true;

        return matchesSearch && matchesRole;
    });

    // Render kết quả tìm kiếm
    const renderSearchResults = () => {
        if (isSearching) {
            return (
                <div className="flex justify-center p-2">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500" />
                </div>
            );
        }

        if (searchResults.length === 0 && searchEmail.trim() !== '') {
            return (
                <div className="p-2 text-center">
                    <p className="text-gray-500 text-sm">
                        No user found
                    </p>
                </div>
            );
        }

        return searchResults.map((user) => (
            <div
                key={user.accountId}
                className="flex items-center p-1.5 border-b border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handleSelectUser(user)}
            >
                <img
                    src={user.avatarUrl || '/placeholder-avatar.png'}
                    alt={user.displayName || user.email}
                    className="w-10 h-10 rounded-full mr-2 object-cover"
                />
                <div>
                    <p className="font-medium text-sm">
                        {user.name || 'User'}
                    </p>
                    <p className="text-gray-500 text-xs">
                        {user.email}
                    </p>
                </div>
            </div>
        ));
    };

    // Đóng menu khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.member-action-menu')) {
                setOpenMenuIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (loading && members.length === 0) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 text-2xl" />
            </div>
        );
    }

    if (error && members.length === 0) {
        return (
            <div className="text-center mt-5">
                <h6 className="text-red-500 text-lg font-medium">
                    An error occurred while loading data
                </h6>
                <button
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    onClick={fetchMembers}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    Member Management
                </h1>
                <div className="flex space-x-3">
                    {members.find(m => m.accountId == getUserId())?.roleName === 'Founder' && (
                        <>
                            <button
                                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-5 py-2.5 rounded-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                onClick={() => setShowAddRoleModal(true)}
                            >
                                <img src={roleSvg} alt="Edit role" className="w-5 h-5 mr-2 text-white" />
                                <span className="font-medium">Add New Role</span>
                            </button>
                            <button
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                onClick={handleOpenAddMemberModal}
                            >
                                <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                <span className="font-medium">Invite Member</span>
                            </button>
                        </>
                    )}
                    {members.find(m => m.accountId == getUserId())?.roleName !== 'Founder' && (
                        <button
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-2.5 rounded-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            onClick={() => {
                                if (window.confirm('Bạn có chắc chắn muốn rời khỏi startup này không?')) {
                                    leaveStartup();
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={faUserMinus} className="mr-2" />
                            <span className="font-medium">Leave Startup</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Thanh tìm kiếm và lọc */}
            <div className="bg-white p-4 rounded-lg shadow mb-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                        </span>
                        <input
                            type="text"
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Search by name or email"
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="md:w-64">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                            </span>
                            <select
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="">All roles</option>
                                {roles.map(role => (
                                    <option key={role.roleId} value={role.roleName}>
                                        {role.roleName}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                #
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Member
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Join Date
                            </th>
                            {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                Thao tác
                            </th> */}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map((member, index) => {
                                const ellipsisRef = React.createRef();
                                return (
                                    <tr key={member.memberId || index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img
                                                    className="h-10 w-10 rounded-full object-cover"
                                                    src={member.avatarUrl || '/placeholder-avatar.png'}
                                                />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {member.fullName || 'No name'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {member.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${member.roleName === 'Founder' ? 'bg-red-100 text-red-800' :
                                                    member.roleName === 'Admin' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'}`}>
                                                {member.roleName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(member.joinAT).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="relative">
                                                {/* Chỉ hiển thị nút tùy chọn cho người dùng có vai trò Founder và không hiện ở hàng của chính họ */}
                                                {members.find(m => m.accountId == getUserId())?.roleName === 'Founder' && member.accountId != getUserId() && (
                                                    <button
                                                        ref={ellipsisRef}
                                                        className="text-gray-600 hover:text-gray-900 focus:outline-none"
                                                        onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}
                                                        title="Thao tác"
                                                    >
                                                        <FontAwesomeIcon icon={faEllipsisV} />
                                                    </button>
                                                )}
                                                {openMenuIndex === index && (
                                                    <Dropdownstartup anchorRef={ellipsisRef} onClose={() => setOpenMenuIndex(null)}>
                                                        <button
                                                            className="w-full flex items-center px-2 py-2 text-sm text-blue-600 hover:bg-gray-100"
                                                            onClick={() => {
                                                                handleOpenEditModal(member);
                                                                setOpenMenuIndex(null);
                                                            }}
                                                            disabled={member.roleName === 'Founder'}
                                                        >
                                                            <FontAwesomeIcon icon={faUserEdit} className="mr-2" />
                                                            Edit role
                                                        </button>
                                                        <button
                                                            className={`w-full flex items-center px-2 py-2 text-sm text-red-600 hover:bg-gray-100 ${member.roleName === 'Founder' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            onClick={() => {
                                                                setMemberToDelete(member);
                                                                setShowDeleteConfirmModal(true);
                                                                setOpenMenuIndex(null);
                                                            }}
                                                            disabled={member.roleName === 'Founder'}
                                                        >
                                                            <FontAwesomeIcon icon={faUserMinus} className="mr-2" />
                                                            Remove member
                                                        </button>
                                                    </Dropdownstartup>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                    {memberSearchTerm || roleFilter ? 'No matching member found' : 'No members in the startup yet'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal mời thành viên */}
            {showAddMemberModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center pb-3 border-b">
                                    <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                                        Invite new member
                                    </h3>
                                    <button
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={() => setShowAddMemberModal(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <div className="mb-4 relative">
                                        <div className="flex">
                                            <div className="relative flex-1">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Search by email"
                                                    value={searchEmail}
                                                    onChange={handleEmailInputChange}
                                                />
                                                {searchEmail && (
                                                    <button
                                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                        onClick={() => setSearchEmail('')}
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kết quả tìm kiếm */}
                                    <div className={`max-h-48 overflow-y-auto mb-4 ${searchResults.length > 0 ? 'border border-gray-200 rounded-lg' : ''}`}>
                                        {renderSearchResults()}
                                    </div>

                                    {/* Người dùng đã chọn */}
                                    {selectedUser && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium mb-1">
                                                Selected user:
                                            </p>
                                            <div className="flex items-center p-3 border border-gray-300 rounded-lg">
                                                <img
                                                    src={selectedUser.avatarUrl || '/placeholder-avatar.png'}
                                                    alt={selectedUser.displayName || selectedUser.email}
                                                    className="w-10 h-10 rounded-full mr-3 object-cover"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">
                                                        {selectedUser.displayName || 'User'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {selectedUser.email}
                                                    </p>
                                                </div>
                                                <button
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => setSelectedUser(null)}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Chọn vai trò */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={newMemberRole}
                                            onChange={(e) => setNewMemberRole(e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>Please select a role</option>
                                            {roles.length > 0 ? (
                                                roles.map(role => (
                                                    <option
                                                        key={role.roleId}
                                                        value={role.roleName}
                                                        disabled={role.roleName === 'Founder'}
                                                    >
                                                        {role.roleName}
                                                    </option>
                                                ))
                                            ) : (
                                                roleOptions.map(option => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                        disabled={option.value === 'Founder'}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${(!selectedUser || loading || !newMemberRole) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={inviteMember}
                                    disabled={!selectedUser || loading || !newMemberRole}
                                >
                                    {loading ? (
                                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                    ) : (
                                        <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                    )}
                                    Invite member
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowAddMemberModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal sửa vai trò thành viên */}
            {showEditMemberModal && selectedMember && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className=" justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center pb-3 border-b">
                                    <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                                        Change member role
                                    </h3>
                                    <button
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={() => setShowEditMemberModal(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center p-3 border border-gray-300 rounded-lg mb-4">
                                        <img
                                            src={selectedMember.avatarUrl || '/placeholder-avatar.png'}
                                            alt={selectedMember.displayName || selectedMember.email}
                                            className="w-10 h-10 rounded-full mr-3 object-cover"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {selectedMember.displayName || 'User'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {selectedMember.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            className={`w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${selectedMember.roleName === 'Founder' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            value={newMemberRole}
                                            onChange={(e) => setNewMemberRole(e.target.value)}
                                            disabled={selectedMember.roleName === 'Founder'}
                                        >
                                            {roles.length > 0 ? (
                                                roles.map(role => (
                                                    <option
                                                        key={role.roleId}
                                                        value={role.roleName}
                                                        disabled={role.roleName === 'Founder' && selectedMember.roleName !== 'Founder'}
                                                    >
                                                        {role.roleName}
                                                    </option>
                                                ))
                                            ) : (
                                                roleOptions.map(option => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                        disabled={option.value === 'Founder' && selectedMember.roleName !== 'Founder'}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    {selectedMember.roleName === 'Founder' && (
                                        <p className="mt-2 text-xs text-red-500">
                                            Cannot change the role of the startup owner
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${(!selectedMember || loading || selectedMember.roleName === 'Founder') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={handleSaveRoleChange}
                                    disabled={!selectedMember || loading || selectedMember.roleName === 'Founder'}
                                >
                                    {loading ? (
                                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                    ) : (
                                        <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                    )}
                                    Save changes
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowEditMemberModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal thêm vai trò mới */}
            {showAddRoleModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center pb-3 border-b">
                                    <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                                        Role management
                                    </h3>
                                    <button
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={() => setShowAddRoleModal(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New role name *
                                        </label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                value={newRole.roleName}
                                                onChange={(e) => setNewRole({ ...newRole, roleName: e.target.value })}
                                                placeholder="Enter role name"
                                            />
                                            <button
                                                type="button"
                                                className={`bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-lg flex items-center transition ${loading || !newRole.roleName?.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={createRole}
                                                disabled={loading || !newRole.roleName?.trim()}
                                            >
                                                {loading ? (
                                                    <FontAwesomeIcon icon={faSpinner} spin />
                                                ) : (
                                                    <FontAwesomeIcon icon={faPlus} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h4 className="text-md font-medium mb-3">Existing roles</h4>
                                        {roles.length > 0 ? (
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="">
                                                        <tr>
                                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Role name
                                                            </th>
                                                            {/* <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                                                Hành động
                                                            </th> */}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {roles.map((role) => (
                                                            <tr key={role.roleId} className="hover:bg-gray-50">
                                                                <td className="px-3 py-2">
                                                                    {editingRoleId === role.roleId ? (
                                                                        <input
                                                                            type="text"
                                                                            className="w-full border border-gray-300 rounded py-1 px-2 text-sm"
                                                                            value={editingRoleName}
                                                                            onChange={(e) => setEditingRoleName(e.target.value)}
                                                                            autoFocus
                                                                        />
                                                                    ) : (
                                                                        <span className="text-sm">{role.roleName}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 text-right text-sm font-medium whitespace-nowrap">
                                                                    {editingRoleId === role.roleId ? (
                                                                        <div className="flex space-x-2 justify-end">
                                                                            <button
                                                                                className="text-green-600 hover:text-green-800"
                                                                                onClick={handleSaveRoleEdit}
                                                                                disabled={!editingRoleName.trim()}
                                                                            >
                                                                                <FontAwesomeIcon icon={faCheck} />
                                                                            </button>
                                                                            <button
                                                                                className="text-gray-600 hover:text-gray-800"
                                                                                onClick={handleCancelRoleEdit}
                                                                            >
                                                                                <FontAwesomeIcon icon={faTimes} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex space-x-3 justify-end">
                                                                            {role.roleName !== 'Founder' && (
                                                                                <>
                                                                                    <button
                                                                                        className="text-blue-600 hover:text-blue-800"
                                                                                        onClick={() => handleStartEditRole(role)}
                                                                                    >
                                                                                        <img src={updateSvg} alt="Edit role" className="w-5 h-5" />
                                                                                    </button>
                                                                                    <button
                                                                                        className="text-green-600 hover:text-green-800"
                                                                                        onClick={() => openPermissionsModal(role.roleId)}
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faCog} className="w-5 h-5" />
                                                                                    </button>
                                                                                    <button
                                                                                        className="text-red-600 hover:text-red-800"
                                                                                        onClick={() => deleteRole(role.roleId)}
                                                                                    >
                                                                                        <img src={deleteSvg} alt="Delete role" className="w-5 h-5" />
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 border rounded-lg bg-gray-50">
                                                <p className="text-sm text-gray-500">No roles have been created yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setShowAddRoleModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal quản lý quyền */}
            {showPermissionsModal && selectedRolePermissions && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center pb-3 border-b">
                                    <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                                        Permission Management
                                    </h3>
                                    <button
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={() => setShowPermissionsModal(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700">Manage Posts</span>
                                            <div
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${selectedRolePermissions.canManagePost ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                onClick={() => setSelectedRolePermissions({
                                                    ...selectedRolePermissions,
                                                    canManagePost: !selectedRolePermissions.canManagePost
                                                })}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${selectedRolePermissions.canManagePost ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700">Manage Candidates</span>
                                            <div
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${selectedRolePermissions.canManageCandidate ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                onClick={() => setSelectedRolePermissions({
                                                    ...selectedRolePermissions,
                                                    canManageCandidate: !selectedRolePermissions.canManageCandidate
                                                })}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${selectedRolePermissions.canManageCandidate ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700">Manage Chat Rooms</span>
                                            <div
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${selectedRolePermissions.canManageChatRoom ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                onClick={() => setSelectedRolePermissions({
                                                    ...selectedRolePermissions,
                                                    canManageChatRoom: !selectedRolePermissions.canManageChatRoom
                                                })}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${selectedRolePermissions.canManageChatRoom ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700">Manage Members</span>
                                            <div
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${selectedRolePermissions.canManageMember ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                onClick={() => setSelectedRolePermissions({
                                                    ...selectedRolePermissions,
                                                    canManageMember: !selectedRolePermissions.canManageMember
                                                })}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${selectedRolePermissions.canManageMember ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700">Manage Milestones</span>
                                            <div
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${selectedRolePermissions.canManageMilestone ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                onClick={() => setSelectedRolePermissions({
                                                    ...selectedRolePermissions,
                                                    canManageMilestone: !selectedRolePermissions.canManageMilestone
                                                })}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${selectedRolePermissions.canManageMilestone ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => updatePermissions(selectedRolePermissions)}
                                >
                                    Save changes
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowPermissionsModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal xác nhận xóa thành viên */}
            {showDeleteConfirmModal && memberToDelete && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <FontAwesomeIcon icon={faUserMinus} className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                            Remove member
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Are you sure you want to remove <strong>{memberToDelete.fullName || memberToDelete.email}</strong> from the startup? This action cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => {
                                        removeMember(memberToDelete.accountId);
                                        setShowDeleteConfirmModal(false);
                                        setMemberToDelete(null);
                                    }}
                                >
                                    Confirm removal
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => {
                                        setShowDeleteConfirmModal(false);
                                        setMemberToDelete(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Member;