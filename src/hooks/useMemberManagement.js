import { useState, useEffect, useCallback } from 'react';
import * as startupService from '@/apis/startupService';
import { toast } from 'react-toastify';

export default function useMemberManagement(startupId) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showEditMemberModal, setShowEditMemberModal] = useState(false);

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

    // Tải danh sách thành viên khi component mount
    useEffect(() => {
        if (startupId) {
            fetchMembers();
        }
    }, [startupId, fetchMembers]);

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

        setLoading(true);
        try {
            await startupService.inviteUserToStartup({
                startupId,
                accountId: selectedUser.accountId,
                role: newMemberRole
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
    const updateMemberRole = async (memberId, newRole) => {
        setLoading(true);
        try {
            await startupService.updateMemberRole({
                startupId,
                memberId,
                role: newRole
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
    const removeMember = async (memberId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa thành viên này?")) {
            return;
        }

        setLoading(true);
        try {
            await startupService.removeMemberFromStartup(startupId, memberId);

            toast.success("Đã xóa thành viên thành công");
            fetchMembers(); // Refresh danh sách thành viên
        } catch (err) {
            toast.error("Không thể xóa thành viên");
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
        searchEmail,
        searchResults,
        isSearching,
        selectedUser,
        newMemberRole,

        // Actions
        setSelectedMember,
        setShowAddMemberModal,
        setShowEditMemberModal,
        setSearchEmail,
        setNewMemberRole,

        // Methods
        fetchMembers,
        handleEmailInputChange,
        handleSelectUser,
        inviteMember,
        updateMemberRole,
        removeMember
    };
} 