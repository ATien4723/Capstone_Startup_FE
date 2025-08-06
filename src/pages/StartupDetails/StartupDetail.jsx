import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHandshake, faCalendar, faMapMarkerAlt, faCalendarPlus, faTrophy, faUsers, faGlobe, faFilePdf, faFileAlt, faSpinner, faComment, faShareAlt, faBriefcase, faLocationDot, faClock, faUserCheck, faUserPlus, faUserMinus, faPlay } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faComment as farComment, faHeart as farHeart, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import useStartupDetail from '@/hooks/useStartupDetail';
import { useState, useEffect } from 'react';
import PostMediaGrid from '@/components/PostMedia/PostMediaGrid';
import CommentSection from '@/components/CommentSection/CommentSection';
import LikesModal, { LikeCounter } from '@/components/Common/LikesModal';
import SharePostModal from '@/components/Common/SharePostModal';
import SharedPost from '@/components/PostMedia/SharedPost';
import useFollow from '@/hooks/useFollow';
import { toast } from 'react-toastify';
import { getUserId } from '@/apis/authService';
import PDFViewer from '@/components/Common/PDFViewer';
import VideoPlayer from '@/components/Common/VideoPlayer';
import { getRelativeTime, formatPostTime, formatDuration } from '@/utils/dateUtils';
import useMessage from '@/hooks/useMessage';


