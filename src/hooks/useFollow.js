import { useState, useEffect } from 'react';
import { followUser, unfollowUser, getFollowing, getFollowers } from '@/apis/accountService';
import { toast } from 'react-toastify';

const useFollow = (currentUserId) => {
    const [followLoading, setFollowLoading] = useState(false);
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch danh sách khi mount hoặc khi currentUserId thay đổi
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [followingData, followersData] = await Promise.all([
                    getFollowing(currentUserId),
                    getFollowers(currentUserId)
                ]);
                setFollowing(followingData || []);
                setFollowers(followersData || []);
            } catch (e) {
                toast.error('Không thể tải danh sách follow!');
            } finally {
                setLoading(false);
            }
        };
        if (currentUserId) fetchData();
    }, [currentUserId]);

    // Hàm follow
    const handleFollow = async (targetUserId) => {
        setFollowLoading(true);
        try {
            await followUser(currentUserId, targetUserId);
            toast.success('Đã theo dõi!');
            // Refetch lại danh sách
            const followingData = await getFollowing(currentUserId);
            setFollowing(followingData || []);
            const followersData = await getFollowers(currentUserId);
            setFollowers(followersData || []);
            return true;
        } catch (error) {
            toast.error('Có lỗi khi thực hiện theo dõi!');
            return false;
        } finally {
            setFollowLoading(false);
        }
    };

    // Hàm unfollow
    const handleUnfollow = async (targetUserId) => {
        setFollowLoading(true);
        try {
            await unfollowUser(currentUserId, targetUserId);
            toast.success('Đã hủy theo dõi!');
            // Refetch lại danh sách
            const followingData = await getFollowing(currentUserId);
            setFollowing(followingData || []);
            const followersData = await getFollowers(currentUserId);
            setFollowers(followersData || []);
            return true;
        } catch (error) {
            toast.error('Có lỗi khi hủy theo dõi!');
            return false;
        } finally {
            setFollowLoading(false);
        }
    };

    return { handleFollow, handleUnfollow, followLoading, following, followers, loading };
};

export default useFollow; 