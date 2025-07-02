import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHandshake, faCalendar, faMapMarkerAlt, faCalendarPlus, faTrophy, faUsers, faGlobe, faFilePdf, faFileAlt, faSpinner, faComment, faShareAlt, faBriefcase, faLocationDot, faClock } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faComment as farComment, faHeart as farHeart, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import useStartupDetail from '@/hooks/useStartupDetail';
import { useState } from 'react';
import PostMediaGrid from '@/components/PostMedia/PostMediaGrid';
import CommentSection from '@/components/CommentSection/CommentSection';
import LikesModal, { LikeCounter } from '@/components/Common/LikesModal';
import SharePostModal from '@/components/Common/SharePostModal';
import SharedPost from '@/components/PostMedia/SharedPost';

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
        postLikes,
        userLikedPosts,
        postCommentCounts,
        openCommentPosts,
        refreshCommentTrigger,
        profileData,

        // Actions/Methods
        setActiveTab,
        loadMoreFeed,
        formatDate,
        handleLikePost,
        toggleCommentSection,
        handleCommentCountChange,
        handleSharePost
    } = useStartupDetail();

    // State cho modal hiển thị danh sách người đã thích và chia sẻ bài viết
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [postToShare, setPostToShare] = useState(null);

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
                    key={post.postId}
                    className="bg-white border border-gray-200 hover:border-blue-200 rounded-lg shadow hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => goToPostDetail(post.postId, post.type)}
                >
                    <div className="p-5">
                        <div className="flex items-center mb-4">
                            <img
                                src={post.avatarURL || "https://via.placeholder.com/40"}
                                alt={post.name || "User"}
                                className="h-12 w-12 rounded-full object-cover mr-3 border-2 border-gray-100"
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h5 className="font-medium">{post.name || "User"}</h5>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                            <FontAwesomeIcon icon={faBriefcase} className="mr-1" />
                                            Pro
                                        </span>
                                    </div>
                                    <div className="text-sm text-green-600 font-medium">
                                        Thoả thuận
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h3 className="font-bold text-xl mb-3 text-gray-800">{post.de}</h3>

                        <div className="mb-4 flex flex-wrap gap-2">
                            <div className="text-gray-600 flex items-center text-sm">
                                <FontAwesomeIcon icon={faLocationDot} className="mr-1.5 text-gray-500" />
                                Hà Nội
                            </div>
                            <div className="text-gray-600 flex items-center text-sm ml-4">
                                <FontAwesomeIcon icon={faClock} className="mr-1.5 text-gray-500" />
                                1 năm
                            </div>
                        </div>

                        <div className="mt-4 flex items-center">
                            <button className="flex items-center text-sm text-blue-600">
                                <FontAwesomeIcon icon={faComment} className="mr-1.5" />
                                Vì sao việc làm này phù hợp với bạn?
                            </button>
                        </div>

                        <div className="text-right text-xs text-gray-500 mt-2">
                            Đăng {formatDate(post.createdAt)}
                        </div>
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
                                    {formatDate(post.createdAt)}
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
                        <p className="text-gray-800 whitespace-pre-wrap break-words mb-3">{post.content}</p>

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
                            <div className="text-sm text-gray-600">
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
                            <button
                                className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all"
                                onClick={() => handleSharePost(post)}
                            >
                                <FontAwesomeIcon icon={farShareSquare} className="mr-1" />
                                Share
                            </button>
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
                                    <li className="text-gray-500">Startup Name</li>
                                </ol>
                            </nav>
                            <h2 className="text-3xl font-bold mb-2">Startup Name</h2>
                            <p className="text-gray-600">Vision Statement</p>
                        </div>
                    </div>

                    <div className="md:w-1/3 flex justify-end space-x-2 mt-4 md:mt-0">
                        <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-50 transition">
                            <FontAwesomeIcon icon={faHeart} className="mr-2" /> Follow
                        </button>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition">
                            <FontAwesomeIcon icon={faHandshake} className="mr-2" /> Contact
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <ul className="flex border-b border-gray-200 mb-4">
                    {['overview', 'posts', 'bmc', 'team', 'events'].map((tab) => (
                        <li key={tab} className="mr-1">
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'posts' ? 'Post' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                    onShareSuccess={() => fetchStartupFeed(1)}
                />

                {/* Tab Content - Thêm min-height để giảm layout shift */}
                <div className="mt-4 min-h-[600px] relative">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                                    <h5 className="text-lg font-semibold mb-2">Description</h5>
                                    <p className="text-gray-600">Detailed description of the startup...</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h5 className="text-lg font-semibold mb-2">Pitch Video</h5>
                                    <div className="relative w-full" style={{ paddingBottom: '40%' }}>
                                        <iframe
                                            src="https://www.youtube.com/embed/heMYSOZoT3c?list=RDEMmSFWFZQW1IjCwi6P37MwFw"
                                            title="AAAA Video"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                        ></iframe>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                                    <div className="text-left">
                                        <h5 className="text-lg font-semibold mb-2">Quick Info</h5>
                                        <ul className="list-none">
                                            <li className="mb-2"><strong>Founded:</strong> <span>Tiendz</span></li>
                                            <li className="mb-2"><strong>Category:</strong> <span>OK</span></li>
                                            <li className="mb-2"><strong>Status:</strong> <span>OK</span></li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h5 className="text-lg font-semibold mb-2">Documents</h5>
                                    <ul className="list-none">
                                        <li className="mb-2 flex items-center">
                                            <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-500" />
                                            <a href="#" className="text-blue-600 hover:underline">Pitch Deck</a>
                                        </li>
                                        <li className="mb-2 flex items-center">
                                            <FontAwesomeIcon icon={faFileAlt} className="mr-2 text-gray-500" />
                                            <a href="#" className="text-blue-600 hover:underline">Business Plan</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bmc' && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['Key Partners', 'Key Activities', 'Value Propositions', 'Customer Relationships', 'Customer Segments', 'Key Resources'].map((section) => (
                                    <div key={section} className="bg-gray-50 p-4 rounded-lg">
                                        <h6 className="text-md font-semibold mb-2"> {section}</h6>
                                        <p className="text-gray-600">Content for {section}...</p>
                                    </div>
                                ))}

                            </div>
                            <div className="md:col-span-2 bg-gray-50 mt-2 p-4 gap-4 rounded-lg">
                                <h6 className="text-md font-semibold mb-2">Cost Structure</h6>
                                <p className="text-gray-600">Content for Cost Structure...</p>
                            </div>
                            <div className="md:col-span-2 bg-gray-50 mt-2 p-4 gap-4 rounded-lg">
                                <h6 className="text-md font-semibold mb-2">Revenue Streams</h6>
                                <p className="text-gray-600">Content for Revenue Streams...</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {teamMembers.map((member) => (
                                    <div key={member.name} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-shadow duration-300">
                                        <img src={member.img} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-white" alt={member.name} />
                                        <h5 className="text-lg font-semibold">{member.name}</h5>
                                        <p className="text-gray-600">{member.role}</p>
                                        <p className="text-gray-500 text-sm mt-2">{member.bio}</p>
                                        <div className="flex justify-center space-x-2 mt-3">
                                            <a href="#" className="border border-blue-500 text-blue-500 px-3 py-1 rounded-full text-sm hover:bg-blue-50 transition">
                                                <FontAwesomeIcon icon={faLinkedin} className="mr-1" /> Connect
                                            </a>
                                            <a href="#" className="border border-blue-400 text-blue-400 px-3 py-1 rounded-full text-sm hover:bg-blue-50 transition">
                                                <FontAwesomeIcon icon={faTwitter} className="mr-1" /> Follow
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                                <h5 className="text-lg font-semibold mb-4">Team Achievements</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { icon: faTrophy, value: '15+', label: 'Industry Awards', color: 'text-blue-500' },
                                        { icon: faUsers, value: '8', label: 'Patents Filed', color: 'text-green-500' },
                                        { icon: faUsers, value: '50+', label: 'Team Members', color: 'text-teal-500' },
                                        { icon: faGlobe, value: '12', label: 'Countries', color: 'text-yellow-500' },
                                    ].map((achievement) => (
                                        <div key={achievement.label} className="text-center">
                                            <FontAwesomeIcon icon={achievement.icon} className={`text-4xl ${achievement.color} mb-2`} />
                                            <h3 className="text-2xl font-bold mb-1">{achievement.value}</h3>
                                            <p className="text-gray-600">{achievement.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'events' && (
                        <div className="space-y-4">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h5 className="text-lg font-semibold mb-2">Event Title</h5>
                                <p className="text-gray-600 mb-2 flex items-center">
                                    <FontAwesomeIcon icon={faCalendar} className="mr-2" /> Date
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="ml-4 mr-2" /> Location
                                </p>
                                <p className="text-gray-600">Event description...</p>
                                <div className="text-right">
                                    <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded-full text-sm hover:bg-blue-50 transition">
                                        <FontAwesomeIcon icon={faCalendarPlus} className="mr-2" /> Add to Calendar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-auto w-[1000px]">
                            {/* Feed Posts Section */}
                            <div className="bg-white p-6 rounded-lg shadow-md mb-6  " >
                                <h5 className="text-xl font-semibold mb-4">Bài đăng gần đây</h5>

                                {loadingFeed ? (
                                    <div className="text-center py-20">
                                        <div className="flex justify-center items-center">
                                            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin" />
                                        </div>
                                        <p className="mt-4 text-gray-600">Đang tải bài đăng...</p>
                                    </div>
                                ) : feedPosts.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500">Chưa có bài đăng nào</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {feedPosts.map(post => renderPost(post))}

                                        {/* Load More Button for Feed */}
                                        <div className="flex justify-center mt-6">
                                            {isLoadingMoreFeed ? (
                                                <div className="flex items-center space-x-2">
                                                    <FontAwesomeIcon icon={faSpinner} className="text-blue-500 animate-spin" />
                                                    <span className="text-gray-600">Đang tải thêm...</span>
                                                </div>
                                            ) : hasMoreFeed ? (
                                                <button
                                                    className="px-6 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 transition font-medium"
                                                    onClick={loadMoreFeed}
                                                >
                                                    Xem thêm bài đăng
                                                </button>
                                            ) : feedPosts.length > 0 ? (
                                                <p className="text-gray-500 text-sm">Đã hiển thị tất cả bài đăng</p>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StartupDetail;