const StartupDetail = () => {
    const navigate = useNavigate();
    const {
        // States
        activeTab,
        feedPosts,
        loadingFeed,
        isLoadingMoreFeed,
        hasMoreFeed,
        teamMembers,
        loadingMembers,
        postLikes,
        userLikedPosts,
        postCommentCounts,
        openCommentPosts,
        refreshCommentTrigger,
        profileData,
        startupInfo,
        loadingStartupInfo,
        errorStartupInfo,
        pitchingData,
        loadingPitching,
        errorPitching,
        isFollowingStartup,
        followStartupLoading,

        // Actions/Methods
        setActiveTab,
        loadMoreFeed,
        formatDate,
        handleLikePost,
        toggleCommentSection,
        handleCommentCountChange,
        handleSharePost,
        handleFollowStartup,
        handleUnfollowStartup
    } = useStartupDetail();

    // Thêm state để theo dõi các bài viết đã mở rộng nội dung
    const [expandedPosts, setExpandedPosts] = useState({});

    // Hàm để toggle hiển thị nội dung đầy đủ/rút gọn
    const togglePostContent = (postId) => {
        setExpandedPosts(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // Lấy accountId của user hiện tại
    const accountId = getUserId();

    // Sử dụng hook useFollow
    const {
        handleFollow,
        handleUnfollow,
        followLoading,
        processingId,
        isFollowing,
    } = useFollow(accountId);

    // Sử dụng useMessage hook để gọi ensureChatRoom
    const { ensureChatRoom } = useMessage(accountId);

    // Xử lý hành động follow startup
    const handleFollowAction = async () => {
        const success = await handleFollowStartup();
    };

    // Xử lý hành động unfollow startup
    const handleUnfollowAction = async () => {
        const success = await handleUnfollowStartup();
    };

    // Xử lý hành động liên hệ startup
    const handleContactStartup = async () => {
        try {
            // Chỉ dùng startupId làm tham số thứ hai (targetStartupId)
            // Để null cho tham số đầu tiên (targetAccountId)
            const response = await ensureChatRoom(null, startupInfo.startupId);

            if (response) {
                // Lưu chatRoomId vào localStorage để mở đúng phòng chat khi chuyển trang
                localStorage.setItem('selectedChatRoomId', response.chatRoomId);
                // Chuyển hướng đến trang chat - sử dụng response.chatRoomId
                navigate(`/messages/u/${response}`);

            }
        } catch (error) {
            console.error("Lỗi khi tạo cuộc trò chuyện:", error);
            toast.error("Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau!");
        }
    };

    // State cho modal hiển thị danh sách người đã thích và chia sẻ bài viết
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [postToShare, setPostToShare] = useState(null);

    // State cho việc hiển thị PDF và Video
    const [selectedPDF, setSelectedPDF] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [showAllPDFs, setShowAllPDFs] = useState(false);

    // Hàm để lấy và hiển thị danh sách người đã thích bài viết
    const handleShowLikes = (postId) => {
        setCurrentPostId(postId);
        setShowLikesModal(true);
    };

    // Hiển thị icon dựa trên type của bài đăng
    const getPostTypeIcon = (type) => {
        switch (type) {
            case 'Internship':
                return <FontAwesomeIcon icon={faBriefcase} className="text-blue-500 mr-2" />;
            default:
                return null;
        }
    };

    // Chuyển đến trang chi tiết bài đăng
    const goToPostDetail = (postId, type) => {
        if (type === 'Internship') {
            navigate(`/internship/${postId}`);
        } else {
            navigate(`/post/${postId}`);
        }
    };

    // Render bài đăng dựa vào loại
    const renderPost = (post) => {
        if (post.type === 'Internship') {
            return (
                <div
                    className="p-5 cursor-pointer border-2 border-blue-200 hover:border-blue-400 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                    onClick={() => goToPostDetail(post.postId, post.type, post.startupId)}
                >
                    <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg font-medium text-sm">
                        Internship
                    </div>
                    <div className="flex items-center mb-4">
                        <Link to={post.type === 'StartupPost' ? `/startup-detail/${post.startupId}` : `/profile/${post.accountID || post.userId}`}>
                            <img
                                src={post.avatarURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                alt={post.name || post.fullName || post.firstName || "Unknown User"}
                                className="h-12 w-12 rounded-full object-cover mr-3 border-2 border-gray-100"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                }}
                            />
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Link to={post.type === 'StartupPost' ? `/startup-detail/${post.startupId}` : `/profile/${post.accountID || post.userId}`}>
                                        <h5 className="font-medium">{post.name || post.fullName || post.firstName || "Unknown User"}</h5>
                                    </Link>
                                    <div className="text-right text-xs text-gray-500 mt-2">
                                        {post.createdAt ? formatPostTime(post.createdAt) : (post.createAt ? formatPostTime(post.createAt) : "Unknown date")}
                                    </div>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                        <FontAwesomeIcon icon={faBriefcase} className="mr-1" />
                                        Pro
                                    </span>

                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-bold text-xl mb-3 text-gray-800 mt-2">{post.title || post.content.substring(0, 50)}</h3>

                    <div className="mb-4 flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg mt-4">
                        <div className="text-gray-600 flex items-center text-sm">
                            <FontAwesomeIcon icon={faLocationDot} className="mr-1.5 text-gray-500" />
                            {post.address}
                        </div>
                        <div className="text-gray-600 flex items-center text-sm ml-4">
                            <FontAwesomeIcon icon={faClock} className="mr-1.5 text-gray-500" />
                            {formatDuration(post.dueDate)}
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <button className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
                            <FontAwesomeIcon icon={faComment} className="mr-1.5" />
                            Why is this job right for you?
                        </button>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors">
                            Apply Now
                        </button>
                    </div>


                </div>
            );
        }

        // Hiển thị bài viết thông thường giống trang Home
        return (
            <div
                key={post.postId}
                className="bg-white rounded-lg shadow-md"
            >
                <div className="p-4">
                    {/* Post header */}
                    <div className="flex justify-between mb-3">
                        <div className="flex gap-3">
                            <img
                                src={post.avatarURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                alt="Profile"
                                className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                }}
                            />
                            <div>
                                <h6 className="font-semibold mb-0">
                                    {post.name || "Unknown User"}
                                </h6>
                                <small className="text-gray-600">
                                    {formatPostTime(post.createdAt)}
                                </small>
                            </div>
                        </div>
                        {post.type && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center h-fit">
                                {getPostTypeIcon(post.type)}
                                {post.type}
                            </span>
                        )}
                    </div>
                    <div>
                        {post.title && <h5 className="font-bold mb-2">{post.title}</h5>}
                        <p className={`text-gray-800 whitespace-pre-wrap break-words mb-3 ${!expandedPosts[post.postId] ? 'line-clamp-2' : ''}`}>{post.content}</p>
                        {post.content && post.content.length > 100 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePostContent(post.postId);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm mb-3 font-medium"
                            >
                                {expandedPosts[post.postId] ? 'Thu gọn' : 'Xem thêm'}
                            </button>
                        )}

                        {/* Hiển thị bài viết được chia sẻ nếu có */}
                        {post.postShareId && (
                            <SharedPost postShareId={post.postShareId} />
                        )}

                        {/* Hiển thị media */}
                        {post.postMedia && post.postMedia.length > 0 && (
                            <PostMediaGrid media={post.postMedia} />
                        )}
                    </div>

                    {/* Hiển thị số lượng like và comment ở trên */}
                    {(postLikes[post.postId] > 0 || postCommentCounts[post.postId] > 0) && (
                        <div className="flex justify-between items-center mt-3 mb-2 px-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <LikeCounter
                                    postId={post.postId}
                                    count={postLikes[post.postId]}
                                    onClick={handleShowLikes}
                                />
                            </div>
                            <div className="text-sm text-black">
                                {postCommentCounts[post.postId] > 0 && (
                                    <span>{postCommentCounts[post.postId]} comments</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Đường kẻ phân cách */}
                    <hr className="my-2" />

                    <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-2">
                            <button
                                className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                onClick={() => handleLikePost(post.postId)}
                            >
                                <FontAwesomeIcon
                                    icon={userLikedPosts[post.postId] ? faHeart : farHeart}
                                    className={`mr-1 ${userLikedPosts[post.postId] ? 'text-red-500' : ''}`}
                                />
                                Like
                            </button>
                            <button
                                className={`px-3 py-1 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all ${openCommentPosts.includes(post.postId) ? 'bg-blue-100' : 'bg-gray-100'}`}
                                onClick={() => toggleCommentSection(post.postId)}
                            >
                                <FontAwesomeIcon icon={openCommentPosts.includes(post.postId) ? faComment : farComment} className="mr-1" />
                                Comment
                            </button>
                            {/* <button
                                className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                onClick={() => handleSharePost(post)}
                            >
                                <FontAwesomeIcon icon={farShareSquare} className="mr-1" />
                                Share
                            </button> */}
                        </div>
                    </div>
                </div>

                {/* Comment Section */}
                <div className="px-6 pb-4">
                    <CommentSection
                        postId={post.postId}
                        isOpen={openCommentPosts.includes(post.postId)}
                        onToggle={() => toggleCommentSection(post.postId)}
                        commentCount={postCommentCounts[post.postId] || 0}
                        currentUserAvatar={profileData?.avatarUrl}
                        refreshTrigger={refreshCommentTrigger}
                        onCommentCountChange={(newCount) => handleCommentCountChange(post.postId, newCount)}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="body_startupdetail">
            <Navbar />
            <div className="container mx-auto my-8 px-4">
                {/* Hiển thị loading khi đang tải thông tin startup */}
                {loadingStartupInfo ? (
                    <div className="text-center py-20">
                        <div className="flex justify-center items-center">
                            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin" />
                        </div>
                        <p className="mt-4 text-gray-600">Loading startup information...</p>
                    </div>
                ) : errorStartupInfo ? (
                    <div className="text-center py-20 bg-red-50 rounded-lg">
                        <p className="text-red-500">{errorStartupInfo}</p>
                    </div>
                ) : (
                    <>
                        {/* Startup Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                            <div className="md:w-2/3">
                                <div className="text-left">
                                    <nav className="text-sm mb-2">
                                        <ol className="list-none p-0 inline-flex">
                                            <li>
                                                <Link to="/startups" className="text-blue-600 hover:underline">Startups</Link>
                                                <span className="mx-2">/</span>
                                            </li>
                                            <li className="text-gray-500">{startupInfo?.startupName || "Startup"}</li>
                                        </ol>
                                    </nav>
                                    <div className="flex items-center gap-4">
                                        {startupInfo?.logo && (
                                            <img
                                                src={startupInfo.logo}
                                                alt={`${startupInfo?.startupName || 'Startup'} logo`}
                                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                                            />
                                        )}
                                        <div>
                                            <h2 className="text-3xl font-bold mb-2">{startupInfo?.startupName || startupInfo?.abbreviationName || "Startup"}</h2>
                                            <p className="text-gray-600">{startupInfo?.vision || "Vision Statement"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:w-1/3 flex justify-end space-x-2 mt-4 md:mt-0">
                                <button
                                    className={`${isFollowingStartup
                                        ? "border border-gray-400 text-gray-600 hover:bg-gray-100 hover:text-red-600 hover:border-red-600 group"
                                        : "border border-blue-500 text-blue-500 hover:bg-blue-50"
                                        } px-4 py-2 rounded-full text-sm font-medium transition`}
                                    onClick={isFollowingStartup ? handleUnfollowAction : handleFollowAction}
                                    disabled={followStartupLoading}
                                >
                                    <FontAwesomeIcon
                                        icon={isFollowingStartup ? faUserCheck : faHeart}
                                        className={`mr-2 ${followStartupLoading ? "fa-spin" : ""}`}
                                    />
                                    {followStartupLoading
                                        ? "Processing..."
                                        : isFollowingStartup
                                            ? "Following"
                                            : "Follow"
                                    }
                                </button>
                                <button
                                    className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition"
                                    onClick={handleContactStartup}
                                >
                                    <FontAwesomeIcon icon={faHandshake} className="mr-2" /> Contact
                                </button>
                            </div>
                        </div>

                        {/* Background Image */}
                        {/* {startupInfo?.backgroundURL && (
                            <div className="w-full h-48 md:h-64 lg:h-80 rounded-lg overflow-hidden mb-6">
                                <img
                                    src={startupInfo.backgroundURL}
                                    alt={`${startupInfo?.startupName || 'Startup'} background`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )} */}

                        {/* Tabs Navigation */}
                        <ul className="flex border-b border-gray-200 mb-4">
                            {['overview', 'posts', 'bmc', 'team', 'events'].map((tab) => (
                                <li key={tab} className="mr-1">
                                    <button
                                        className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab === 'posts' ? 'Posts' : tab === 'overview' ? 'Overview' : tab === 'team' ? 'Team' : tab === 'events' ? 'Events' : 'BMC'}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Modal hiển thị danh sách người đã thích */}
                        <LikesModal
                            postId={currentPostId}
                            isOpen={showLikesModal}
                            onClose={() => setShowLikesModal(false)}
                        />

                        {/* Modal chia sẻ bài viết */}
                        <SharePostModal
                            isOpen={showShareModal}
                            onClose={() => {
                                setShowShareModal(false);
                                setPostToShare(null);
                            }}
                            post={postToShare}
                            profileData={profileData}
                            onShareSuccess={() => loadMoreFeed(1)}
                        />

                        {/* Tab Content - Thêm min-height để giảm layout shift */}
                        <div className="mt-4 min-h-[600px] relative">
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                                            <h5 className="text-lg font-semibold mb-2">Description</h5>
                                            <p className="text-gray-600">{startupInfo?.description || "No detailed description about the startup yet."}</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg shadow-md">
                                            <h5 className="text-lg font-semibold mb-2">Pitching Video</h5>
                                            {loadingPitching ? (
                                                <div className="flex justify-center items-center h-40">
                                                    <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin" />
                                                </div>
                                            ) : errorPitching ? (
                                                <div className="text-red-500 text-center py-4">{errorPitching}</div>
                                            ) : (
                                                <div>
                                                    {pitchingData.find(p => p.type === 'Video') ? (
                                                        <div className="w-full rounded-lg overflow-hidden">
                                                            <video
                                                                className="w-full h-auto rounded-lg"
                                                                controls
                                                                preload="metadata"
                                                            >
                                                                <source src={pitchingData.find(p => p.type === 'Video')?.link} type="video/mp4" />
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500">
                                                            No pitching video yet
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                                            <div className="text-left">
                                                <h5 className="text-lg font-semibold mb-2">Quick Info</h5>
                                                <ul className="list-none">
                                                    <li className="mb-2"><strong>Founded:</strong> <span>{startupInfo?.createAt ? formatDate(startupInfo.createAt) : "N/A"}</span></li>
                                                    <li className="mb-2"><strong>Status:</strong> <span>{startupInfo?.status || "N/A"}</span></li>
                                                    <li className="mb-2"><strong>Stage:</strong> <span>Stage {startupInfo?.stageId || "N/A"}</span></li>
                                                    {startupInfo?.email && (
                                                        <li className="mb-2"><strong>Email:</strong> <span>{startupInfo.email}</span></li>
                                                    )}
                                                    {startupInfo?.websiteURL && (
                                                        <li className="mb-2 flex items-center">
                                                            <strong className="mr-2">Website:</strong>
                                                            <a href={startupInfo.websiteURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                                                                <FontAwesomeIcon icon={faGlobe} className="mr-1" />
                                                                Visit
                                                            </a>
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg shadow-md">
                                            <h5 className="text-lg font-semibold mb-2">Documents</h5>
                                            {loadingPitching ? (
                                                <div className="flex justify-center items-center h-20">
                                                    <FontAwesomeIcon icon={faSpinner} className="text-2xl text-blue-500 animate-spin" />
                                                </div>
                                            ) : errorPitching ? (
                                                <div className="text-red-500 text-center py-2">{errorPitching}</div>
                                            ) : (
                                                <ul className="list-none">
                                                    {pitchingData.filter(p => p.type === 'PDF').length > 0 ? (
                                                        <>
                                                            {pitchingData.filter(p => p.type === 'PDF').slice(0, 3).map((pdfItem, index) => (
                                                                <li key={index} className="mb-2 flex items-center">
                                                                    <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-500" />
                                                                    <button
                                                                        onClick={() => setSelectedPDF(pdfItem.link)}
                                                                        className="text-blue-600 hover:underline"
                                                                    >
                                                                        {pdfItem.title || `PDF Document ${index + 1}`}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                            {pitchingData.filter(p => p.type === 'PDF').length > 3 && (
                                                                <li className="mt-2">
                                                                    <button
                                                                        onClick={() => setShowAllPDFs(true)}
                                                                        className="text-sm text-blue-500 hover:underline flex items-center"
                                                                    >
                                                                        <FontAwesomeIcon icon={faFilePdf} className="mr-1" />
                                                                        View all ({pitchingData.filter(p => p.type === 'PDF').length} PDF documents)
                                                                    </button>
                                                                </li>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <li className="text-gray-500 text-center py-2">
                                                            No PDF documents yet
                                                        </li>
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bmc' && (
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {['Đối tác chính', 'Hoạt động chính', 'Giá trị cung cấp', 'Quan hệ khách hàng', 'Phân khúc khách hàng', 'Nguồn lực chính'].map((section) => (
                                            <div key={section} className="bg-gray-50 p-4 rounded-lg">
                                                <h6 className="text-md font-semibold mb-2"> {section}</h6>
                                                <p className="text-gray-600">Nội dung cho {section}...</p>
                                            </div>
                                        ))}

                                    </div>
                                    <div className="md:col-span-2 bg-gray-50 mt-2 p-4 gap-4 rounded-lg">
                                        <h6 className="text-md font-semibold mb-2">Cấu trúc chi phí</h6>
                                        <p className="text-gray-600">Nội dung cho Cấu trúc chi phí...</p>
                                    </div>
                                    <div className="md:col-span-2 bg-gray-50 mt-2 p-4 gap-4 rounded-lg">
                                        <h6 className="text-md font-semibold mb-2">Nguồn thu</h6>
                                        <p className="text-gray-600">Nội dung cho Nguồn thu...</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'team' && (
                                <div>
                                    {loadingMembers ? (
                                        <div className="text-center py-20">
                                            <div className="flex justify-center items-center">
                                                <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin" />
                                            </div>
                                            <p className="mt-4 text-gray-600">Đang tải danh sách thành viên...</p>
                                        </div>
                                    ) : teamMembers.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50 rounded-lg">
                                            <p className="text-gray-500">Chưa có thành viên</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            {teamMembers.map((member) => (
                                                <div key={member.accountId} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-shadow duration-300">
                                                    <img
                                                        src={member.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                                        className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-white"
                                                        alt={member.userName || "Member"}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                                        }}
                                                    />
                                                    <h5 className="text-lg font-semibold">{member.fullName || "Unknown"}</h5>
                                                    <p className="text-gray-600">{member.roleName || "Member"}</p>
                                                    {member.email && (
                                                        <p className="text-gray-500 text-sm mt-2">{member.email}</p>
                                                    )}
                                                    <div className="flex justify-center space-x-2 mt-3">
                                                        {member.accountId != accountId && (
                                                            <button
                                                                className={` px-3 py-1 rounded-full text-sm flex items-center transition-colors ${isFollowing(member.accountId)
                                                                    ? "border border-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-red-600 hover:border-red-600 group"
                                                                    : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                                                                    }`}
                                                                onClick={() =>
                                                                    isFollowing(member.accountId)
                                                                        ? handleUnfollowAction(member.accountId)
                                                                        : handleFollowAction(member.accountId)
                                                                }
                                                                disabled={processingId === member.accountId}
                                                            >
                                                                {isFollowing(member.accountId) ? (
                                                                    <>
                                                                        <FontAwesomeIcon
                                                                            icon={faUserCheck}
                                                                            className="mr-2 group-hover:hidden"
                                                                        />
                                                                        <FontAwesomeIcon
                                                                            icon={faUserMinus}
                                                                            className="mr-2 hidden group-hover:inline-block"
                                                                        />
                                                                        <span className="group-hover:hidden">
                                                                            {processingId === member.accountId ? 'Đang xử lý...' : 'Đang theo dõi'}
                                                                        </span>
                                                                        <span className="hidden group-hover:inline">
                                                                            Bỏ theo dõi
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                                                        {processingId === member.accountId ? 'Đang xử lý...' : 'Theo dõi'}
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                        {member.linkedinUrl && (
                                                            <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="border border-blue-500 text-blue-500 px-3 py-1 rounded-full text-sm hover:bg-blue-50 transition">
                                                                <FontAwesomeIcon icon={faLinkedin} className="mr-1" /> Kết nối
                                                            </a>
                                                        )}
                                                        {member.twitterUrl && (
                                                            <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="border border-blue-400 text-blue-400 px-3 py-1 rounded-full text-sm hover:bg-blue-50 transition">
                                                                <FontAwesomeIcon icon={faTwitter} className="mr-1" /> Theo dõi
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'events' && (
                                <div className="space-y-4">
                                    <div className="bg-white p-6 rounded-lg shadow-md">
                                        <h5 className="text-lg font-semibold mb-2">Tên sự kiện</h5>
                                        <p className="text-gray-600 mb-2 flex items-center">
                                            <FontAwesomeIcon icon={faCalendar} className="mr-2" /> Ngày
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="ml-4 mr-2" /> Địa điểm
                                        </p>
                                        <p className="text-gray-600">Mô tả sự kiện...</p>
                                        <div className="text-right">
                                            <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded-full text-sm hover:bg-blue-50 transition">
                                                <FontAwesomeIcon icon={faCalendarPlus} className="mr-2" /> Thêm vào lịch
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'posts' && (
                                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-auto w-[1000px]">
                                    {/* Feed Posts Section */}
                                    <div className="bg-white p-6 rounded-lg shadow-md mb-6  " >
                                        <h5 className="text-xl font-semibold mb-4">Feed Posts</h5>

                                        {loadingFeed ? (
                                            <div className="text-center py-20">
                                                <div className="flex justify-center items-center">
                                                    <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin" />
                                                </div>
                                                <p className="mt-4 text-gray-600">Loading feed posts...</p>
                                            </div>
                                        ) : feedPosts.length === 0 ? (
                                            <div className="text-center py-20 bg-gray-50 rounded-lg">
                                                <p className="text-gray-500">No posts yet</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {feedPosts.map(post => renderPost(post))}

                                                {/* Load More Button for Feed */}
                                                <div className="flex justify-center mt-6">
                                                    {isLoadingMoreFeed ? (
                                                        <div className="flex items-center space-x-2">
                                                            <FontAwesomeIcon icon={faSpinner} className="text-blue-500 animate-spin" />
                                                            <span className="text-gray-600">Loading...</span>
                                                        </div>
                                                    ) : hasMoreFeed ? (
                                                        <button
                                                            className="px-6 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 transition font-medium"
                                                            onClick={loadMoreFeed}
                                                        >
                                                            Load more
                                                        </button>
                                                    ) : feedPosts.length > 0 ? (
                                                        <p className="text-gray-500 text-sm">Shown all posts
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* PDF Viewer Modal */}
            {selectedPDF && (
                <PDFViewer
                    pdfUrl={selectedPDF}
                    onClose={() => setSelectedPDF(null)}
                />
            )}

            {/* All PDFs Modal */}
            {showAllPDFs && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-medium">All PDF Documents</h3>
                            <button
                                onClick={() => setShowAllPDFs(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                x
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 flex-1">
                            <ul className="divide-y divide-gray-200">
                                {pitchingData.filter(p => p.type === 'PDF').map((pdfItem, index) => (
                                    <li key={index} className="py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <FontAwesomeIcon icon={faFilePdf} className="mr-3 text-red-500 text-xl" />
                                                <div>
                                                    <h4 className="font-medium">{pdfItem.title || `PDF Document ${index + 1}`}</h4>
                                                    {pdfItem.description && <p className="text-sm text-gray-500">{pdfItem.description}</p>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedPDF(pdfItem.link);
                                                    setShowAllPDFs(false);
                                                }}
                                                className="bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 text-sm"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Player Modal */}
            {/* {selectedVideo && (
                <VideoPlayer
                    videoUrl={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                />
            )} */}
        </div>
    );
};

export default StartupDetail;
