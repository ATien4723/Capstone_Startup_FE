import { useState, useEffect, useCallback } from 'react';
import { followUser, unfollowUser, getFollowing, getFollowers, searchAccounts } from '@/apis/accountService';
import { toast } from 'react-toastify';

const useFollow = (currentUserId) => {
    const [followLoading, setFollowLoading] = useState(false);
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingIds, setFollowingIds] = useState(new Set());
    const [processingId, setProcessingId] = useState(null);

    // State cho tìm kiếm tài khoản
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Fetch danh sách khi mount hoặc khi currentUserId thay đổi
    const fetchData = useCallback(async () => {
        if (!currentUserId) return;

        setLoading(true);
        try {
            const [followingData, followersData] = await Promise.all([
                getFollowing(currentUserId),
                getFollowers(currentUserId)
            ]);

            setFollowing(followingData || []);
            setFollowers(followersData || []);

            // Cập nhật set followingIds từ danh sách following
            if (followingData && followingData.length > 0) {
                const ids = new Set(followingData.map(user => user.accountId));
                setFollowingIds(ids);
            }
        } catch (e) {
            toast.error('Không thể tải danh sách follow!');
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Hàm follow
    const handleFollow = async (targetUserId) => {
        setProcessingId(targetUserId);
        setFollowLoading(true);
        try {
            await followUser(currentUserId, targetUserId);

            // Chỉ cập nhật followingIds để đổi trạng thái nút
            setFollowingIds(prev => {
                const updated = new Set(prev);
                updated.add(targetUserId);
                return updated;
            });

            // // Refetch lại danh sách
            // await fetchData();
            return true;
        } catch (error) {
            toast.error('Có lỗi khi thực hiện theo dõi!');
            return false;
        } finally {
            setFollowLoading(false);
            setProcessingId(null);
        }
    };

    // Hàm unfollow
    const handleUnfollow = async (targetUserId) => {
        setProcessingId(targetUserId);
        setFollowLoading(true);
        try {
            await unfollowUser(currentUserId, targetUserId);

            // Chỉ cập nhật followingIds để đổi trạng thái nút
            setFollowingIds(prev => {
                const updated = new Set(prev);
                updated.delete(targetUserId);
                return updated;
            });

            // Nếu đang ở tab following, cập nhật danh sách following
            // setFollowing(prev => prev.filter(user => user.accountId !== targetUserId));

            // Refetch lại danh sách
            // await fetchData();
            return true;
        } catch (error) {
            toast.error('Có lỗi khi hủy theo dõi!');
            return false;
        } finally {
            setFollowLoading(false);
            setProcessingId(null);
        }
    };

    // Kiểm tra xem có đang follow người dùng không
    const isFollowing = useCallback((userId) => {
        return followingIds.has(userId);
    }, [followingIds]);

    // Hàm tìm kiếm tài khoản
    const handleSearch = useCallback(async (searchText) => {
        if (!searchText || searchText.trim() === '') {
            setSearchResults([]);
            return [];
        }

        setSearchLoading(true);
        try {
            const response = await searchAccounts(searchText, currentUserId);
            console.log('Search API response:', response);

            // Xử lý cấu trúc dữ liệu phân trang từ API
            // API trả về {items: [...], totalCount, pageNumber, pageSize, totalPages, ...}
            let resultData = [];
            if (response && response.items && Array.isArray(response.items)) {
                resultData = response.items;
            } else if (Array.isArray(response)) {
                resultData = response;
            }

            // setSearchResults(resultData);
            // return resultData;

            // Lọc loại bỏ những người mà user đã follow (loại bỏ chính mình luôn)
            const filteredResults = resultData.filter(user => {
                console.log('user.accountId:', user.accountId, 'currentUserId:', currentUserId, 'equal:', user.accountId == currentUserId);
                return user.accountId != currentUserId && !followingIds.has(user.accountId);
            });

            setSearchResults(filteredResults);
            return filteredResults;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm tài khoản:', error);
            toast.error('Không thể tìm kiếm tài khoản. Vui lòng thử lại sau.');
            setSearchResults([]);
            return [];
        } finally {
            setSearchLoading(false);
        }
    }, [currentUserId, followingIds]);

    // Hàm debounce để tránh gửi quá nhiều request khi người dùng đang nhập
    const debouncedSearch = useCallback((callback, delay = 500) => {
        let timeoutId;
        return (searchText) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                callback(searchText);
            }, delay);
        };
    }, []);

    // Sử dụng debounce cho hàm tìm kiếm
    const handleSearchWithDebounce = useCallback(
        debouncedSearch(handleSearch),
        [handleSearch]
    );

    // Hàm xử lý thay đổi input tìm kiếm
    const handleSearchInputChange = (text) => {
        setSearchTerm(text);
        if (text && text.trim().length > 1) {
            handleSearchWithDebounce(text);
        } else {
            setSearchResults([]);
        }
    };

    return {
        handleFollow,
        handleUnfollow,
        followLoading,
        following,
        followers,
        loading,
        followingIds,
        processingId,
        isFollowing,
        refetchData: fetchData,
        // Thêm các hàm và state liên quan đến tìm kiếm
        searchTerm,
        setSearchTerm,
        searchResults,
        searchLoading,
        handleSearch,
        handleSearchInputChange
    };
};

export default useFollow; 