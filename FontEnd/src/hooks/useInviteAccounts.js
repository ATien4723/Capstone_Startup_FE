import { useState, useCallback } from 'react';
import * as startupService from '@/apis/startupService';
import { toast } from 'react-toastify';

export default function useInviteAccounts(currentUserId) {
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchEmail, setSearchEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
    const searchAccountByEmail = async (keyword) => {
        setLoading(true);
        setError(null);
        try {
            const res = await startupService.searchAccountByEmail(keyword);
            console.log('API response:', res); // Debug: Xem cấu trúc dữ liệu API trả về
            // Đảm bảo trả về dữ liệu đúng format
            return res?.data || res || [];
        } catch (err) {
            setError(err);
            console.error("Search API error:", err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Xử lý tìm kiếm người dùng theo email với debounce
    const handleSearchChange = useCallback(
        debounce(async (value) => {
            if (!value || !value.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const res = await searchAccountByEmail(value);

                // Đảm bảo res là mảng
                const resultsArray = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);

                // Lọc kết quả để loại bỏ currentUserId
                const filteredResults = resultsArray.filter(user => {
                    // Kiểm tra user và accountId tồn tại
                    if (!user || user.accountId === undefined) return false;

                    // So sánh dưới dạng số
                    const userAccountId = Number(user.accountId);
                    const currentId = Number(currentUserId);


                    return userAccountId !== currentId;
                });

                setSearchResults(filteredResults);
            } catch (err) {
                console.error("Search error:", err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300),
        [currentUserId]
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

        // Kiểm tra xem user đã được chọn chưa
        const isAlreadySelected = selectedUsers.some(
            selectedUser => selectedUser.accountId === user.accountId
        );

        if (!isAlreadySelected) {
            setSelectedUsers(prev => [...prev, user]);
        }

        setSearchEmail('');
        setSearchResults([]);
    };

    // Xử lý xóa người dùng đã chọn
    const handleRemoveUser = (accountId) => {
        setSelectedUsers(prev =>
            prev.filter(user => user.accountId !== accountId)
        );
    };

    // Xử lý gửi lời mời
    const handleSendInvites = async (startupId) => {
        if (selectedUsers.length === 0) {
            toast.warning("Please select at least one user to invite");
            return;
        }

        setLoading(true);
        try {
            // Thực hiện gọi API để gửi lời mời (cần triển khai trong startupService)
            // const invitePromises = selectedUsers.map(user => 
            //     startupService.inviteUserToStartup({
            //         startupId,
            //         accountId: user.accountId,
            //         email: user.email
            //     })
            // );
            // await Promise.all(invitePromises);

            toast.success("Invitations sent successfully");
            setSelectedUsers([]);
        } catch (err) {
            toast.error("Failed to send invitations");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return {
        // State
        searchResults,
        selectedUsers,
        searchEmail,
        isSearching,
        loading,
        error,

        // Actions
        setSearchEmail,
        setSelectedUsers,

        // Methods
        handleEmailInputChange,
        handleSelectUser,
        handleRemoveUser,
        handleSendInvites
    };
} 