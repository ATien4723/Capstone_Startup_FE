import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faPlus, faImage, faPaperclip, faHeart, faComment, faEye, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart, faComment as farComment, faEnvelope as farEnvelope } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';

const Home = () => {
    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />
            <div className="container mx-auto pt-20 px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left Column - Profile Card */}
                    <div className="space-y-6 hidden md:block md:col-span-1">
                        {/* Profile Card */}
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="h-20 bg-blue-600 rounded-t-lg"></div>
                            <div className="text-center pt-0 px-4 pb-4">
                                <img
                                    src="/api/placeholder/100/100"
                                    alt="John Doe"
                                    className="w-24 h-24 rounded-full border-4 border-white -mt-12 object-cover"
                                />
                                <h5 className="font-bold mt-3">John Doe</h5>
                                <p className="text-gray-600 text-sm">Graphic Designer at Self Employed</p>
                                <div className="grid grid-cols-2 mt-3">
                                    <div className="text-center">
                                        <div className="font-bold text-lg">34</div>
                                        <div className="text-gray-600">Following</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg">155</div>
                                        <div className="text-gray-600">Followers</div>
                                    </div>
                                </div>
                                <Link
                                    to="/public-profile"
                                    className="block w-full mt-3 py-1 border border-gray-400 text-gray-700 rounded-full text-sm hover:bg-gray-100 transition-all"
                                >
                                    View Public Profile
                                </Link>
                            </div>
                        </div>

                        {/* Suggestions Card */}
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold">Suggestions</span>
                                    <FontAwesomeIcon icon={faEllipsisH} className="text-gray-600" />
                                </div>
                                {[
                                    { name: 'Jessica William', role: 'Graphic Designer' },
                                    { name: 'John Doe', role: 'PHP Developer' },
                                    { name: 'Poonam', role: 'Wordpress Developer' },
                                    { name: 'Bill Gates', role: 'C & C++ Developer' },
                                    { name: 'Jessica William', role: 'Graphic Designer' },
                                    { name: 'John Doe', role: 'PHP Developer' },
                                ].map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center mb-3 p-2 hover:bg-gray-50 rounded-md transition-all"
                                    >
                                        <img
                                            src="/api/placeholder/40/40"
                                            alt={suggestion.name}
                                            className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                        />
                                        <div className="ml-3 flex-grow">
                                            <div className="font-bold text-base">{suggestion.name}</div>
                                            <div className="text-gray-600 text-sm">{suggestion.role}</div>
                                        </div>
                                        <button className="text-gray-600 hover:text-blue-600 transition-all">
                                            <FontAwesomeIcon icon={faPlus} />
                                        </button>
                                    </div>
                                ))}
                                <Link to="#" className="block text-center mt-3 text-blue-600 text-sm hover:underline">
                                    View More
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column - Posts */}
                    <div className="md:col-span-2">
                        {/* Post Buttons */}
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

                        {/* Job Post */}
                        <div className="bg-white rounded-lg shadow-md mb-6">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center">
                                        <img
                                            src="/api/placeholder/40/40"
                                            alt="John Doe"
                                            className="w-9 h-9 rounded-full border-2 border-white/20 object-cover mr-3"
                                        />
                                        <div>
                                            <div className="font-bold">John Doe</div>
                                            <div className="text-gray-600 text-sm">3 min ago</div>
                                        </div>
                                    </div>
                                    <FontAwesomeIcon icon={faEllipsisH} className="text-gray-600" />
                                </div>
                                <div className="flex mb-2">
                                    <span className="bg-blue-500 text-white px-2 py-1 rounded mr-2 text-xs">Epic Coder</span>
                                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">India</span>
                                </div>
                                <h5 className="text-lg font-bold">Senior Wordpress Developer</h5>
                                <div className="flex items-center mb-3">
                                    <span className="bg-blue-600 text-white px-2 py-1 rounded mr-3 text-xs">Full Time</span>
                                    <span className="font-bold text-green-500">$30 / hr</span>
                                </div>
                                <p className="text-gray-600">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus hendrerit metus, ut ullamcorper quam finibus at. Etiam id magna sit amet...
                                    <Link to="#" className="text-blue-600 hover:underline">view more</Link>
                                </p>
                                <div className="flex flex-wrap mb-3">
                                    {['HTML', 'PHP', 'CSS', 'Javascript', 'Wordpress'].map((tag, index) => (
                                        <span
                                            key={index}
                                            className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full mr-2 mb-2 text-xs"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    <div className="space-x-2">
                                        <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
                                            <FontAwesomeIcon icon={farHeart} className="mr-1" /> Like
                                            <span className="bg-blue-600 text-white px-2 py-1 rounded-full ml-1 text-xs">25</span>
                                        </button>
                                        <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all">
                                            <FontAwesomeIcon icon={farComment} className="mr-1" /> Comment
                                            <span className="bg-orange-500 text-white px-2 py-1 rounded-full ml-1 text-xs">15</span>
                                        </button>
                                    </div>
                                    <div>
                                        <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs">
                                            <FontAwesomeIcon icon={faEye} className="mr-1" /> Views 50
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Profiles Section */}
                        <div className="bg-white rounded-lg shadow-md mb-6">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold">Top Profiles</span>
                                    <FontAwesomeIcon icon={faEllipsisH} className="text-gray-600" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {Array(3).fill().map((_, index) => (
                                        <div key={index} className="text-center">
                                            <img
                                                src="/api/placeholder/80/80"
                                                alt="John Doe"
                                                className="w-20 h-20 rounded-full border-4 border-white object-cover mx-auto mb-2"
                                            />
                                            <h6 className="mb-1 font-semibold">John Doe</h6>
                                            <p className="text-gray-600 text-sm mb-2">Graphic Designer</p>
                                            <div className="flex justify-center mb-2 space-x-1">
                                                <button className="bg-green-500 text-white px-3 py-1 rounded-full text-xs hover:bg-green-600 transition-all">
                                                    Follow
                                                </button>
                                                <button className="bg-white text-blue-600 border border-blue-600 px-2 py-1 rounded-full text-xs hover:bg-blue-50 transition-all">
                                                    <FontAwesomeIcon icon={farEnvelope} />
                                                </button>
                                                <button className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs hover:bg-blue-700 transition-all">
                                                    Hire
                                                </button>
                                            </div>
                                            <Link to="#" className="text-blue-600 text-sm hover:underline">
                                                View Profile
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Another Job Post */}
                        <div className="bg-white rounded-lg shadow-md mb-6">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center">
                                        <img
                                            src="/api/placeholder/40/40"
                                            alt="John Doe"
                                            className="w-9 h-9 rounded-full border-2 border-white/20 object-cover mr-3"
                                        />
                                        <div>
                                            <div className="font-bold">John Doe</div>
                                            <div className="text-gray-600 text-sm">3 min ago</div>
                                        </div>
                                    </div>
                                    <FontAwesomeIcon icon={faEllipsisH} className="text-gray-600" />
                                </div>
                                <div className="flex mb-2">
                                    <span className="bg-blue-500 text-white px-2 py-1 rounded mr-2 text-xs">Epic Coder</span>
                                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">India</span>
                                </div>
                                <div className="flex justify-end mt-3">
                                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all">
                                        Bid Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Jobs and Ads */}
                    <div className="space-y-6 hidden md:block md:col-span-1">
                        {/* Time Tracking Banner */}
                        <div className="bg-white rounded-lg shadow-md text-center">
                            <div className="p-4">
                                <img
                                    src="/api/placeholder/50/50"
                                    alt="WorkWise Logo"
                                    className="w-12 h-12 mx-auto mb-3"
                                />
                                <h5 className="font-bold text-lg">Track Time on WorkWise</h5>
                                <p className="text-gray-600 text-sm">Pay only for the Hours worked</p>
                                <hr className="my-3" />
                                <h6 className="font-bold">SIGN UP</h6>
                                <Link to="#" className="block mt-2 text-blue-600 text-sm hover:underline">
                                    Learn More
                                </Link>
                            </div>
                        </div>

                        {/* Top Jobs Card */}
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold">Top Jobs</span>
                                    <FontAwesomeIcon icon={faEllipsisH} className="text-gray-600" />
                                </div>
                                {[
                                    'Senior Product Designer',
                                    'Senior UI / UX Designer',
                                    'Junior Seo Designer',
                                    'Senior PHP Designer',
                                    'Senior Developer Designer',
                                ].map((job, index) => (
                                    <div
                                        key={index}
                                        className={`py-3 ${index < 4 ? 'border-b border-gray-200' : ''}`}
                                    >
                                        <h6 className="font-semibold">{job}</h6>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 text-sm">
                                                Lorem ipsum dolor sit amet, consectetur adipiscing elit..
                                            </span>
                                            <span className="font-bold text-green-500">$25/hr</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Most Viewed Jobs */}
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold">Most Viewed This Week</span>
                                    <FontAwesomeIcon icon={faEllipsisH} className="text-gray-600" />
                                </div>
                                <div className="py-3 border-b border-gray-200">
                                    <h6 className="font-semibold">Senior Product Designer</h6>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 text-sm">
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit..
                                        </span>
                                        <span className="font-bold text-green-500">$25/hr</span>
                                    </div>
                                </div>
                                <div className="py-3">
                                    <h6 className="font-semibold">Senior UI / UX Designer</h6>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit..
                                        </span>
                                        <div className="flex items-center">
                                            <img
                                                src="/api/placeholder/30/30"
                                                alt="Profile"
                                                className="w-8 h-8 rounded-full mr-1"
                                            />
                                            <img
                                                src="/api/placeholder/30/30"
                                                alt="Profile"
                                                className="w-8 h-8 rounded-full mr-1"
                                            />
                                            <span className="bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">
                                                2
                                            </span>
                                        </div>
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

export default Home;