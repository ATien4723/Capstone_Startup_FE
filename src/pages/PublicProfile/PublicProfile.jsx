import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCamera, faMapMarkerAlt, faImage, faPaperclip, faEllipsisH, faFileAlt, faGlobe, faBriefcase, faHeart, faComment, faShareSquare, faSmile } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faHeart as farHeart, faComment as farComment, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';

const PublicProfile = () => {
    const [showPostModal, setShowPostModal] = useState(false);

    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />

            {/* Cover Image Section */}
            <div className="container mb-2 mx-auto rounded-bl-lg rounded-br-lg  relative h-60 bg-gray-400 rounded-b-lg mt-4">
                <img
                    src=""
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

                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="text-center p-4 relative">
                                <div className="flex justify-center">
                                    <div className="-mt-20">
                                        <div className="relative">
                                            <img
                                                src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                                alt="Avatar"
                                                className="w-40 h-40 rounded-full border-4 border-white bg-gray-200 object-cover shadow"
                                            />
                                            <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full text-gray-700 shadow hover:bg-gray-100">
                                                <FontAwesomeIcon icon={faCamera} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {/* Avatar removed from here */}
                                <h4 className="font-bold text-xl">John Doe</h4>
                                <p className="text-gray-600 mb-3">Software Developer</p>
                                <p className="text-gray-600 mb-3">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> Country
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center mb-4">
                                    <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full shadow-sm focus:outline-none">All Post</button>
                                    <button className="px-6 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-full shadow-sm bg-white hover:bg-blue-50 focus:outline-none">Media</button>
                                </div>
                                <div className="grid grid-cols-3 mb-4">
                                    <div className="text-center">
                                        <h6 className="font-semibold">Posts</h6>
                                        <span>245</span>
                                    </div>
                                    <div className="text-center">
                                        <h6 className="font-semibold">Following</h6>
                                        <span>534</span>
                                    </div>
                                    <div className="text-center">
                                        <h6 className="font-semibold">Followers</h6>
                                        <span>845</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Link to="#" target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                        <FontAwesomeIcon icon={faFileAlt} className="mr-2" /> CV Link
                                    </Link>
                                    <Link to="#" target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                        <FontAwesomeIcon icon={faGlobe} className="mr-2" /> Personal Website
                                    </Link>
                                    <Link to="#" target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                        <FontAwesomeIcon icon={faBriefcase} className="mr-2" /> Portfolio
                                    </Link>
                                    <Link to="#" target="_blank" className="flex items-center text-gray-600 hover:text-blue-600 transition-all">
                                        <FontAwesomeIcon icon={faLinkedin} className="mr-2" /> LinkedIn
                                    </Link>
                                </div>
                                <div className="mt-4 text-left">
                                    <h6 className="font-semibold mb-3">About Me</h6>
                                    <p className="text-gray-600">
                                        Short introduction about the user goes here. This can be a brief description of their professional background and interests.
                                    </p>
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
                                        src="/api/placeholder/40/40"
                                        alt="Profile"
                                        className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                    />
                                    <div className="flex-grow">
                                        <button
                                            className="w-full p-3 border border-gray-200 rounded-lg text-left text-gray-500"
                                            onClick={() => setShowPostModal(true)}
                                        >
                                            Bạn muốn nói về chủ đề gì?
                                        </button>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="space-x-2">
                                                <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
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



                        {/* Posts List */}
                        <div className="bg-white rounded-lg shadow-md mb-6">
                            <div className="p-4">
                                <div className="flex justify-between mb-3">
                                    <div className="flex gap-3">
                                        <img
                                            src="/api/placeholder/40/40"
                                            alt="Profile"
                                            className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                        />
                                        <div>
                                            <h6 className="font-semibold mb-0">John Doe</h6>
                                            <small className="text-gray-600">Posted 3 hours ago</small>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button className="text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faEllipsisH} />
                                        </button>
                                        {/* Dropdown menu (simplified for demo) */}
                                        <div className="absolute top-8 right-0 w-32 bg-white rounded-lg shadow-lg py-2 hidden">
                                            <Link to="#" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">Edit</Link>
                                            <Link to="#" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">Delete</Link>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-bold text-lg">Sample Post Title</h5>
                                    <p className="text-gray-600">This is a sample post content. It can contain text, images, or other media.</p>
                                    <img
                                        src="/api/placeholder/600/400"
                                        alt="Post Image"
                                        className="w-full rounded-lg mt-3"
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
                                            <FontAwesomeIcon icon={farHeart} className="mr-1" /> Like
                                        </button>
                                        <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
                                            <FontAwesomeIcon icon={farComment} className="mr-1" /> Comment
                                        </button>
                                        <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
                                            <FontAwesomeIcon icon={farShareSquare} className="mr-1" /> Share
                                        </button>
                                    </div>
                                    <div className="text-gray-600 text-sm">
                                        <FontAwesomeIcon icon={farHeart} className="mr-1" /> 24 likes
                                        <FontAwesomeIcon icon={farComment} className="ml-2 mr-1" /> 3 comments
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showPostModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg w-full max-w-xl shadow-lg relative">
                        {/* Nút đóng */}
                        <button
                            className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPostModal(false)}
                        >
                            &times;
                        </button>
                        {/* Header */}
                        <div className="flex items-center gap-3 p-6 border-b">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                alt="Avatar"
                                className="w-12 h-12 rounded-full"
                            />
                            <div>
                                <div className="font-semibold">Anh Tiến Lê</div>
                                <div className="text-xs text-gray-500">Đăng bài ở chế độ Bất cứ ai</div>
                            </div>
                        </div>
                        {/* Nội dung */}
                        <div className="p-6">
                            <textarea
                                className="w-full border-none outline-none resize-none text-lg"
                                rows={4}
                                placeholder="Bạn muốn nói về chủ đề gì?"
                            />
                            {/* Các nút icon, hình ảnh, emoji... */}
                            <div className="flex items-center gap-3 mt-4">
                                <FontAwesomeIcon icon={faSmile} />
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="flex justify-end p-4 border-t">
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold" onClick={() => setShowPostModal(false)}>
                                Đăng bài
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicProfile;