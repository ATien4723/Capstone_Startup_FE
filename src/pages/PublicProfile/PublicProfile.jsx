import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCamera, faMapMarkerAlt, faImage, faPaperclip, faEllipsisH, faFileAlt, faGlobe, faBriefcase, faHeart, faComment, faShareSquare } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faHeart as farHeart, faComment as farComment, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';

const PublicProfile = () => {
    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />

            {/* Profile Cover */}
            <div className=" mt-10 bg-blue-600">
                <div className=" inset-0 bg-black/20"></div>
                <button className="absolute top-3 right-3 bg-white px-3 py-1 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-all z-10">
                    <FontAwesomeIcon icon={faEdit} className="mr-1" /> Edit Cover
                </button>
            </div>

            <div className="container mx-auto pt-8 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="text-center p-4 relative">
                                <div className="relative">
                                    <img
                                        src="/api/placeholder/150/150"
                                        alt="Profile Picture"
                                        className="w-32 h-32 rounded-full border-4 border-white mx-auto object-cover"
                                    />
                                    <button className="absolute bottom-0 right-1/3 bg-white p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-all">
                                        <FontAwesomeIcon icon={faCamera} />
                                    </button>
                                </div>
                                <h4 className="mt-3 font-bold text-xl">John Doe</h4>
                                <p className="text-gray-600 mb-3">Software Developer</p>
                                <p className="text-gray-600 mb-3">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> Country
                                </p>
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
                                        <textarea
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                            placeholder="Share your thoughts..."
                                            rows="3"
                                        />
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

                        {/* Posts Filter */}
                        <div className="bg-white rounded-lg shadow-md mb-6">
                            <div className="p-4">
                                <div className="flex flex-wrap gap-2">
                                    {['All Posts', 'Articles', 'Projects', 'Media'].map((tab, index) => (
                                        <Link
                                            key={index}
                                            to="#"
                                            className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all ${index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {tab}
                                        </Link>
                                    ))}
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
        </div>
    );
};

export default PublicProfile;