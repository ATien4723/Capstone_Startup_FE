import { useState, useEffect, useCallback } from 'react';
import * as startupService from '@/apis/startupService';
import * as permissionService from '@/apis/permissionService';
import { toast } from 'react-toastify';
import { getUserId } from '@/apis/authService';

export default function useMemberManagement(startupId) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showEditMemberModal, setShowEditMemberModal] = useState(false);
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [roles, setRoles] = useState([]);
    const [newRole, setNewRole] = useState({ roleName: '' }); // Chỉ cần roleName, không cần description
    const [selectedRolePermissions, setSelectedRolePermissions] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState(null);

    // State cho phần mời thành viên
    const [searchEmail, setSearchEmail] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newMemberRole, setNewMemberRole] = useState('Member'); // Vai trò mặc định

    // Lấy danh sách thành viên
    const fetchMembers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await startupService.getStartupMembers(startupId);
            setMembers(Array.isArray(response) ? response : (response?.data || []));
        } catch (err) {
            setError(err);
            toast.error("Không thể tải danh sách thành viên");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [startupId]);

    // Lấy danh sách vai trò của startup
    const fetchRoles = useCallback(async () => {
        if (!startupId) return;

        setLoading(true);
        try {
            const response = await startupService.getRolesByStartup(startupId);
            setRoles(Array.isArray(response) ? response : (response?.data || []));
        } catch (err) {
            console.error("Không thể tải danh sách vai trò:", err);
        } finally {
            setLoading(false);
        }
    }, [startupId]);

    // Lấy quyền của vai trò
    const fetchPermissionsByRoleId = useCallback(async (roleId) => {
        setLoading(true);
        try {
            const response = await permissionService.getPermissionByRoleId(roleId);
            console.log("API response:", response);

            const permissions = response || {};
            setSelectedRolePermissions(permissions);
            return permissions;
        } catch (err) {
            console.error("Không thể tải quyền của vai trò:", err);
            toast.error("Không thể tải quyền của vai trò");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Mở modal quản lý quyền của vai trò
    const openPermissionsModal = async (roleId) => {
        setEditingRoleId(roleId);
        await fetchPermissionsByRoleId(roleId);
        setShowPermissionsModal(true);
    };

    // Cập nhật quyền cho vai trò
    const updatePermissions = async (permissions) => {
        if (!editingRoleId) {
            toast.error("Không tìm thấy ID của vai trò");
            return;
        }
        if (!permissions || !permissions.permissionId) {
            toast.error("Thiếu permissionId!");
            return;
        }


        setLoading(true);
        try {
            await permissionService.updatePermission({
                permissionId: permissions.permissionId,
                canManagePost: permissions.canManagePost || false,
                canManageCandidate: permissions.canManageCandidate || false,
                canManageChatRoom: permissions.canManageChatRoom || false,
                canManageMember: permissions.canManageMember || false,
                canManageMilestone: permissions.canManageMilestone || false
            });

            toast.success("Đã cập nhật quyền thành công");
            setShowPermissionsModal(false);
            fetchRoles(); // Refresh danh sách vai trò
        } catch (err) {
            toast.error("Không thể cập nhật quyền");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Tạo vai trò mới
    const createRole = async () => {
        if (!newRole.roleName?.trim()) {
            toast.warning("Vui lòng nhập tên vai trò");
            return;
        }

        setLoading(true);
        try {
            await startupService.createRole({
                startup_ID: startupId,
                roleName: newRole.roleName
            });

            toast.success("Đã tạo vai trò mới thành công");
            setShowAddRoleModal(false);
            setNewRole({ roleName: '' });
            fetchRoles(); // Cập nhật danh sách vai trò
        } catch (err) {
            toast.error("Không thể tạo vai trò mới");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Tải danh sách thành viên khi component mount
    useEffect(() => {
        if (startupId) {
            fetchMembers();
            fetchRoles();
        }
    }, [startupId, fetchMembers, fetchRoles]);

    // Debounce function để tránh gọi API quá nhiều lần
    const debounce = (func, delay) => {
        let timeoutId;
        return function (...args) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    // Tìm kiếm account theo email
    const searchAccountByEmail = async (email) => {
        setIsSearching(true);
        try {
            const res = await startupService.searchAccountByEmail(email);
            return res?.data || res || [];
        } catch (err) {
            console.error("Lỗi tìm kiếm:", err);
            return [];
        } finally {
            setIsSearching(false);
        }
    };

    // Xử lý tìm kiếm người dùng theo email với debounce
    const handleSearchChange = useCallback(
        debounce(async (value) => {
            if (!value || !value.trim()) {
                setSearchResults([]);
                return;
            }

            try {
                const res = await searchAccountByEmail(value);

                // Đảm bảo res là mảng
                const resultsArray = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);

                // Lọc kết quả để loại bỏ những thành viên đã trong startup
                const filteredResults = resultsArray.filter(user => {
                    if (!user || user.accountId === undefined) return false;

                    return !members.some(member =>
                        Number(member.accountId) === Number(user.accountId)
                    );
                });

                setSearchResults(filteredResults);
            } catch (err) {
                console.error("Lỗi tìm kiếm:", err);
                setSearchResults([]);
            }
        }, 300),
        [members]
    );

    // Xử lý khi thay đổi input email
    const handleEmailInputChange = (e) => {
        const value = e?.target?.value || '';
        setSearchEmail(value);
        handleSearchChange(value);
    };

    // Xử lý chọn người dùng từ kết quả tìm kiếm
    const handleSelectUser = (user) => {
        if (!user) return;
        setSelectedUser(user);
        setSearchEmail('');
        setSearchResults([]);
    };

    // Mời thành viên vào startup
    const inviteMember = async () => {
        if (!selectedUser) {
            toast.warning("Vui lòng chọn người dùng để mời");
            return;
        }

        // Tìm roleId từ roleName
        const roleToAssign = roles.find(role => role.roleName === newMemberRole);
        if (!roleToAssign) {
            toast.error("Không tìm thấy vai trò này");
            return;
        }

        // Lấy accountId của mình (người mời)
        const inviteBy = Number(getUserId());

        setLoading(true);
        try {
            await startupService.createInvite({
                account_ID: selectedUser.accountId,
                startup_ID: startupId,
                role_ID: roleToAssign.roleId,
                inviteBy: inviteBy
            });

            toast.success("Đã mời thành viên thành công");
            setShowAddMemberModal(false);
            setSelectedUser(null);
            setNewMemberRole('Member');
            fetchMembers(); // Refresh danh sách thành viên
        } catch (err) {
            toast.error("Không thể mời thành viên");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật vai trò của thành viên
    const updateMemberRole = async (memberId, newRoleName) => {
        setLoading(true);
        try {
            // Tìm roleId từ roleName
            const roleToAssign = roles.find(role => role.roleName === newRoleName);
            if (!roleToAssign) {
                toast.error("Không tìm thấy vai trò này");
                setLoading(false);
                return;
            }

            // Lấy accountId từ thành viên được chọn
            const accountId = selectedMember.accountId;
            if (!accountId) {
                toast.error("Không tìm thấy ID người dùng");
                setLoading(false);
                return;
            }

            await startupService.updateMemberRole({
                startupId,
                accountId,
                newRoleId: roleToAssign.roleId
            });

            toast.success("Đã cập nhật vai trò thành công");
            setShowEditMemberModal(false);
            setSelectedMember(null);
            fetchMembers(); // Refresh danh sách thành viên
        } catch (err) {
            toast.error("Không thể cập nhật vai trò");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Xóa thành viên khỏi startup
    const removeMember = async (accountId) => {
        if (!accountId) {
            toast.error("Không tìm thấy ID người dùng");
            return;
        }

        setLoading(true);
        try {
            await startupService.removeMemberFromStartup(startupId, accountId);

            toast.success("Đã xóa thành viên thành công");
            fetchMembers(); // Refresh danh sách thành viên
        } catch (err) {
            toast.error("Không thể xóa thành viên");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Thành viên rời khỏi startup
    const leaveStartup = async () => {
        if (!startupId) {
            toast.error("Không tìm thấy ID của startup");
            return;
        }

        const accountId = Number(getUserId());
        if (!accountId) {
            toast.error("Không tìm thấy ID người dùng");
            return;
        }

        setLoading(true);
        try {
            await startupService.outStartup(accountId);
            toast.success("Bạn đã rời khỏi startup thành công");

            // Chuyển hướng đến trang chính sau khi rời khỏi startup
            window.location.href = '/';
        } catch (err) {
            toast.error("Không thể rời khỏi startup");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật vai trò
    const updateRole = async (roleData) => {
        if (!roleData.roleName?.trim()) {
            toast.warning("Vui lòng nhập tên vai trò");
            return;
        }

        setLoading(true);
        try {
            await startupService.updateRole({
                role_ID: roleData.role_ID,
                roleName: roleData.roleName
            });

            toast.success("Đã cập nhật vai trò thành công");
            fetchRoles(); // Cập nhật danh sách vai trò
        } catch (err) {
            toast.error("Không thể cập nhật vai trò");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Xóa vai trò
    const deleteRole = async (roleId) => {
        // if (!window.confirm("Bạn có chắc chắn muốn xóa vai trò này không?")) {
        //     return;
        // }

        setLoading(true);
        try {
            await startupService.deleteRole(roleId);

            toast.success("Đã xóa vai trò thành công");
            fetchRoles(); // Cập nhật danh sách vai trò
        } catch (err) {
            toast.error("Không thể xóa vai trò");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return {
        // State
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
        selectedUser,
        newMemberRole,
        roles,
        newRole,
        selectedRolePermissions,
        showPermissionsModal,

        // Actions
        setSelectedMember,
        setShowAddMemberModal,
        setShowEditMemberModal,
        setShowAddRoleModal,
        setSearchEmail,
        setNewMemberRole,
        setNewRole,
        setSelectedUser,
        setShowPermissionsModal,
        setSelectedRolePermissions,

        // Methods
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
        leaveStartup,
        openPermissionsModal,
        updatePermissions,
        fetchPermissionsByRoleId
    };
} 