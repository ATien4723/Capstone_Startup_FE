import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faFilter, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import Navbar from '@components/Navbar/Navbar';

const Startups = () => {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeFundingStage, setActiveFundingStage] = useState('');

    const toggleFilters = () => setIsFiltersOpen(!isFiltersOpen);

    const categories = ['All', 'Technology', 'Healthcare', 'E-commerce', 'FinTech', 'Education', 'Sustainability', 'AI/ML'];
    const fundingStages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+'];

    const categoryColors = {
        Technology: 'bg-blue-600',
        FinTech: 'bg-blue-400',
        Healthcare: 'bg-yellow-500',
        Education: 'bg-green-500',
        'E-commerce': 'bg-red-500',
        Sustainability: 'bg-green-600',
        'AI/ML': 'bg-purple-500',
    };

    const featuredStartups = [
        {
            id: 1,
            name: 'EcoTech Solutions',
            description: 'Revolutionizing renewable energy storage with AI-powered solutions',
            category: 'Technology',
            image: 'https://ecotechsolutions.org/wp-content/uploads/2024/08/Ecotech-Logo.jpg',
            fundingProgress: 75,
            raised: '$2.5M',
            teamSize: 15,
            stage: 'Series A',
            founder: { name: 'Sarah Johnson', role: 'Founder & CEO', image: '/api/placeholder/30/30' },
        },
        {
            id: 2,
            name: 'FinFlow',
            description: 'Next-generation payment processing platform for small businesses',
            category: 'FinTech',
            image: 'https://finflow.in/images/logo.svg',
            fundingProgress: 60,
            raised: '$1.8M',
            teamSize: 12,
            stage: 'Seed',
            founder: { name: 'Michael Chen', role: 'Co-founder', image: '/api/placeholder/30/30' },
        },
    ];

    const allStartups = [
        {
            id: 3,
            name: 'MedTech AI',
            description: 'AI-powered diagnostic tools for healthcare professionals',
            category: 'Healthcare',
            image: 'https://media.licdn.com/dms/image/v2/D4D12AQGJVlk-Ufg7ZA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1690444617341?e=2147483647&v=beta&t=Rx1bWyzjB5cd7lZcaOsn9UhM6fEvyUUUOABVLM-809g',
            raised: '$3.2M',
            teamSize: 20,
            stage: 'Series A',
        },
        {
            id: 4,
            name: 'EduLearn',
            description: 'Personalized learning platform for K-12 students',
            category: 'Education',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRccNVC-fX7quSyWv7Jw7IF0aCmhe_LpVcnXA&s',
            raised: '$800K',
            teamSize: 8,
            stage: 'Seed',
        },
        {
            id: 5,
            name: 'ShopSmart',
            description: 'AI-powered personalized shopping experience',
            category: 'E-commerce',
            image: 'https://static.betterretailing.com/wp-content/uploads/2021/12/30101029/Shopsmart.jpg',
            raised: '$1.5M',
            teamSize: 12,
            stage: 'Series A',
        },
    ];

    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />
            <div className="container mx-auto pt-20 px-4">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Discover Startups</h2>
                    <Link to="#" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Your Startup
                    </Link>
                </div>

                {/* Search and Filters Section */}
                <div className="bg-white rounded-xl shadow-md p-5 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex">
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="Search startups by name, category, or location..."
                            />
                            <button className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 transition-all">
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                <option>Sort By</option>
                                <option>Newest First</option>
                                <option>Most Funded</option>
                                <option>Most Popular</option>
                            </select>
                            <button
                                onClick={toggleFilters}
                                className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all flex items-center"
                            >
                                <FontAwesomeIcon icon={faFilter} className="mr-2" /> Filters
                            </button>
                        </div>
                    </div>

                    {isFiltersOpen && (
                        <div className="mt-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h6 className="font-semibold mb-3">Popular Categories</h6>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`px-4 py-1 rounded-full text-sm transition-all ${activeCategory === category
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>

                                <h6 className="font-semibold mb-3 mt-4">Funding Stage</h6>
                                <div className="flex flex-wrap gap-2">
                                    {fundingStages.map((stage) => (
                                        <button
                                            key={stage}
                                            onClick={() => setActiveFundingStage(stage)}
                                            className={`px-4 py-1 rounded-full text-sm transition-all ${activeFundingStage === stage
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                                                }`}
                                        >
                                            {stage}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Featured Startups Section */}
                <h4 className="text-xl font-bold mb-4">Featured Startups</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {featuredStartups.map((startup) => (
                        <div
                            key={startup.id}
                            className="bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="relative h-48">
                                <span
                                    className={`absolute top-3 left-3 text-white px-2 py-1 rounded text-xs ${categoryColors[startup.category] || 'bg-gray-500'
                                        }`}
                                >
                                    {startup.category}
                                </span>
                                <img
                                    src={startup.image}
                                    // alt={`${startup.name} Image`}
                                    className="w-full h-full object-cover rounded-t-xl"
                                />
                                <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-full text-sm flex items-center">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-1" /> Verified
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                                    <div className="flex justify-between items-center mb-2">
                                        <span>Funding Progress</span>
                                        <span>{startup.fundingProgress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 rounded-full">
                                        <div
                                            className="h-1.5 bg-green-500 rounded-full"
                                            style={{ width: `${startup.fundingProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">
                                <h5 className="text-lg font-bold">{startup.name}</h5>
                                <p className="text-gray-600 mb-2">{startup.description}</p>
                                <div className="flex justify-between py-3 border-t border-gray-200 mt-3">
                                    <div className="text-center">
                                        <div className="font-bold text-blue-600">{startup.raised}</div>
                                        <div className="text-gray-600 text-sm">Raised</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-blue-600">{startup.teamSize}</div>
                                        <div className="text-gray-600 text-sm">Team Size</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-blue-600">{startup.stage}</div>
                                        <div className="text-gray-600 text-sm">Stage</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    <div className="flex items-center">
                                        <img
                                            src={startup.founder.image}
                                            alt={startup.founder.name}
                                            className="w-8 h-8 rounded-full mr-2"
                                        />
                                        <div>
                                            <small className="block font-medium">{startup.founder.name}</small>
                                            <small className="text-gray-600">{startup.founder.role}</small>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/startup-detail/${startup.id}`}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* All Startups Section */}
                <h4 className="text-xl font-bold mb-4">All Startups</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {allStartups.map((startup) => (
                        <div
                            key={startup.id}
                            className="bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="relative h-48">
                                <span
                                    className={`absolute top-3 left-3 text-white px-2 py-1 rounded text-xs ${categoryColors[startup.category] || 'bg-gray-500'
                                        }`}
                                >
                                    {startup.category}
                                </span>
                                <img
                                    src={startup.image}
                                    // alt={`${startup.name} Image`}
                                    className="w-full h-full object-cover rounded-t-xl"
                                />
                                <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-full text-sm flex items-center">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-1" /> Verified
                                </div>
                            </div>
                            <div className="p-4">
                                <h5 className="text-lg font-bold">{startup.name}</h5>
                                <p className="text-gray-600 mb-2 line-clamp-1">{startup.description}</p>
                                <div className="flex justify-between py-3 border-t border-gray- 200 mt-3">
                                    <div className="text-center">
                                        <div className="font-bold text-blue-600">{startup.raised}</div>
                                        <div className="text-gray-600 text-sm">Raised</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-blue-600">{startup.teamSize}</div>
                                        <div className="text-gray-600 text-sm">Team Size</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-blue-600">{startup.stage}</div>
                                        <div className="text-gray-600 text-sm">Stage</div>
                                    </div>
                                </div>
                                <Link
                                    to={`/startup-detail/${startup.id}`}
                                    className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all mt-3"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <nav className="mt-8">
                    <div className="flex justify-center space-x-2">
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed">
                            Previous
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">1</button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all">
                            2
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all">
                            3
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all">
                            Next
                        </button>
                    </div>
                </nav>
            </div>
        </div>
    );
};

export default Startups;