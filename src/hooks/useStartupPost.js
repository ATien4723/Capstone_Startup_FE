import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { createInternshipPost, getAllInternshipPosts, createPost, getPostsByStartupId, searchStartupInternshipPosts, searchStartupPosts } from '@/apis/postService';
import { getUserId } from '@/apis/authService';

import {
    getPositionRequirements,
    getPositionRequirementById,
    createPositionRequirement,
    updatePositionRequirement,
    deletePositionRequirement,
    getStartupIdByAccountId
} from '@/apis/startupService';

export const useStartupPost = () => {


    // const [internshipPosts, setInternshipPosts] = useState([
    //     {
    //         id: 1,
    //         title: 'Tuyển thực tập sinh Frontend Developer',
    //         date: '01/01/2023',
    //         excerpt: 'Công ty ABC đang tìm kiếm thực tập sinh Frontend Developer với kiến thức về React, HTML, CSS và JavaScript.',
    //         tags: ['Frontend', 'React', 'Internship']
    //     },
    //     {
    //         id: 2,
    //         title: 'Thực tập sinh Backend Developer',
    //         date: '02/01/2023',
    //         excerpt: 'Startup XYZ cần tuyển thực tập sinh Backend Developer có kinh nghiệm với Node.js, Express và MongoDB.',
    //         tags: ['Backend', 'Node.js', 'MongoDB']
    //     },
    //     {
    //         id: 3,
    //         title: 'Thực tập sinh UI/UX Designer',
    //         date: '03/01/2023',
    //         excerpt: 'Chúng tôi đang tìm kiếm thực tập sinh UI/UX Designer có khả năng thiết kế giao diện người dùng thân thiện và trực quan.',
    //         tags: ['UI/UX', 'Design', 'Figma']
    //     }
    // ]);
    // State cho bài đăng thực tập
    const [internshipPosts, setInternshipPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
    });

    // State cho modal tạo bài đăng mới
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // State cho người dùng startup
    const [userStartupId, setUserStartupId] = useState(null);

    // State cho form dữ liệu bài đăng
    const [formData, setFormData] = useState({
        startup_ID: 0, // Sẽ được cập nhật khi có userStartupId
        position_ID: 0,
        title: '',
        description: '',
        requirement: '',
        benefits: '',
        deadline: '',
        address: '',
        salary: ''
    });

    // State cho position requirements
    const [positionRequirements, setPositionRequirements] = useState([]);
    const [showPositionModal, setShowPositionModal] = useState(false);
    const [positionFormData, setPositionFormData] = useState({
        positionId: 0,
        startupId: 0,
        title: '',
        description: '',
        requirement: '',
        isEditing: false
    });
    const [loadingPositions, setLoadingPositions] = useState(false);

    // State cho danh sách vị trí (position) - ban đầu rỗng, sẽ được lấy từ API
    const [positions, setPositions] = useState([]);

    // State cho danh sách startup của người dùng - giả lập
    const [userStartups, setUserStartups] = useState([
        { id: 1, name: 'Startup A' },
        { id: 2, name: 'Startup B' }
    ]);

    // State cho bài viết thông thường
    const [posts, setPosts] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [postsPagination, setPostsPagination] = useState({
        currentPage: 1,
        pageSize: 5,
        totalItems: 0,
        totalPages: 0
    });

    // State cho modal tạo bài viết mới
    const [showPostModal, setShowPostModal] = useState(false);
    const [newPost, setNewPost] = useState({ content: '', files: [] });
    const [postError, setPostError] = useState('');
    const [isCreatingPost, setIsCreatingPost] = useState(false);

    // State cho tìm kiếm bài đăng tuyển dụng
    const [searchKeyword, setSearchKeyword] = useState('');

    // State cho tìm kiếm bài đăng thông thường
    const [postSearchText, setPostSearchText] = useState('');
    const [isSearchingPosts, setIsSearchingPosts] = useState(false);

    // Fetch startup ID của user hiện tại
    useEffect(() => {
        const fetchStartupId = async () => {
            try {
                const userId = getUserId();
                if (userId) {
                    const response = await getStartupIdByAccountId(userId);
                    if (response) {
                        setUserStartupId(response);
                        // Cập nhật form data với startupId
                        setPositionFormData(prev => ({
                            ...prev,
                            startupId: response
                        }));
                        // Cập nhật formData với startupId
                        setFormData(prev => ({
                            ...prev,
                            startup_ID: response
                        }));

                        // Tải danh sách vị trí ngay sau khi lấy được startupId
                        fetchPositionRequirements(response);

                        // Tải danh sách bài đăng tuyển dụng
                        fetchInternshipPosts(response, pagination.currentPage, pagination.pageSize);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy startup ID:', error);
            }
        };

        fetchStartupId();
    }, []);

    // Fetch danh sách bài đăng tuyển dụng thực tập
    const fetchInternshipPosts = async (startupId = userStartupId, page = pagination.currentPage, pageSize = pagination.pageSize) => {
        if (!startupId) return;

        try {
            setLoadingPosts(true);
            const response = await getAllInternshipPosts(startupId, page, pageSize);

            if (response && response.items) {
                setInternshipPosts(response.items);
                setPagination({
                    currentPage: page,
                    pageSize: pageSize,
                    totalItems: response.totalCount || 0,
                    totalPages: response.totalPages || 1
                });
            } else {
                console.error('Cấu trúc dữ liệu không như mong đợi:', response);
                setInternshipPosts([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách bài đăng tuyển dụng thực tập:', error);
            toast.error('Không thể tải danh sách bài đăng tuyển dụng');
            setInternshipPosts([]);
        } finally {
            setLoadingPosts(false);
        }
    };

    // Tìm kiếm bài đăng tuyển dụng
    const searchInternshipPosts = async (keyword = searchKeyword) => {
        if (!userStartupId) return;

        try {
            setLoadingPosts(true);
            const response = await searchStartupInternshipPosts(userStartupId, keyword, 1, pagination.pageSize);

            if (response && response.data && response.data.items) {
                setInternshipPosts(response.data.items);
                setPagination({
                    currentPage: 1,
                    pageSize: pagination.pageSize,
                    totalItems: response.data.totalCount || 0,
                    totalPages: response.data.totalPages || 1
                });
            } else {
                console.error('Cấu trúc dữ liệu không như mong đợi:', response);
                setInternshipPosts([]);
            }
        } catch (error) {
            console.error('Lỗi khi tìm kiếm bài đăng tuyển dụng:', error);
            toast.error('Không thể tìm kiếm bài đăng tuyển dụng');
            setInternshipPosts([]);
        } finally {
            setLoadingPosts(false);
        }
    };

    // Xử lý thay đổi từ khóa tìm kiếm internshipost
    const handleInternshipPostSearchKeywordChange = (e) => {
        const newKeyword = e.target.value;
        setSearchKeyword(newKeyword);

        // Nếu từ khóa rỗng, tự động lấy lại danh sách ban đầu
        if (newKeyword === '') {
            fetchInternshipPosts(userStartupId, 1, pagination.pageSize);
        }
    };


    // Hàm tìm kiếm bài đăng thông thường
    const handlePostSearch = async (e) => {
        e.preventDefault();
        if (!userStartupId) return;

        try {
            setIsSearchingPosts(true);
            const response = await searchStartupPosts(userStartupId, postSearchText, 1, postsPagination.pageSize);

            if (response && response.data && response.data.items) {
                setPosts(response.data.items);
                setPostsPagination({
                    currentPage: 1,
                    pageSize: postsPagination.pageSize,
                    totalItems: response.data.totalCount || 0,
                    totalPages: response.data.totalPages || 1
                });
            } else {
                console.error('Cấu trúc dữ liệu không như mong đợi:', response);
                setPosts([]);
                toast.info('Không tìm thấy bài viết nào');
            }
        } catch (error) {
            console.error('Lỗi khi tìm kiếm bài viết:', error);
            toast.error('Không thể tìm kiếm bài viết');
        } finally {
            setIsSearchingPosts(false);
        }
    };

    // Xử lý thay đổi từ khóa tìm kiếm bài đăng thông thường
    const handlePostSearchTextChange = (e) => {
        const newText = e.target.value;
        setPostSearchText(newText);

        // Nếu từ khóa rỗng, tự động lấy lại danh sách ban đầu
        if (newText === '') {
            fetchStartupPosts(userStartupId, 1, postsPagination.pageSize);
        }
    };
    // Xử lý submit form tìm kiếm
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        searchInternshipPosts();
    };

    // Xử lý chuyển trang
    const handlePageChange = (newPage) => {
        fetchInternshipPosts(userStartupId, newPage, pagination.pageSize);
    };

    // Fetch position requirements
    const fetchPositionRequirements = async (startupId = userStartupId) => {
        if (!startupId) return;

        try {
            setLoadingPositions(true);
            const response = await getPositionRequirements(startupId);
            console.log('API response:', response); // Log để debug
            // Nếu dữ liệu nằm trực tiếp trong response
            if (response && response.items) {
                setPositionRequirements(response.items);

                // Cập nhật danh sách positions cho dropdown
                if (response.items.length > 0) {
                    const positionsList = response.items.map(item => ({
                        id: item.positionId,
                        name: item.title
                    }));
                    setPositions(positionsList);
                }
            }
            else {
                console.error('Cấu trúc dữ liệu không như mong đợi:', response);
                setPositionRequirements([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách position requirements:', error);
            toast.error('Không thể tải danh sách vị trí');
            setPositionRequirements([]);
        } finally {
            setLoadingPositions(false);
        }
    };

    // Gọi API khi modal position được mở
    useEffect(() => {
        if (showPositionModal && userStartupId) {
            console.log('Modal opened, fetching positions with startupId:', userStartupId);
            fetchPositionRequirements();
        }
    }, [showPositionModal]);

    // Hàm xử lý thay đổi input cho position form
    const handlePositionInputChange = (e) => {
        const { name, value } = e.target;
        setPositionFormData({
            ...positionFormData,
            [name]: value
        });
    };

    // Hàm xử lý submit form position
    const handlePositionSubmit = async (e) => {
        e.preventDefault();

        if (!positionFormData.title || !positionFormData.description || !positionFormData.requirement) {
            toast.error('Vui lòng điền đầy đủ thông tin vị trí');
            return;
        }

        try {
            setLoadingPositions(true);

            const positionData = {
                title: positionFormData.title,
                description: positionFormData.description,
                requirement: positionFormData.requirement,
                startupId: positionFormData.startupId
            };

            let response;

            if (positionFormData.isEditing) {
                // Cập nhật position
                response = await updatePositionRequirement(positionFormData.positionId, positionData);
                toast.success('Cập nhật vị trí thành công!');
            } else {
                // Tạo position mới
                response = await createPositionRequirement(positionData);
                toast.success('Tạo vị trí mới thành công!');
            }

            // Reset form và fetch lại danh sách
            resetPositionForm();
            fetchPositionRequirements();

        } catch (error) {
            console.error('Lỗi khi xử lý vị trí:', error);
            toast.error('Có lỗi xảy ra khi xử lý vị trí');
        } finally {
            setLoadingPositions(false);
        }
    };

    // Hàm xử lý sửa position
    const handleEditPosition = async (position) => {
        try {
            const response = await getPositionRequirementById(position.positionId);
            if (response && response.data) {
                setPositionFormData({
                    positionId: response.data.positionId,
                    startupId: response.data.startupId,
                    title: response.data.title,
                    description: response.data.description,
                    requirement: response.data.requirement || '',
                    isEditing: true
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin vị trí:', error);
            toast.error('Không thể lấy thông tin vị trí');
        }
    };

    // Hàm xử lý xóa position
    const handleDeletePosition = async (positionId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa vị trí này?')) return;

        try {
            setLoadingPositions(true);
            await deletePositionRequirement(positionId);
            toast.success('Xóa vị trí thành công!');
            fetchPositionRequirements();
        } catch (error) {
            console.error('Lỗi khi xóa vị trí:', error);
            toast.error('Không thể xóa vị trí');
        } finally {
            setLoadingPositions(false);
        }
    };

    // Reset position form
    const resetPositionForm = () => {
        setPositionFormData({
            positionId: 0,
            startupId: userStartupId,
            title: '',
            description: '',
            requirement: '',
            isEditing: false
        });
    };

    // Hàm xử lý thay đổi input cho form bài đăng
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Hàm xử lý submit form bài đăng
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Kiểm tra các trường bắt buộc
        if (!formData.title || !formData.description || !formData.requirement ||
            !formData.benefits || !formData.deadline || !formData.address || !formData.salary) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setLoading(true);

            // Lấy ID người dùng hiện tại
            const userId = getUserId();

            // Chuẩn bị dữ liệu để gửi API
            const internshipData = {
                startup_ID: userStartupId,
                position_ID: parseInt(formData.position_ID),
                title: formData.title,
                description: formData.description,
                requirement: formData.requirement,
                benefits: formData.benefits,
                deadline: formData.deadline,
                address: formData.address,
                salary: formData.salary
            };

            // Gọi API tạo bài đăng thực tập
            const response = await createInternshipPost(internshipData);

            // Xử lý kết quả thành công
            toast.success('Tạo bài đăng thực tập thành công!');

            // Đóng modal và reset form
            setShowCreateModal(false);
            resetFormData();

            // Fetch lại danh sách bài đăng
            fetchInternshipPosts();

        } catch (error) {
            console.error('Lỗi khi tạo bài đăng thực tập:', error);
            toast.error('Có lỗi xảy ra khi tạo bài đăng thực tập');
        } finally {
            setLoading(false);
        }
    };

    // Reset form bài đăng
    const resetFormData = () => {
        setFormData({
            startup_ID: userStartupId,
            position_ID: 0,
            title: '',
            description: '',
            requirement: '',
            benefits: '',
            deadline: '',
            address: '',
            salary: ''
        });
    };

    // Fetch danh sách bài viết thông thường của startup
    const fetchStartupPosts = async (startupId = userStartupId, page = postsPagination.currentPage, pageSize = postsPagination.pageSize) => {
        if (!startupId) return;

        try {
            setIsLoadingPosts(true);
            const response = await getPostsByStartupId(startupId, page, pageSize);

            if (response && response.items) {
                setPosts(response.items);
                setPostsPagination({
                    currentPage: page,
                    pageSize: pageSize,
                    totalItems: response.totalCount || 0,
                    totalPages: response.totalPages || 1
                });
            } else {
                console.error('Cấu trúc dữ liệu không như mong đợi:', response);
                setPosts([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách bài viết:', error);
            toast.error('Không thể tải danh sách bài viết');
            setPosts([]);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    // Xử lý chuyển trang cho bài viết
    const handlePostPageChange = (newPage) => {
        fetchStartupPosts(userStartupId, newPage, postsPagination.pageSize);
    };

    // Xử lý upload file cho bài viết
    const handleFileUpload = (e) => {
        const selectedFiles = Array.from(e.target.files);

        // Giới hạn số lượng file tối đa có thể upload
        const maxFiles = 5;
        if (newPost.files.length + selectedFiles.length > maxFiles) {
            setPostError(`Bạn chỉ có thể tải lên tối đa ${maxFiles} file`);
            return;
        }

        // Kiểm tra kích thước file
        const maxSize = 5 * 1024 * 1024; // 5MB
        const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            setPostError(`Các file phải có kích thước nhỏ hơn 5MB`);
            return;
        }

        setNewPost(prev => ({
            ...prev,
            files: [...prev.files, ...selectedFiles]
        }));
        setPostError('');
    };

    // Xử lý tạo bài viết mới
    const handleCreatePost = async () => {
        // Kiểm tra nếu bài viết trống
        if (!newPost.content.trim() && newPost.files.length === 0) {
            setPostError('Vui lòng nhập nội dung hoặc thêm hình ảnh cho bài viết');
            return;
        }

        try {
            setIsCreatingPost(true);
            setPostError('');

            // Chuẩn bị FormData để gửi cả text và files
            const formData = new FormData();
            formData.append('content', newPost.content);
            formData.append('startupId', userStartupId);

            // Thêm files vào FormData
            newPost.files.forEach((file) => {
                formData.append(`MediaFiles`, file);
            });

            // Gọi API tạo bài viết
            const response = await createPost(formData);

            // Xử lý kết quả thành công
            toast.success('Đã đăng bài viết thành công!');

            // Đóng modal và reset form
            setShowPostModal(false);
            setNewPost({ content: '', files: [] });

            // Cập nhật lại danh sách bài viết
            fetchStartupPosts(userStartupId);

        } catch (error) {
            console.error('Lỗi khi tạo bài viết:', error);
            setPostError('Có lỗi xảy ra khi đăng bài viết. Vui lòng thử lại sau.');
        } finally {
            setIsCreatingPost(false);
        }
    };

    return {
        // State
        internshipPosts,
        showCreateModal,
        loading,
        loadingPosts,
        formData,
        positionRequirements,
        showPositionModal,
        positionFormData,
        loadingPositions,
        positions,
        userStartups,
        userStartupId,
        pagination,
        posts,
        isLoadingPosts,
        postsPagination,
        showPostModal,
        newPost,
        postError,
        isCreatingPost,
        searchKeyword,
        setSearchKeyword,
        handleInternshipPostSearchKeywordChange,
        handleSearchSubmit,
        searchInternshipPosts,
        postSearchText,
        setPostSearchText,
        isSearchingPosts,
        handlePostSearchTextChange,
        handlePostSearch,

        // Setters
        setShowCreateModal,
        setShowPositionModal,
        setShowPostModal,
        setNewPost,

        // Handlers
        handleInputChange,
        handleSubmit,
        handlePositionInputChange,
        handlePositionSubmit,
        handleEditPosition,
        handleDeletePosition,
        handlePageChange,
        resetPositionForm,
        fetchPositionRequirements,
        fetchInternshipPosts,
        fetchStartupPosts,
        handlePostPageChange,
        handleFileUpload,
        handleCreatePost,
    };
};

export default useStartupPost; 