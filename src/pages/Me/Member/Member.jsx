import React, { useState, useEffect } from 'react';
import { getUserId } from '@/apis/authService';
import useMemberManagement from '@/hooks/useMemberManagement';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserPlus, faUserEdit, faUserMinus,
    faSearch, faTimes, faCheck, faSpinner, faEllipsisV,
    faPlus, faTags
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Dropdownstartup from '@/components/Dropdown/Dropdownstartup';
import { getStartupIdByAccountId } from '@/apis/startupService';

// Import SVG icons
import updateSvg from '/update-icon-svgrepo-com.svg';
import deleteSvg from '/delete-svgrepo-com.svg';

const roleOptions = [
    { value: 'Founder', label: 'Chủ startup' },
    { value: 'Admin', label: 'Quản trị viên' },
    { value: 'Member', label: 'Thành viên' }
];

const Member = () => {
    const [startupId, setStartupId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [openMenuIndex, setOpenMenuIndex] = useState(null);
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [editingRoleName, setEditingRoleName] = useState("");

    useEffect(() => {
        const fetchStartupId = async () => {
            try {
                const userId = await getUserId();
                const response = await getStartupIdByAccountId(userId);
                if (response) {
                    setStartupId(response);
                } else {
                    toast.warning('Bạn chưa thuộc về startup nào');
                }
            } catch (error) {
                console.error('Error fetching startup ID:', error);
                toast.error('Không thể xác định startup của bạn');
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
        inviteMember,
        updateMemberRole,
        removeMember,
        createRole,
        updateRole,
        deleteRole
    } = useMemberManagement(startupId);

    // Bắt đầu chỉnh sửa vai trò
    const handleStartEditRole = (role) => {
        setEditingRoleId(role.roleId);
        setEditingRoleName(role.roleName);
    };

    // Lưu chỉnh sửa vai trò
    const handleSaveRoleEdit = () => {
        if (editingRoleId && editingRoleName.trim()) {
            updateRole({
                roleId: editingRoleId,
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

    // Xử lý chọn người dùng từ kết quả tìm kiếm
    const handleSelectUser = (user) => {
        setSelectedUser(user);
    };

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
                        Không tìm thấy người dùng
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
                        {user.displayName || 'Người dùng'}
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
                    Đã xảy ra lỗi khi tải dữ liệu
                </h6>
                <button
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
                    onClick={fetchMembers}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    Quản lý thành viên
                </h1>
                <div className="flex space-x-3">
                    <button
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition"
                        onClick={() => setShowAddRoleModal(true)}
                    >
                        <FontAwesomeIcon icon={faTags} className="mr-2" />
                        Thêm vai trò mới
                    </button>
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition"
                        onClick={() => setShowAddMemberModal(true)}
                    >
                        <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                        Mời thành viên
                    </button>
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
                                Thành viên
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vai trò
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ngày tham gia
                            </th>
                            {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                Thao tác
                            </th> */}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members.length > 0 ? (
                            members.map((member, index) => {
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
                                                        {member.fullName || 'Chưa có tên'}
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
                                                <button
                                                    ref={ellipsisRef}
                                                    className="text-gray-600 hover:text-gray-900 focus:outline-none"
                                                    onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}
                                                    title="Thao tác"
                                                >
                                                    <FontAwesomeIcon icon={faEllipsisV} />
                                                </button>
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
                                                            Chỉnh sửa vai trò
                                                        </button>
                                                        <button
                                                            className={`w-full flex items-center px-2 py-2 text-sm text-red-600 hover:bg-gray-100 ${member.roleName === 'Founder' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            onClick={() => {
                                                                removeMember(member.memberId);
                                                                setOpenMenuIndex(null);
                                                            }}
                                                            disabled={member.roleName === 'Founder'}
                                                        >
                                                            <FontAwesomeIcon icon={faUserMinus} className="mr-2" />
                                                            Xóa thành viên
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
                                    Chưa có thành viên nào trong startup
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
                                        Mời thành viên mới
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
                                                    placeholder="Tìm kiếm theo email"
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
                                                Người dùng được chọn:
                                            </p>
                                            <div className="flex items-center p-3 border border-gray-300 rounded-lg">
                                                <img
                                                    src={selectedUser.avatarUrl || '/placeholder-avatar.png'}
                                                    alt={selectedUser.displayName || selectedUser.email}
                                                    className="w-10 h-10 rounded-full mr-3 object-cover"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">
                                                        {selectedUser.displayName || 'Người dùng'}
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
                                            Vai trò
                                        </label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={newMemberRole}
                                            onChange={(e) => setNewMemberRole(e.target.value)}
                                        >
                                            {roleOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${(!selectedUser || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={inviteMember}
                                    disabled={!selectedUser || loading}
                                >
                                    {loading ? (
                                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                    ) : (
                                        <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                    )}
                                    Mời thành viên
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowAddMemberModal(false)}
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal sửa vai trò thành viên */}
            {showEditMemberModal && selectedMember && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center pb-3 border-b">
                                    <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                                        Thay đổi vai trò thành viên
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
                                                {selectedMember.displayName || 'Người dùng'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {selectedMember.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vai trò
                                        </label>
                                        <select
                                            className={`w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${selectedMember.roleName === 'Founder' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            value={newMemberRole}
                                            onChange={(e) => setNewMemberRole(e.target.value)}
                                            disabled={selectedMember.roleName === 'Founder'}
                                        >
                                            {roleOptions.map(option => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                    disabled={option.value === 'Founder' && selectedMember.roleName !== 'Founder'}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedMember.roleName === 'Founder' && (
                                        <p className="mt-2 text-xs text-red-500">
                                            Không thể thay đổi vai trò của chủ startup
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
                                    Lưu thay đổi
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowEditMemberModal(false)}
                                >
                                    Hủy
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
                                        Quản lý vai trò
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
                                            Tên vai trò mới *
                                        </label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                value={newRole.roleName}
                                                onChange={(e) => setNewRole({ ...newRole, roleName: e.target.value })}
                                                placeholder="Nhập tên vai trò"
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
                                        <h4 className="text-md font-medium mb-3">Vai trò hiện có</h4>
                                        {roles.length > 0 ? (
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="">
                                                        <tr>
                                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Tên vai trò
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
                                                                            <button
                                                                                className="text-blue-600 hover:text-blue-800"
                                                                                onClick={() => handleStartEditRole(role)}
                                                                            >
                                                                                <img src={updateSvg} alt="Edit role" className="w-5 h-5" />
                                                                            </button>
                                                                            <button
                                                                                className="text-red-600 hover:text-red-800"
                                                                                onClick={() => deleteRole(role.roleId)}
                                                                            >
                                                                                <img src={deleteSvg} alt="Delete role" className="w-5 h-5" />
                                                                            </button>
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
                                                <p className="text-sm text-gray-500">Chưa có vai trò nào được tạo</p>
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
                                    Đóng
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