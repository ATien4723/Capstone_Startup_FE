import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCamera, faChevronDown, faChevronUp, faMapMarkerAlt, faImage, faPaperclip, faEllipsisH, faFileAlt, faGlobe, faBriefcase, faHeart, faComment, faShareSquare, faSmile, faTrash, faReply } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faFacebook, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faHeart as farHeart, faComment as farComment, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getAccountInfo, getFollowing, getFollowers, updateBio } from '@/apis/accountService';
import {
    getPostsByAccountId,
    createPost,
    likePost,
    unlikePost,
    getPostLikeCount,
    getPostCommentCount,
    isPostLiked,
    createPostComment,
    getPostCommentsByPostId,
    getPostChildComments,
    updatePostComment,
    deletePostComment,
    likeComment,
    unlikeComment,
    isCommentLiked,
    getCommentLikeCount
} from '@/apis/postService';
import { toast } from 'react-toastify';
import { getRelativeTime } from '@/utils/dateUtils';
import PostMediaGrid from '@/components/PostMedia/PostMediaGrid';

// Modal component
const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg w-full max-w-lg shadow-lg relative p-6">
            <button
                className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
                onClick={onClose}
            >
                &times;
            </button>
            {children}
        </div>
    </div>
);

const PublicProfile = () => {
    const { id } = useParams();
    const [showPostModal, setShowPostModal] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newBio, setNewBio] = useState('');
    const [editBio, setEditBio] = useState(false);
    // Thêm state cho bài viết
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({
        content: '',
        files: []
    });
    const [postLikes, setPostLikes] = useState({});
    const [postComments, setPostComments] = useState({});
    // Gộp formData
    const [formData, setFormData] = useState({
        // Profile fields
        firstName: '',
        lastName: '',
        gender: '',
        dob: '',
        address: '',
        phoneNumber: '',
        avatarUrl: '',
        // Bio fields
        introTitle: '',
        position: '',
        workplace: '',
        facebookUrl: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        country: '',
    });
    const [activeButton, setActiveButton] = useState('all'); // 'all', 'media', 'bio'
    const [previousActiveButton, setPreviousActiveButton] = useState('all');
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observer = useRef();
    const pageSize = 10;
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [commentContent, setCommentContent] = useState('');
    const [openCommentPosts, setOpenCommentPosts] = useState([]);
    const [commentContents, setCommentContents] = useState({});

    // Thêm state mới cho các chức năng bình luận nâng cao
    const [editingComment, setEditingComment] = useState(null);
    const [replyingToComment, setReplyingToComment] = useState(null);
    const [commentLikes, setCommentLikes] = useState({});
    const [showChildComments, setShowChildComments] = useState({});
    const [childComments, setChildComments] = useState({});
    // Sử dụng cả postId và commentId làm key để đảm bảo mỗi form trả lời có state riêng biệt
    // Format: { 'postId-commentId': content }
    // Điều này giúp tránh xung đột khi nhiều bài viết có cùng commentId
    const [childCommentContents, setChildCommentContents] = useState({});

    // Thêm state để theo dõi bình luận con đang được trả lời
    const [replyingToChildComment, setReplyingToChildComment] = useState(null); // { postId, parentCommentId, childCommentId }

    const [commentUserInfos, setCommentUserInfos] = useState({});

    const [postCommentCounts, setPostCommentCounts] = useState({});

    // Thêm state để theo dõi việc hiển thị phản hồi của bình luận con
    const [showChildReplies, setShowChildReplies] = useState({});
    const [childReplies, setChildReplies] = useState({});

    // Thêm state mới để lưu trữ số lượng phản hồi
    const [commentReplyCounts, setCommentReplyCounts] = useState({});

    // Thêm state để lưu trữ số lượng phản hồi cho bình luận con
    const [childReplyCounts, setChildReplyCounts] = useState({});

    // Hàm để lấy số lượng phản hồi cho một bình luận
    const fetchCommentReplyCount = async (commentId) => {
        try {
            // Có thể sử dụng API riêng để lấy số lượng nếu có
            // Hoặc lấy danh sách phản hồi và đếm số lượng
            const replies = await getPostChildComments(commentId);

            let replyCount = 0;
            if (Array.isArray(replies)) {
                replyCount = replies.length;
            } else if (replies && Array.isArray(replies.items)) {
                replyCount = replies.items.length;
            }

            setCommentReplyCounts(prev => ({
                ...prev,
                [commentId]: replyCount
            }));

            return replyCount;
        } catch (error) {
            console.error('Error fetching reply count:', error);
            return 0;
        }
    };

    // Hàm để lấy số lượng phản hồi cho bình luận con
    const fetchChildReplyCount = async (childCommentId) => {
        try {
            const replies = await getPostChildComments(childCommentId);

            let replyCount = 0;
            if (Array.isArray(replies)) {
                replyCount = replies.length;
            } else if (replies && Array.isArray(replies.items)) {
                replyCount = replies.items.length;
            }

            setChildReplyCounts(prev => ({
                ...prev,
                [childCommentId]: replyCount
            }));

            return replyCount;
        } catch (error) {
            console.error('Error fetching child reply count:', error);
            return 0;
        }
    };

    // State cho xử lý lỗi trong modal
    const [postError, setPostError] = useState('');
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                const [accountInfo, followingData, followersData, postsData] = await Promise.all([
                    getAccountInfo(id),
                    getFollowing(id),
                    getFollowers(id),
                    getPostsByAccountId(id)
                ]);
                if (!accountInfo || !postsData) {
                    toast.error('Failed to load profile data');
                    setIsLoading(false);
                    return;
                }
                setProfileData(accountInfo);
                setFollowing(followingData || []);
                setFollowers(followersData || []);
                setPosts(postsData.items || []);
                setFormData({
                    firstName: accountInfo?.firstName || '',
                    lastName: accountInfo?.lastName || '',
                    gender: accountInfo?.gender || '',
                    dob: accountInfo?.dob || '',
                    address: accountInfo?.address || '',
                    phoneNumber: accountInfo?.phoneNumber || '',
                    avatarUrl: accountInfo?.avatarUrl || '',
                    introTitle: accountInfo?.introTitle || '',
                    position: accountInfo?.position || '',
                    workplace: accountInfo?.workplace || '',
                    facebookUrl: accountInfo?.facebookUrl || '',
                    linkedinUrl: accountInfo?.linkedinUrl || '',
                    githubUrl: accountInfo?.githubUrl || '',
                    portfolioUrl: accountInfo?.portfolioUrl || '',
                    country: accountInfo?.country || '',
                });
                if (postsData.items && Array.isArray(postsData.items)) {
                    postsData.items.forEach(async (post) => {
                        const [likeCount, comments] = await Promise.all([
                            getPostLikeCount(post.postId),
                            getPostCommentsByPostId(post.postId)
                        ]);
                        setPostLikes(prev => ({
                            ...prev,
                            [post.postId]: likeCount
                        }));
                        setPostComments(prev => ({
                            ...prev,
                            [post.postId]: comments || []
                        }));
                        const commentCount = await getPostCommentCount(post.postId);
                        setPostCommentCounts(prev => ({
                            ...prev,
                            [post.postId]: commentCount
                        }));

                    });
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProfileData();
        }
    }, [id]);

    // Chỉ lấy các trường bio để gửi API
    const getBioFields = (data) => {
        const { introTitle, position, workplace, facebookUrl, linkedinUrl, githubUrl, portfolioUrl, country } = data;
        return { introTitle, position, workplace, facebookUrl, linkedinUrl, githubUrl, portfolioUrl, country };
    };


    // Hàm lấy thông tin người dùng từ accountId
    const fetchCommentUserInfo = async (accountId) => {
        try {
            // Kiểm tra nếu đã có thông tin người dùng trong cache
            if (commentUserInfos[accountId]) {
                return commentUserInfos[accountId];
            }

            // Gọi API để lấy thông tin người dùng
            const userInfo = await getAccountInfo(accountId);

            // Lưu thông tin người dùng vào cache
            setCommentUserInfos(prev => ({
                ...prev,
                [accountId]: userInfo
            }));

            return userInfo;
        } catch (error) {
            console.error('Error fetching user info:', error);
            return null;
        }
    };


    const handleUpdateBio = async () => {
        try {
            const updatedProfile = await updateBio(id, getBioFields(formData));
            setProfileData(updatedProfile);
            toast.success('Bio updated successfully');
        } catch (error) {
            toast.error('Failed to update bio');
        }
    };


    // Hàm xử lý tạo bài viết mới
    const handleCreatePost = async () => {
        try {
            setIsCreatingPost(true);
            setPostError(''); // Reset lỗi trước đó

            const formData = new FormData();
            formData.append('content', newPost.content);
            newPost.files.forEach(file => {
                formData.append('MediaFiles', file);
            });
            formData.append('accountId', id);

            // Hiển thị thông báo đang xử lý
            toast.info('Đang tạo bài viết...');

            // Tạo post mới
            const result = await createPost(formData);

            // Reset form trước khi refresh
            setNewPost({ content: '', files: [] });
            setShowPostModal(false);
            setPostError('');

            // Gọi API để lấy danh sách posts mới nhất
            const postsData = await getPostsByAccountId(id, 1, pageSize);

            if (postsData && Array.isArray(postsData.items)) {
                console.log('Refreshed posts:', postsData.items);

                // Cập nhật state với danh sách posts mới
                setPosts(postsData.items);

                // Lấy thông tin likes và comments cho mỗi post mới
                for (const post of postsData.items) {
                    try {
                        const [likeCount, comments] = await Promise.all([
                            getPostLikeCount(post.postId),
                            getPostCommentsByPostId(post.postId)
                        ]);

                        setPostLikes(prev => ({
                            ...prev,
                            [post.postId]: likeCount
                        }));

                        setPostComments(prev => ({
                            ...prev,
                            [post.postId]: comments || []
                        }));
                    } catch (error) {
                        console.error('Error fetching post details:', error);
                    }
                }
            }

            toast.success('Bài viết đã được tạo thành công');
        } catch (error) {
            console.error('Error creating post:', error);

            // Xử lý lỗi từ API
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                if (status === 400 && errorData) {
                    // Hiển thị lỗi trong modal thay vì toast
                    setPostError(errorData.message || 'Bài viết vi phạm nguyên tắc cộng đồng');
                } else {
                    setPostError('Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại.');
                }
            } else {
                setPostError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
            }

            // Vẫn hiển thị toast để thông báo tổng quát
            toast.error('Không thể tạo bài viết');
        } finally {
            setIsCreatingPost(false);
        }
    };

    // Hàm xử lý thích/bỏ thích bài viết
    const handleLikePost = async (postId) => {
        try {
            const likeData = {
                postId,
                accountId: id
            };

            const isLiked = await isPostLiked(likeData);
            if (isLiked) {
                await unlikePost(likeData);
            } else {
                await likePost(likeData);
            }
            // Sau khi like/unlike, cập nhật lại số lượng like từ backend
            const likeCount = await getPostLikeCount(postId);
            setPostLikes(prev => ({
                ...prev,
                [postId]: likeCount
            }));
        } catch (error) {
            toast.error('Failed to update like');
            console.error('Error updating like:', error);
        }
    };

    // Hàm xử lý upload file
    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        setNewPost(prev => ({
            ...prev,
            files: [...prev.files, ...files]
        }));
    };

    // Hàm fetch posts với phân trang
    const fetchPosts = async (page) => {
        try {
            const response = await getPostsByAccountId(id, page, pageSize);
            if (response && response.items) {
                if (page === 1) {
                    setPosts(response.items);
                } else {
                    setPosts(prevPosts => [...prevPosts, ...response.items]);
                }
                setHasMore(response.items.length === pageSize);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            setHasMore(false);
        }
    };

    // Hàm load more posts
    const loadMorePosts = useCallback(() => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        setPageNumber(prev => prev + 1);
    }, [isLoadingMore, hasMore]);

    // Observer cho infinite scroll
    const lastPostElementRef = useCallback(node => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMorePosts();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoadingMore, hasMore, loadMorePosts]);

    // Fetch posts khi component mount hoặc pageNumber thay đổi
    useEffect(() => {
        if (pageNumber === 1) {
            fetchPosts(1);
        } else {
            fetchPosts(pageNumber).finally(() => {
                setIsLoadingMore(false);
            });
        }
    }, [pageNumber, id]);

    // Thêm comment giải thích luồng dữ liệu bình luận
    // Hàm lấy comments của một bài viết - Được gọi khi trang được tải hoặc khi người dùng nhấn vào nút bình luận
    // Dữ liệu bình luận được lấy từ API endpoint: GetPostCommentsByPostId
    const fetchPostComments = async (postId) => {
        try {
            console.log('Đang lấy bình luận cho bài viết ID:', postId);
            const response = await getPostCommentsByPostId(postId, 1, 20);
            console.log('Response từ API bình luận:', response);

            // Xử lý dữ liệu bình luận
            let comments = [];
            if (Array.isArray(response)) {
                // Nếu response là mảng trực tiếp
                comments = response;
            } else if (response && Array.isArray(response.items)) {
                // Nếu response có cấu trúc phân trang với items là mảng
                comments = response.items;
            } else if (response && typeof response === 'object') {
                // Nếu response là một đối tượng khác
                console.log('Cấu trúc response không phải mảng:', response);
                comments = [];
            }

            // Cập nhật state trước để hiển thị bình luận
            setPostComments(prev => ({
                ...prev,
                [postId]: comments
            }));

            // Lấy thông tin người dùng và số lượng phản hồi cho mỗi bình luận
            if (comments && comments.length > 0) {
                await Promise.all(comments.map(async (comment) => {
                    if (comment && comment.accountId && comment.postcommentId) {
                        // Lấy thông tin người dùng
                        const userInfo = await fetchCommentUserInfo(comment.accountId);
                        comment.userInfo = userInfo;

                        // Lấy số lượng phản hồi
                        await fetchCommentReplyCount(comment.postcommentId);

                        // Tải trước bình luận con và số lượng phản hồi của chúng
                        const childComments = await getPostChildComments(comment.postcommentId);
                        let childCommentsArray = [];
                        if (Array.isArray(childComments)) {
                            childCommentsArray = childComments;
                        } else if (childComments && Array.isArray(childComments.items)) {
                            childCommentsArray = childComments.items;
                        }

                        // Lưu bình luận con vào state
                        setChildComments(prev => ({
                            ...prev,
                            [comment.postcommentId]: childCommentsArray
                        }));

                        // Lấy số lượng phản hồi cho mỗi bình luận con
                        await Promise.all(childCommentsArray.map(async (childComment) => {
                            if (childComment && childComment.postcommentId) {
                                await fetchChildReplyCount(childComment.postcommentId);
                            }
                        }));
                    }
                }));
            }
        } catch (error) {
            console.error('Lỗi khi lấy bình luận:', error);
            toast.error('Không thể lấy bình luận');
        }
    };

    // Hàm xử lý tạo comment
    const handleCreateComment = async (postId, content) => {
        if (!content.trim()) {
            toast.error('Vui lòng nhập nội dung bình luận');
            return;
        }

        try {
            console.log('Bắt đầu tạo bình luận cho bài viết ID:', postId);

            // Lấy accountId từ profileData
            const accountId = profileData.accountId;

            const commentData = {
                postId: postId,
                accountId: accountId,
                content: content,
                parentCommentId: null
            };

            console.log('Dữ liệu bình luận gửi đi:', commentData);

            // Gửi request tạo comment
            const createResponse = await createPostComment(commentData);
            console.log('Kết quả tạo bình luận:', createResponse);

            console.log('Đã gửi bình luận thành công, đang lấy danh sách bình luận mới');

            // Đợi một chút để đảm bảo dữ liệu đã được lưu vào database
            await new Promise(resolve => setTimeout(resolve, 500));

            // Lấy lại danh sách comments mới
            await fetchPostComments(postId);

            // Reset input
            setCommentContents(prev => ({
                ...prev,
                [postId]: ''
            }));

            // Đảm bảo bài viết đang mở phần bình luận
            if (!openCommentPosts.includes(postId)) {
                setOpenCommentPosts(prev => [...prev, postId]);
            }

            toast.success('Bình luận đã được thêm thành công');
        } catch (error) {
            toast.error('Không thể thêm bình luận');
            console.error('Error creating comment:', error);
        }
    };

    // Hàm này để toggle comment section
    const toggleCommentSection = (postId) => {
        console.log('Toggle comment section cho bài viết ID:', postId);
        setOpenCommentPosts(prev => {
            const isOpen = prev.includes(postId);
            console.log('Trạng thái hiện tại của phần bình luận:', isOpen ? 'đang mở' : 'đang đóng');

            if (isOpen) {
                // Nếu đang mở, đóng lại
                return prev.filter(id => id !== postId);
            } else {
                // Nếu đang đóng, mở ra và fetch comments
                console.log('Mở phần bình luận và lấy dữ liệu');
                fetchPostComments(postId);
                return [...prev, postId];
            }
        });
    };

    // Hàm này để cập nhật nội dung comment cho từng bài viết
    const updateCommentContent = (postId, content) => {
        setCommentContents(prev => ({
            ...prev,
            [postId]: content
        }));
    };

    // Hàm lấy bình luận con
    const fetchChildComments = async (parentCommentId) => {
        try {
            console.log('Đang lấy bình luận con cho bình luận gốc ID:', parentCommentId);
            const response = await getPostChildComments(parentCommentId);
            console.log('Bình luận con nhận được:', response);

            // Xác định dữ liệu bình luận con
            let comments = [];
            if (Array.isArray(response)) {
                comments = response;
            } else if (response && Array.isArray(response.items)) {
                comments = response.items;
            } else if (response && typeof response === 'object') {
                console.log('Cấu trúc response không phải mảng:', response);
                comments = [];
            }

            console.log('Dữ liệu bình luận con sau khi xử lý:', comments);

            // Cập nhật state trước để hiển thị bình luận con
            setChildComments(prev => ({
                ...prev,
                [parentCommentId]: comments
            }));

            // Lấy thông tin người dùng và số lượng phản hồi cho mỗi bình luận con
            if (comments && comments.length > 0) {
                // Sử dụng Promise.all để tải song song thông tin người dùng và số lượng phản hồi
                await Promise.all(comments.map(async (comment) => {
                    if (comment && comment.accountId && comment.postcommentId) {
                        // Lấy thông tin người dùng
                        const userInfo = await fetchCommentUserInfo(comment.accountId);
                        comment.userInfo = userInfo;

                        // Lấy số lượng phản hồi cho bình luận con
                        await fetchChildReplyCount(comment.postcommentId);
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching child comments:', error);
            setChildComments(prev => ({
                ...prev,
                [parentCommentId]: []
            }));
        }
    };

    // Hàm toggle hiển thị bình luận con
    const toggleChildComments = (commentId) => {
        setShowChildComments(prev => {
            const newState = { ...prev };
            newState[commentId] = !newState[commentId];

            // Nếu mở ra, fetch bình luận con
            if (newState[commentId]) {
                fetchChildComments(commentId);
            }

            return newState;
        });
    };

    // Hàm xử lý thích/bỏ thích bình luận
    const handleLikeComment = async (postcommentId) => {
        try {
            const isLiked = await isCommentLiked(postcommentId, id);
            if (isLiked) {
                await unlikeComment(postcommentId, id);
            } else {
                await likeComment(postcommentId, id);
            }

            // Cập nhật số lượng like
            const likeCount = await getCommentLikeCount(postcommentId);
            setCommentLikes(prev => ({
                ...prev,
                [postcommentId]: likeCount
            }));
        } catch (error) {
            toast.error('Không thể cập nhật trạng thái thích bình luận');
            console.error('Error liking/unliking comment:', error);
        }
    };

    // Hàm xử lý xóa bình luận
    const handleDeleteComment = async (commentId, postId) => {
        try {
            await deletePostComment(commentId);
            toast.success('Đã xóa bình luận thành công');

            // Cập nhật lại danh sách bình luận
            await fetchPostComments(postId);

            // Nếu bình luận bị xóa là bình luận con, cập nhật lại số lượng phản hồi của bình luận cha
            // Lưu ý: Cần biết parentCommentId của bình luận bị xóa
            // Có thể lưu trữ thông tin này trong state hoặc lấy từ API

            // Ví dụ: Nếu có thông tin parentCommentId
            // if (parentCommentId) {
            //     await fetchCommentReplyCount(parentCommentId);
            // }
        } catch (error) {
            toast.error('Không thể xóa bình luận');
            console.error('Error deleting comment:', error);
        }
    };

    // Hàm xử lý cập nhật bình luận
    const handleUpdateComment = async (postcommentId, postId, content) => {
        if (!content.trim()) {
            toast.error('Nội dung bình luận không được để trống');
            return;
        }

        try {
            await updatePostComment({ commentId: postcommentId, content });
            toast.success('Đã cập nhật bình luận thành công');

            // Cập nhật lại danh sách bình luận
            const updatedComments = await getPostCommentsByPostId(postId);
            setPostComments(prev => ({
                ...prev,
                [postId]: updatedComments || []
            }));

            // Đóng form chỉnh sửa
            setEditingComment(null);
        } catch (error) {
            toast.error('Không thể cập nhật bình luận');
            console.error('Error updating comment:', error);
        }
    };

    // Hàm xử lý trả lời bình luận
    const handleReplyComment = async (postId, postcommentId, content) => {
        if (!content.trim()) {
            toast.error('Nội dung bình luận không được để trống');
            return;
        }

        try {
            const commentData = {
                postId: postId,
                accountId: id,
                content: content,
                parentCommentId: postcommentId // Sử dụng postcommentId làm parentCommentId để xác định bình luận gốc
            };

            console.log('Dữ liệu gửi đi:', commentData);

            await createPostComment(commentData);
            toast.success('Đã trả lời bình luận thành công');

            // Cập nhật lại danh sách bình luận con
            fetchChildComments(postcommentId);

            // Cập nhật lại số lượng phản hồi
            await fetchCommentReplyCount(postcommentId);

            // Cập nhật lại danh sách bình luận chính
            await fetchPostComments(postId);

            // Đóng form trả lời và xóa nội dung
            setReplyingToComment(null);
            setChildCommentContents(prev => ({
                ...prev,
                [`${postId}-${postcommentId}`]: ''
            }));
        } catch (error) {
            toast.error('Không thể trả lời bình luận');
            console.error('Error replying to comment:', error);
        }
    };

    // Hàm xử lý trả lời bình luận con
    const handleReplyToChildComment = async (postId, parentCommentId, childCommentId, content) => {
        if (!content.trim()) {
            toast.error('Nội dung bình luận không được để trống');
            return;
        }

        try {
            console.log(`Đang trả lời bình luận con: postId=${postId}, childCommentId=${childCommentId}`);

            const commentData = {
                postId: postId,
                accountId: id,
                content: content,
                parentCommentId: childCommentId // Sử dụng childCommentId làm parentCommentId để trả lời trực tiếp bình luận con
            };

            console.log('Dữ liệu gửi đi:', commentData);

            await createPostComment(commentData);
            toast.success('Đã trả lời bình luận thành công');

            // Cập nhật lại danh sách phản hồi của bình luận con
            if (showChildReplies[childCommentId]) {
                fetchChildReplies(childCommentId);
            }

            // Cập nhật lại số lượng phản hồi cho bình luận con
            await fetchChildReplyCount(childCommentId);

            // Cập nhật lại danh sách bình luận con
            fetchChildComments(parentCommentId);

            // Đóng form trả lời và xóa nội dung
            setReplyingToChildComment(null);
            setChildCommentContents(prev => ({
                ...prev,
                [`${postId}-${childCommentId}`]: ''
            }));
        } catch (error) {
            toast.error('Không thể trả lời bình luận');
            console.error('Error replying to child comment:', error);
        }
    };

    // Thêm hàm mới để trả lời bình luận con nhưng gắn vào bình luận cha
    const handleReplyToChildWithParent = async (postId, childComment, content) => {
        // Kiểm tra kỹ hơn tham số đầu vào
        // console.log("postId:", postId);
        // console.log("childComment:", childComment);
        // console.log("content:", content);

        if (!content) {
            toast.error('Nội dung bình luận không được để trống');
            return;
        }

        if (!content.trim()) {
            toast.error('Nội dung bình luận không được để trống');
            return;
        }

        try {
            // Lấy parentCommentId từ bình luận con
            const parentCommentId = childComment.parentCommentId;

            if (!parentCommentId) {
                toast.error('Không tìm thấy bình luận cha');
                return;
            }

            console.log(`Đang trả lời bình luận con: postId=${postId}, childCommentId=${childComment.postcommentId}`);
            console.log(`Sẽ gắn vào bình luận cha: parentCommentId=${parentCommentId}`);

            const commentData = {
                postId: postId,
                accountId: id,
                content: content,
                // Sử dụng parentCommentId của childComment làm parentCommentId
                parentCommentId: parentCommentId
            };

            console.log('Dữ liệu gửi đi (gắn vào bình luận cha):', commentData);

            await createPostComment(commentData);
            toast.success('Đã trả lời bình luận thành công');

            // Cập nhật lại danh sách bình luận con của bình luận cha
            fetchChildComments(parentCommentId);

            // Cập nhật lại số lượng phản hồi cho bình luận cha
            await fetchCommentReplyCount(parentCommentId);

            // Đóng form trả lời và xóa nội dung
            setReplyingToChildComment(null);
            setChildCommentContents(prev => ({
                ...prev,
                [`${postId}-${childComment.postcommentId}`]: ''
            }));
        } catch (error) {
            toast.error('Không thể trả lời bình luận');
            console.error('Error replying to child comment with parent:', error);
        }
    };

    // Cập nhật useEffect để tự động tải bình luận khi tải trang
    useEffect(() => {
        if (posts && posts.length > 0) {
            posts.forEach(async (post) => {
                try {
                    // Lấy số lượng like
                    const likeCount = await getPostLikeCount(post.postId);
                    setPostLikes(prev => ({
                        ...prev,
                        [post.postId]: likeCount
                    }));

                    // Lấy bình luận cho mỗi bài viết nhưng không tự động mở
                    await fetchPostComments(post.postId);

                    // Lấy số lượng like cho mỗi bình luận
                    if (postComments[post.postId] && Array.isArray(postComments[post.postId]) && postComments[post.postId].length > 0) {
                        postComments[post.postId].forEach(async (comment) => {
                            const likeCount = await getCommentLikeCount(comment.postcommentId);
                            setCommentLikes(prev => ({
                                ...prev,
                                [comment.postcommentId]: likeCount
                            }));
                        });
                    }
                } catch (error) {
                    console.error('Error fetching post details:', error);
                }
            });
        }
    }, [posts]);

    // Hàm toggle hiển thị phản hồi của bình luận con
    const toggleChildReplies = async (childCommentId) => {
        setShowChildReplies(prev => {
            const newState = { ...prev };
            newState[childCommentId] = !newState[childCommentId];

            // Nếu mở ra, fetch phản hồi của bình luận con
            if (newState[childCommentId]) {
                fetchChildReplies(childCommentId);
            }
            // Không xóa dữ liệu khi ẩn phản hồi, chỉ ẩn hiển thị

            return newState;
        });
    };

    // Hàm lấy phản hồi của bình luận con
    const fetchChildReplies = async (childCommentId) => {
        try {
            console.log('Đang lấy phản hồi cho bình luận con ID:', childCommentId);
            const response = await getPostChildComments(childCommentId);

            // Xác định dữ liệu phản hồi
            let replies = [];
            if (Array.isArray(response)) {
                replies = response;
            } else if (response && Array.isArray(response.items)) {
                replies = response.items;
            }

            console.log('Phản hồi của bình luận con:', replies);

            // Cập nhật số lượng phản hồi
            setChildReplyCounts(prev => ({
                ...prev,
                [childCommentId]: replies.length
            }));

            // Lấy thông tin người dùng cho mỗi phản hồi
            if (replies && replies.length > 0) {
                for (const reply of replies) {
                    if (reply && reply.accountId) {
                        const userInfo = await fetchCommentUserInfo(reply.accountId);
                        reply.userInfo = userInfo;
                    }
                }
            }

            setChildReplies(prev => ({
                ...prev,
                [childCommentId]: replies
            }));
        } catch (error) {
            console.error('Error fetching child replies:', error);
            setChildReplies(prev => ({
                ...prev,
                [childCommentId]: []
            }));
        }
    };

    // Thêm một hàm mới để tải tất cả số lượng phản hồi
    const preloadAllReplyCounts = async () => {
        try {
            console.log('Đang tải trước tất cả số lượng phản hồi...');

            // Lặp qua tất cả bài viết
            for (const post of posts) {
                if (!post.postId) continue;

                // Lấy tất cả bình luận của bài viết
                const comments = await getPostCommentsByPostId(post.postId, 1, 100);
                let commentList = [];

                if (Array.isArray(comments)) {
                    commentList = comments;
                } else if (comments && Array.isArray(comments.items)) {
                    commentList = comments.items;
                }

                // Lưu bình luận vào state
                setPostComments(prev => ({
                    ...prev,
                    [post.postId]: commentList
                }));

                // Lấy số lượng phản hồi cho mỗi bình luận
                for (const comment of commentList) {
                    if (!comment.postcommentId) continue;

                    // Lấy số lượng phản hồi cho bình luận chính
                    const childComments = await getPostChildComments(comment.postcommentId);
                    let childList = [];

                    if (Array.isArray(childComments)) {
                        childList = childComments;
                    } else if (childComments && Array.isArray(childComments.items)) {
                        childList = childComments.items;
                    }

                    // Lưu số lượng phản hồi vào state
                    setCommentReplyCounts(prev => ({
                        ...prev,
                        [comment.postcommentId]: childList.length
                    }));

                    // Lưu bình luận con vào state
                    setChildComments(prev => ({
                        ...prev,
                        [comment.postcommentId]: childList
                    }));

                    // Lấy số lượng phản hồi cho mỗi bình luận con
                    for (const childComment of childList) {
                        if (!childComment.postcommentId) continue;

                        const childReplies = await getPostChildComments(childComment.postcommentId);
                        let replyList = [];

                        if (Array.isArray(childReplies)) {
                            replyList = childReplies;
                        } else if (childReplies && Array.isArray(childReplies.items)) {
                            replyList = childReplies.items;
                        }

                        // Lưu số lượng phản hồi vào state
                        setChildReplyCounts(prev => ({
                            ...prev,
                            [childComment.postcommentId]: replyList.length
                        }));
                    }
                }
            }

            console.log('Đã tải xong tất cả số lượng phản hồi');
        } catch (error) {
            console.error('Lỗi khi tải trước số lượng phản hồi:', error);
        }
    };

    // Gọi hàm preloadAllReplyCounts khi posts thay đổi
    useEffect(() => {
        if (posts && posts.length > 0) {
            preloadAllReplyCounts();
        }
    }, [posts]);


    const GetChildReplyCount = ({ childCommentId, showChildReplies, toggleChildReplies }) => {
        const [count, setCount] = useState(null);

        useEffect(() => {
            const fetchCount = async () => {
                try {
                    const replies = await getPostChildComments(childCommentId);
                    let replyCount = 0;

                    if (Array.isArray(replies)) {
                        replyCount = replies.length;
                    } else if (replies && Array.isArray(replies.items)) {
                        replyCount = replies.items.length;
                    }

                    setCount(replyCount);
                } catch (error) {
                    console.error('Error fetching reply count:', error);
                    setCount(0);
                }
            };

            fetchCount();
        }, [childCommentId]);

        return (
            <button
                className="hover:underline flex items-center gap-1"
                onClick={() => toggleChildReplies(childCommentId)}
            >
                {showChildReplies[childCommentId] ? 'Ẩn phản hồi' : 'Xem phản hồi'}
                <span className="ml-1 text-gray-500 font-normal">
                    ({count !== null ? count : '...'})
                </span>
            </button>
        );
    };


    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Profile not found</h2>
                    <p className="text-gray-600 mt-2">The profile you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />

            {/* Cover Image Section */}
            <div className="container mb-2 mx-auto rounded-bl-lg rounded-br-lg relative h-60 bg-gray-400 rounded-b-lg mt-4">
                <img
                    src={profileData.coverImage || "aaaa"}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                {/* Gradient shadow bottom */}
                {/* <div className="absolute left-0 right-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div> */}
                {/* Edit Cover Button */}
                <button className="absolute bottom-4 right-8 bg-white px-4 py-2 rounded-lg text-gray-800 font-medium shadow flex items-center gap-2 hover:bg-gray-100 z-10">
                    <FontAwesomeIcon icon={faCamera} /> Edit cover
                </button>
            </div>

            {/* Profile Info under cover */}
            {/* Main Content Grid */}
            <div className="container mx-auto mb-5 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="text-center p-4 relative">
                                <div className="flex justify-center">
                                    <div className="-mt-20">
                                        <div className="relative">
                                            <img
                                                src={profileData.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                alt="Avatar"
                                                className="w-40 h-40 rounded-full border-4 border-white bg-gray-200 object-cover shadow"
                                            />
                                            {/* <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full text-gray-700 shadow hover:bg-gray-100">
                                                <FontAwesomeIcon icon={faCamera} />
                                            </button> */}
                                        </div>
                                    </div>
                                </div>
                                <h4 className="font-bold text-xl">{profileData.firstName}</h4>
                                <p className="text-gray-600 mb-3">{profileData.jobTitle}</p>
                                <p className="text-gray-600 mb-3">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> {profileData.position}
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center mb-4">
                                    <button
                                        className={`px-6 py-2 font-semibold rounded-full shadow-sm focus:outline-none ${activeButton === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : 'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                                            }`}
                                        onClick={() => setActiveButton('all')}
                                    >
                                        All Post
                                    </button>
                                    <button
                                        className={`px-6 py-2 font-semibold rounded-full shadow-sm focus:outline-none ${activeButton === 'media'
                                            ? 'bg-blue-600 text-white'
                                            : 'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                                            }`}
                                        onClick={() => setActiveButton('media')}
                                    >
                                        Media
                                    </button>
                                    <button
                                        className={`px-6 py-2 font-semibold rounded-full shadow-sm focus:outline-none ${activeButton === 'bio'
                                            ? 'bg-blue-600 text-white'
                                            : 'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50'
                                            }`}
                                        onClick={() => {
                                            setPreviousActiveButton(activeButton);
                                            setActiveButton('bio');
                                            setEditBio(true);
                                        }}
                                    >
                                        Update Bio
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 mb-4">
                                    <div className="text-center">
                                        <h6 className="font-semibold">Posts</h6>
                                        <span>{profileData.postCount || 0}</span>
                                    </div>
                                    <div className="text-center">
                                        <h6 className="font-semibold">Following</h6>
                                        <span>{following.length}</span>
                                    </div>
                                    <div className="text-center">
                                        <h6 className="font-semibold">Followers</h6>
                                        <span>{followers.length}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {profileData.facebookUrl && (
                                        <a href={profileData.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faFacebook} className="mr-2" /> Facebook
                                        </a>
                                    )}
                                    {profileData.githubUrl && (
                                        <Link to={profileData.githubUrl} target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faGithub} className="mr-2" /> Github
                                        </Link>
                                    )}
                                    {profileData.portfolioUrl && (
                                        <Link to={profileData.portfolioUrl} target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faBriefcase} className="mr-2" /> Portfolio
                                        </Link>
                                    )}
                                    {profileData.linkedinUrl && (
                                        <Link to={profileData.linkedinUrl} target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faLinkedin} className="mr-2" /> LinkedIn
                                        </Link>
                                    )}
                                </div>
                                <div className="mt-4 text-left">
                                    <div className="flex justify-between items-center mb-3">
                                        <h6 className="font-semibold">About Me</h6>
                                    </div>
                                    <p className="text-gray-600">{profileData.introTitle}</p>
                                </div>
                                {/* Update Bio Button and Modal */}
                                <div>
                                    {editBio && (
                                        <Modal onClose={() => {
                                            setEditBio(false);
                                            setActiveButton(previousActiveButton);
                                        }}>
                                            <h2 className="text-xl font-bold mb-4">Update Bio</h2>
                                            <input value={formData.introTitle} onChange={e => setFormData(f => ({ ...f, introTitle: e.target.value }))} placeholder="Intro Title" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.position} onChange={e => setFormData(f => ({ ...f, position: e.target.value }))} placeholder="Position" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.workplace} onChange={e => setFormData(f => ({ ...f, workplace: e.target.value }))} placeholder="Workplace" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.facebookUrl} onChange={e => setFormData(f => ({ ...f, facebookUrl: e.target.value }))} placeholder="Facebook URL" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.linkedinUrl} onChange={e => setFormData(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="LinkedIn URL" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.githubUrl} onChange={e => setFormData(f => ({ ...f, githubUrl: e.target.value }))} placeholder="GitHub URL" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.portfolioUrl} onChange={e => setFormData(f => ({ ...f, portfolioUrl: e.target.value }))} placeholder="Portfolio URL" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.country} onChange={e => setFormData(f => ({ ...f, country: e.target.value }))} placeholder="Country" className="input mb-2 w-full border p-2 rounded" />
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                                                    onClick={async () => {
                                                        await handleUpdateBio();
                                                        setEditBio(false);
                                                        setActiveButton(previousActiveButton);
                                                    }}
                                                >
                                                    Save Bio
                                                </button>
                                                <button
                                                    className="px-4 py-2"
                                                    onClick={() => {
                                                        setEditBio(false);
                                                        setActiveButton(previousActiveButton);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </Modal>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Posts */}
                    <div className="lg:col-span-2">
                        {/* Posts Filter */}

                        {/* Create Post Card */}
                        <div className="bg-white rounded-lg shadow-md mb-6">
                            <div className="p-4">
                                <div className="flex gap-3">
                                    <img
                                        src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt="Profile"
                                        className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                    />
                                    <div className="flex-grow">
                                        <button
                                            className="w-full p-3 border border-gray-200 rounded-lg text-left text-gray-500"
                                            onClick={() => setShowPostModal(true)}
                                        >
                                            What would you like to talk about?
                                        </button>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="space-x-2">
                                                <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                    onClick={() => setShowPostModal(true)}
                                                >
                                                    <FontAwesomeIcon icon={faImage} className="mr-1" /> Photo/Video
                                                </button>
                                                <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
                                                    <FontAwesomeIcon icon={faPaperclip} className="mr-1" /> Attachment
                                                </button>
                                            </div>
                                            <button className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all">
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showPostModal && (
                            <Modal onClose={() => {
                                setShowPostModal(false);
                                setPostError(''); // Reset lỗi khi đóng modal
                                setNewPost({ content: '', files: [] }); // Reset form
                            }}>
                                <div className="flex items-center gap-3 p-6 border-b">
                                    <img
                                        src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt="Avatar"
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <div className="font-semibold">{profileData?.firstName} {profileData?.lastName}</div>
                                        <div className="text-xs text-gray-500">Đăng bài ở chế độ Bất cứ ai</div>
                                    </div>
                                </div>

                                {/* Error Display */}
                                {postError && (
                                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">
                                                    Không thể đăng bài
                                                </h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    {postError}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6">
                                    <textarea
                                        className="w-full border-none outline-none resize-none text-lg"
                                        rows={4}
                                        placeholder="Bạn muốn nói về chủ đề gì?"
                                        value={newPost.content}
                                        onChange={(e) => {
                                            setNewPost(prev => ({ ...prev, content: e.target.value }));
                                            // Clear error khi user bắt đầu chỉnh sửa
                                            if (postError) {
                                                setPostError('');
                                            }
                                        }}
                                    />
                                    {newPost.files.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {newPost.files.map((file, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Upload ${index + 1}`}
                                                        className="w-20 h-20 object-cover rounded"
                                                    />
                                                    <button
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                                        onClick={() => setNewPost(prev => ({
                                                            ...prev,
                                                            files: prev.files.filter((_, i) => i !== index)
                                                        }))}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mt-4">
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleFileUpload}
                                            />
                                            <FontAwesomeIcon icon={faImage} className="text-blue-500" />
                                        </label>
                                        <FontAwesomeIcon icon={faSmile} className="text-yellow-500" />
                                    </div>
                                </div>
                                <div className="flex justify-end p-4 border-t">
                                    <button
                                        className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 ${isCreatingPost
                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                        onClick={handleCreatePost}
                                        disabled={isCreatingPost}
                                    >
                                        {isCreatingPost && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        )}
                                        {isCreatingPost ? 'Đang đăng...' : 'Post'}
                                    </button>
                                </div>
                            </Modal>
                        )}

                        {/* Posts List */}
                        <div className="space-y-6">
                            {posts && posts.length > 0 ? (
                                posts.map((post, index) => (
                                    <div
                                        key={`post-${post.postId}-${index}`}
                                        ref={index === posts.length - 1 ? lastPostElementRef : null}
                                        className="bg-white rounded-lg shadow-md"
                                    >
                                        <div className="p-4">
                                            <div className="flex justify-between mb-3">
                                                <div className="flex gap-3">
                                                    <img
                                                        src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        alt="Profile"
                                                        className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                                    />
                                                    <div>
                                                        <h6 className="font-semibold mb-0">{profileData?.firstName} {profileData?.lastName}</h6>
                                                        <small className="text-gray-600">
                                                            {new Date(post.createAt).toLocaleDateString('vi-VN')}
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <button className="text-gray-600 hover:text-blue-600 transition-all">
                                                        <FontAwesomeIcon icon={faEllipsisH} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-gray-800">{post.content}</p>
                                                {post.postMedia && post.postMedia.length > 0 && (
                                                    <PostMediaGrid media={post.postMedia} />
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                                        onClick={() => handleLikePost(post.postId)}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={postLikes[post.postId] ? faHeart : farHeart}
                                                            className={`mr-1 ${postLikes[post.postId] ? 'text-red-500' : ''}`}
                                                        />
                                                        {postLikes[post.postId] || 0} Like
                                                    </button>
                                                    <button
                                                        className={`px-3 py-1 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all ${openCommentPosts.includes(post.postId) ? 'bg-blue-100' : 'bg-gray-100'}`}
                                                        onClick={() => toggleCommentSection(post.postId)}
                                                    >
                                                        <FontAwesomeIcon icon={openCommentPosts.includes(post.postId) ? faComment : farComment} className="mr-1" />
                                                        {postCommentCounts[post.postId] || 0} Comment
                                                    </button>
                                                    <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
                                                        <FontAwesomeIcon icon={farShareSquare} className="mr-1" />
                                                        Share
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comment Section */}
                                        {openCommentPosts.includes(post.postId) && (
                                            <div className="px-6 pb-4">
                                                {/* Debug info */}
                                                <div className="text-xs text-gray-400 mb-2">
                                                    Bài viết ID: {post.postId}
                                                    {/* Có bình luận: {Array.isArray(postComments[post.postId]) ? postComments[post.postId].length : 'không có dữ liệu'} */}
                                                </div>

                                                {/* Comment Input */}
                                                <div className="flex items-start gap-3 mb-4">
                                                    <img
                                                        src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        alt="Avatar"
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            value={commentContents[post.postId] || ''}
                                                            onChange={(e) => updateCommentContent(post.postId, e.target.value)}
                                                            placeholder="Thêm bình luận..."
                                                            className="w-full p-2 pl-4 pr-20 border rounded-full focus:outline-none focus:border-blue-500 bg-gray-100"
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
                                                            <button type="button" className="text-xl text-gray-500 hover:text-blue-500">
                                                                <FontAwesomeIcon icon={faSmile} />
                                                            </button>
                                                            <button type="button" className="text-xl text-gray-500 hover:text-blue-500">
                                                                <FontAwesomeIcon icon={faImage} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCreateComment(post.postId, commentContents[post.postId])}
                                                        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700"
                                                    >
                                                        Gửi
                                                    </button>
                                                </div>

                                                {/* Comments List */}
                                                <div className="max-h-96 overflow-y-auto mb-2">
                                                    {Array.isArray(postComments[post.postId]) && postComments[post.postId].length > 0
                                                        ? postComments[post.postId]
                                                            .filter(comment => comment !== null && !comment.parentCommentId)
                                                            .map((comment, index) => (
                                                                <div key={`${post.postId}-${comment.postcommentId || index}`} className="flex gap-3 mb-5 group">
                                                                    <img
                                                                        src={comment?.userInfo?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                        alt="Avatar"
                                                                        className="w-10 h-10 rounded-full mt-1"
                                                                    />
                                                                    <div className="flex-1">
                                                                        {editingComment === comment.postcommentId ? (
                                                                            <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                                                                <input
                                                                                    type="text"
                                                                                    value={commentContent || comment.content}
                                                                                    onChange={(e) => setCommentContent(e.target.value)}
                                                                                    className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                                                                                />
                                                                                <div className="flex gap-2 mt-2">
                                                                                    <button
                                                                                        onClick={() => handleUpdateComment(comment.postcommentId, post.postId, commentContent || comment.content)}
                                                                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                                                                                    >
                                                                                        Cập nhật
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setEditingComment(null);
                                                                                            setCommentContent('');
                                                                                        }}
                                                                                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm"
                                                                                    >
                                                                                        Hủy
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="font-semibold text-gray-900">{comment?.userInfo?.firstName} {comment?.userInfo?.lastName}</span>
                                                                                </div>
                                                                                <div className="text-gray-800 mb-2">{comment.content}</div>
                                                                                <div className="flex gap-4 text-xs text-gray-500">
                                                                                    <span>{getRelativeTime(comment.commentAt)}</span>
                                                                                    <button
                                                                                        className="hover:underline flex items-center gap-1"
                                                                                    // onClick={() => handleLikeComment(comment.postcommentId)}
                                                                                    >
                                                                                        <FontAwesomeIcon
                                                                                            icon={commentLikes[comment.postcommentId] ? faHeart : farHeart}
                                                                                            className={commentLikes[comment.postcommentId] ? 'text-red-500' : ''}
                                                                                        />
                                                                                        {commentLikes[comment.postcommentId] || 0}
                                                                                    </button>
                                                                                    <button
                                                                                        className="hover:underline"
                                                                                        onClick={() => {
                                                                                            setReplyingToComment({ postId: post.postId, commentId: comment.postcommentId });
                                                                                            setChildCommentContents(prev => ({
                                                                                                ...prev,
                                                                                                [`${post.postId}-${comment.postcommentId}`]: ''
                                                                                            }));
                                                                                        }}
                                                                                    >
                                                                                        Trả lời
                                                                                    </button>
                                                                                    <button
                                                                                        className="hover:underline flex items-center gap-1"
                                                                                        onClick={() => toggleChildComments(comment.postcommentId)}
                                                                                    >
                                                                                        {showChildComments[comment.postcommentId] ? (
                                                                                            <>
                                                                                                <FontAwesomeIcon icon={faChevronUp} className="text-xs" />
                                                                                                Ẩn phản hồi
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                                                                                                Xem phản hồi
                                                                                            </>
                                                                                        )}
                                                                                        <span className="ml-1 text-gray-500 font-normal">
                                                                                            ({commentReplyCounts[comment.postcommentId] !== undefined ? commentReplyCounts[comment.postcommentId] : '...'})
                                                                                        </span>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Reply form */}
                                                                        {replyingToComment &&
                                                                            replyingToComment.postId === post.postId &&
                                                                            replyingToComment.commentId === comment.postcommentId && (
                                                                                <div className="mt-2 ml-4 flex items-start gap-2">
                                                                                    <img
                                                                                        src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                                        alt="Avatar"
                                                                                        className="w-8 h-8 rounded-full"
                                                                                    />
                                                                                    <div className="flex-1 relative">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={childCommentContents[`${post.postId}-${comment.postcommentId}`] || ''}
                                                                                            onChange={(e) => setChildCommentContents(prev => ({
                                                                                                ...prev,
                                                                                                [`${post.postId}-${comment.postcommentId}`]: e.target.value
                                                                                            }))}
                                                                                            placeholder="Viết phản hồi..."
                                                                                            className="w-full p-2 pl-3 pr-16 border rounded-full focus:outline-none focus:border-blue-500 bg-gray-100 text-sm"
                                                                                        />
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => handleReplyComment(post.postId, comment.postcommentId, childCommentContents[`${post.postId}-${comment.postcommentId}`])}
                                                                                        className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                                                                                    >
                                                                                        Gửi
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => setReplyingToComment(null)}
                                                                                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-sm"
                                                                                    >
                                                                                        Hủy
                                                                                    </button>
                                                                                </div>
                                                                            )}

                                                                        {/* Child comments */}
                                                                        {showChildComments[comment.postcommentId] && childComments[comment.postcommentId] && (
                                                                            <div className="ml-6 mt-2 space-y-3">
                                                                                {Array.isArray(childComments[comment.postcommentId])
                                                                                    ? childComments[comment.postcommentId].map((childComment, idx) => (
                                                                                        <div key={`child-${childComment?.postcommentId || idx}`} className="flex flex-col w-full">
                                                                                            <div className="flex gap-2 group w-full">
                                                                                                <img
                                                                                                    src={childComment?.userInfo?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                                                    alt="Avatar"
                                                                                                    className="w-8 h-8 rounded-full mt-1"
                                                                                                />
                                                                                                <div className="flex-1">
                                                                                                    <div className="bg-gray-100 rounded-2xl px-3 py-2">
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <span className="font-semibold text-gray-900 text-sm">{childComment?.userInfo?.firstName} {childComment?.userInfo?.lastName}</span>
                                                                                                        </div>
                                                                                                        <div className="text-gray-800 text-sm">{childComment?.content}</div>
                                                                                                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                                                                                            <span>{new Date(childComment.commentAt).toLocaleDateString()}</span>
                                                                                                            <button
                                                                                                                className="hover:underline"
                                                                                                                onClick={() => handleLikeComment(childComment.postcommentId)}
                                                                                                            >
                                                                                                                <FontAwesomeIcon
                                                                                                                    icon={commentLikes[childComment.postcommentId] ? faHeart : farHeart}
                                                                                                                    className={`mr-1 ${commentLikes[childComment.postcommentId] ? 'text-red-500' : ''}`}
                                                                                                                />
                                                                                                                {commentLikes[childComment.postcommentId] || 0}
                                                                                                            </button>
                                                                                                            <button
                                                                                                                className="hover:underline"
                                                                                                                onClick={() => {
                                                                                                                    setReplyingToChildComment({
                                                                                                                        postId: post.postId,
                                                                                                                        parentCommentId: comment.postcommentId,
                                                                                                                        childCommentId: childComment.postcommentId
                                                                                                                    });
                                                                                                                    setChildCommentContents(prev => ({
                                                                                                                        ...prev,
                                                                                                                        [`${post.postId}-${childComment.postcommentId}`]: ''
                                                                                                                    }));
                                                                                                                }}
                                                                                                            >
                                                                                                                Trả lời
                                                                                                            </button>
                                                                                                            <GetChildReplyCount
                                                                                                                childCommentId={childComment.postcommentId}
                                                                                                                showChildReplies={showChildReplies}
                                                                                                                toggleChildReplies={toggleChildReplies}
                                                                                                            />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                                {childComment?.accountId === id && (
                                                                                                    <button
                                                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1"
                                                                                                        onClick={() => childComment?.postcommentId && handleDeleteComment(childComment.postcommentId, post.postId)}
                                                                                                    >
                                                                                                        <FontAwesomeIcon icon={faTrash} />
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>

                                                                                            {/* Form trả lời bình luận con Child comments  */}
                                                                                            {replyingToChildComment &&
                                                                                                replyingToChildComment.postId === post.postId &&
                                                                                                replyingToChildComment.parentCommentId === comment.postcommentId &&
                                                                                                replyingToChildComment.childCommentId === childComment.postcommentId && (
                                                                                                    <div className="mt-2 ml-8 flex items-start gap-2 w-full">
                                                                                                        <img
                                                                                                            src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                                                            alt="Avatar"
                                                                                                            className="w-8 h-8 rounded-full"
                                                                                                        />
                                                                                                        <div className="flex-1 relative">
                                                                                                            <input
                                                                                                                type="text"
                                                                                                                value={childCommentContents[`${post.postId}-${childComment.postcommentId}`] || ''}
                                                                                                                onChange={(e) => setChildCommentContents(prev => ({
                                                                                                                    ...prev,
                                                                                                                    [`${post.postId}-${childComment.postcommentId}`]: e.target.value
                                                                                                                }))}
                                                                                                                placeholder="Viết phản hồi..."
                                                                                                                className="w-full p-2 pl-3 pr-16 border rounded-full focus:outline-none focus:border-blue-500 bg-gray-100 text-sm"
                                                                                                                autoFocus
                                                                                                            />
                                                                                                        </div>
                                                                                                        <button
                                                                                                            onClick={() => handleReplyToChildComment(
                                                                                                                post.postId,
                                                                                                                childComment,
                                                                                                                childCommentContents[`${post.postId}-${childComment.postcommentId}`]
                                                                                                            )}
                                                                                                            className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                                                                                                        >
                                                                                                            Gửi
                                                                                                        </button>
                                                                                                        <button
                                                                                                            onClick={() => setReplyingToChildComment(null)}
                                                                                                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-sm"
                                                                                                        >
                                                                                                            Hủy
                                                                                                        </button>
                                                                                                    </div>
                                                                                                )}

                                                                                            {/* Child replies */}
                                                                                            {showChildReplies[childComment.postcommentId] && (
                                                                                                <div className="ml-8 mt-2 space-y-3 w-full">
                                                                                                    {Array.isArray(childReplies[childComment.postcommentId]) && childReplies[childComment.postcommentId].length > 0 ? (
                                                                                                        childReplies[childComment.postcommentId].map((reply, replyIdx) => (
                                                                                                            <div key={`reply-${reply?.postcommentId || replyIdx}`} className="flex flex-col gap-2">
                                                                                                                <div className="flex gap-2 group">
                                                                                                                    <img
                                                                                                                        src={reply?.userInfo?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                                                                        alt="Avatar"
                                                                                                                        className="w-8 h-8 rounded-full mt-1"
                                                                                                                    />
                                                                                                                    <div className="flex-1">
                                                                                                                        <div className="bg-gray-100 rounded-2xl px-3 py-2">
                                                                                                                            <div className="flex items-center gap-2">
                                                                                                                                <span className="font-semibold text-gray-900 text-sm">{reply?.userInfo?.firstName} {reply?.userInfo?.lastName}</span>
                                                                                                                            </div>
                                                                                                                            <div className="text-gray-800 text-sm">{reply?.content}</div>
                                                                                                                            <div className="flex gap-3 text-xs text-gray-500">
                                                                                                                                <span>{getRelativeTime(reply?.commentAt)}</span>
                                                                                                                                <button
                                                                                                                                    className="hover:underline flex items-center gap-1"
                                                                                                                                // onClick={() => reply?.postcommentId && handleLikeComment(reply.postcommentId)}
                                                                                                                                >
                                                                                                                                    <FontAwesomeIcon
                                                                                                                                        icon={reply?.postcommentId && commentLikes[reply.postcommentId] ? faHeart : farHeart}
                                                                                                                                        className={reply?.postcommentId && commentLikes[reply.postcommentId] ? 'text-red-500' : ''}
                                                                                                                                    />
                                                                                                                                    {reply?.postcommentId ? (commentLikes[reply.postcommentId] || 0) : 0}
                                                                                                                                </button>
                                                                                                                                <button
                                                                                                                                    className="hover:underline"
                                                                                                                                    onClick={() => {
                                                                                                                                        setReplyingToChildComment({
                                                                                                                                            postId: post.postId,
                                                                                                                                            parentCommentId: comment.postcommentId,
                                                                                                                                            childCommentId: reply.postcommentId
                                                                                                                                        });
                                                                                                                                        setChildCommentContents(prev => ({
                                                                                                                                            ...prev,
                                                                                                                                            [`${post.postId}-${reply.postcommentId}`]: ''
                                                                                                                                        }));
                                                                                                                                    }}
                                                                                                                                >
                                                                                                                                    Trả lời
                                                                                                                                </button>
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>

                                                                                                                {/* Form trả lời cho Child replies*/}
                                                                                                                {replyingToChildComment &&
                                                                                                                    replyingToChildComment.postId === post.postId &&
                                                                                                                    replyingToChildComment.parentCommentId === comment.postcommentId &&
                                                                                                                    replyingToChildComment.childCommentId === reply.postcommentId && (
                                                                                                                        <div className="mt-2 ml-8 flex items-start gap-2 w-full">
                                                                                                                            <img
                                                                                                                                src={profileData?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                                                                                                alt="Avatar"
                                                                                                                                className="w-8 h-8 rounded-full"
                                                                                                                            />
                                                                                                                            <div className="flex-1 relative">
                                                                                                                                <input
                                                                                                                                    type="text"
                                                                                                                                    value={childCommentContents[`${post.postId}-${reply.postcommentId}`] || ''}
                                                                                                                                    onChange={(e) => setChildCommentContents(prev => ({
                                                                                                                                        ...prev,
                                                                                                                                        [`${post.postId}-${reply.postcommentId}`]: e.target.value
                                                                                                                                    }))}
                                                                                                                                    placeholder="Viết phản hồi..."
                                                                                                                                    className="w-full p-2 pl-3 pr-16 border rounded-full focus:outline-none focus:border-blue-500 bg-gray-100 text-sm"
                                                                                                                                    autoFocus
                                                                                                                                />
                                                                                                                            </div>
                                                                                                                            <button
                                                                                                                                onClick={() => handleReplyToChildWithParent(
                                                                                                                                    post.postId,
                                                                                                                                    reply, // Đây là bình luận con
                                                                                                                                    childCommentContents[`${post.postId}-${reply.postcommentId}`] // Đây là nội dung đã nhập cho bình luận con này
                                                                                                                                )}
                                                                                                                                className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                                                                                                                            >
                                                                                                                                Gửi
                                                                                                                            </button>
                                                                                                                            <button
                                                                                                                                onClick={() => setReplyingToChildComment(null)}
                                                                                                                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-sm"
                                                                                                                            >
                                                                                                                                Hủy
                                                                                                                            </button>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                            </div>
                                                                                                        ))
                                                                                                    ) : (
                                                                                                        <div className="text-center py-2 text-gray-500 text-sm">
                                                                                                            {Array.isArray(childReplies[childComment.postcommentId]) ? 'Chưa có phản hồi nào' : 'Đang tải phản hồi...'}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    ))
                                                                                    : (
                                                                                        <div className="text-center py-2 text-gray-500 text-sm">
                                                                                            Đang tải bình luận...
                                                                                        </div>
                                                                                    )
                                                                                }
                                                                                {Array.isArray(childComments[comment.postcommentId]) && childComments[comment.postcommentId].length === 0 && (
                                                                                    <div className="text-center py-2 text-gray-500 text-sm">
                                                                                        Chưa có phản hồi nào
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Comment actions */}
                                                                    {
                                                                        comment.accountId === id && (
                                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                                                                <button
                                                                                    className="text-blue-500 hover:text-blue-700 p-1"
                                                                                    onClick={() => {
                                                                                        setEditingComment(comment.postcommentId);
                                                                                        setCommentContent(comment.content);
                                                                                    }}
                                                                                >
                                                                                    <FontAwesomeIcon icon={faEdit} />
                                                                                </button>
                                                                                <button
                                                                                    className="text-red-500 hover:text-red-700 p-1"
                                                                                    onClick={() => handleDeleteComment(comment.postcommentId, post.postId)}
                                                                                >
                                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                                </button>
                                                                            </div>
                                                                        )
                                                                    }
                                                                </div>
                                                            ))
                                                        : (
                                                            <div className="text-center py-4 text-gray-500">
                                                                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <p className="text-gray-500 text-lg">Chưa có bài viết nào</p>
                                </div>
                            )}

                            {/* Loading indicator */}
                            {isLoadingMore && (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Thêm debug để hiển thị trạng thái */}
            {/* <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg z-50 max-w-md max-h-60 overflow-auto">
                <h3 className="font-bold">Debug:</h3>
                <div>Open Comment Posts: {JSON.stringify(openCommentPosts)}</div>
                <div>Post Comments: {JSON.stringify(postComments)}</div>
            </div> */}
        </div >
    );
};

export default PublicProfile;





