import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHandshake, faCalendar, faMapMarkerAlt, faCalendarPlus, faTrophy, faUsers, faGlobe, faFilePdf, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import Navbar from '@components/Navbar/Navbar';

const StartupDetail = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const teamMembers = [
        { name: 'John Smith', role: 'CEO & Founder', bio: '10+ years experience in tech leadership and startup management.', img: 'https://randomuser.me/api/portraits/men/1.jpg' },
        { name: 'Sarah Johnson', role: 'CTO', bio: 'Former Google engineer with expertise in AI and machine learning.', img: 'https://randomuser.me/api/portraits/women/1.jpg' },
        { name: 'Michael Chen', role: 'Head of Product', bio: 'Product strategist with experience at top tech companies.', img: 'https://randomuser.me/api/portraits/men/2.jpg' },
        { name: 'Emily Davis', role: 'Marketing Director', bio: 'Digital marketing expert with focus on growth strategies.', img: 'https://randomuser.me/api/portraits/women/2.jpg' },
    ];

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
                    {['overview', 'bmc', 'team', 'events'].map((tab) => (
                        <li key={tab} className="mr-1">
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        </li>
                    ))}
                </ul>

                {/* Tab Content */}
                <div className="mt-4">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                                    <h5 className="text-lg font-semibold mb-2">Description</h5>
                                    <p className="text-gray-600">Detailed description of the startup...</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h5 className="text-lg font-semibold mb-2">Pitch Video</h5>
                                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
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
                </div>
            </div>
        </div>
    );
};

export default StartupDetail;