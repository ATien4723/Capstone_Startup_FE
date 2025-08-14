import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faFilter, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getAllStartups, getStage } from '@/apis/startupService';
import { getAllCategories } from '@/apis/categoryService';

const Startups = () => {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeFundingStage, setActiveFundingStage] = useState('');
    const [startups, setStartups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [fundingStages, setFundingStages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Pagination states for Featured Startups
    const [featuredCurrentPage, setFeaturedCurrentPage] = useState(1);
    const [featuredItemsPerPage] = useState(6); // 6 items per page cho featured (2 rows x 3 cols)

    // Arrow navigation states for All Startups
    const [allCurrentIndex, setAllCurrentIndex] = useState(0);
    const [allItemsPerView] = useState(9); // Hiển thị tối đa 9 startups (3 rows x 3 cols)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch startups
                const startupResponse = await getAllStartups();
                const startupData = startupResponse?.items;
                setStartups(startupData);

                const categoryResponse = await getAllCategories();
                // console.log("Categories data:", categoryResponse);
                if (Array.isArray(categoryResponse) && categoryResponse.length > 0) {
                    setCategories([
                        { category_ID: 0, category_Name: "All" },
                        ...categoryResponse
                    ]);
                }

                const stageResponse = await getStage();
                // console.log("Stages data:", stageResponse);
                if (Array.isArray(stageResponse) && stageResponse.length > 0) {
                    setFundingStages(stageResponse);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Unable to load startups data. Please try again later.');
                setLoading(false);
                setStartups([]);
            }
        };

        fetchData();
    }, []);

    const toggleFilters = () => setIsFiltersOpen(!isFiltersOpen);

    const categoryColors = {
        Technology: 'bg-blue-600',
        FinTech: 'bg-blue-400',
        Healthcare: 'bg-yellow-500',
        Education: 'bg-green-500',
        'E-commerce': 'bg-red-500',
        Sustainability: 'bg-green-600',
        AI: 'bg-purple-500',
    };

    // Lọc startups dựa trên danh mục và giai đoạn được chọn
    const filteredStartups = Array.isArray(startups) ? startups.filter(startup => {
        if (!startup) return false;

        // Lọc theo danh mục
        const categoryMatch = activeCategory === 'All' ||
            (startup.categories && Array.isArray(startup.categories) && startup.categories.includes(activeCategory));

        // Lọc theo giai đoạn
        const stageMatch = activeFundingStage === '' || startup.stage === activeFundingStage;

        // Lọc theo từ khóa tìm kiếm
        const searchMatch = searchTerm === '' ||
            (startup.startup_Name && startup.startup_Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (startup.description && startup.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (startup.location && startup.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (startup.categories && Array.isArray(startup.categories) &&
                startup.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())));

        return categoryMatch && stageMatch && searchMatch;
    }) : [];

    // Xử lý khi thay đổi từ khóa tìm kiếm
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // Reset về đầu khi tìm kiếm
        setFeaturedCurrentPage(1);
        setAllCurrentIndex(0);
    };

    // Xử lý khi nhấn nút tìm kiếm
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // Tìm kiếm đã được thực hiện trong filteredStartups
        setFeaturedCurrentPage(1);
        setAllCurrentIndex(0);
    };

    // Xóa từ khóa tìm kiếm
    const clearSearch = () => {
        setSearchTerm('');
        setFeaturedCurrentPage(1);
        setAllCurrentIndex(0);
    };

    // Chia startups thành featured và all (sử dụng status verified làm tiêu chí)
    const allStartupsFiltered = filteredStartups.filter(startup => startup && startup.status == "verified");

    // Featured Startups - Pagination
    const featuredTotalItems = allStartupsFiltered.length;
    const featuredTotalPages = Math.ceil(featuredTotalItems / featuredItemsPerPage);
    const featuredStartIndex = (featuredCurrentPage - 1) * featuredItemsPerPage;
    const featuredEndIndex = featuredStartIndex + featuredItemsPerPage;
    const featuredStartups = allStartupsFiltered.slice(featuredStartIndex, featuredEndIndex);

    // All Startups - Arrow Navigation (hiển thị tối đa 3)
    const allTotalItems = allStartupsFiltered.length;
    const allMaxIndex = Math.max(0, allTotalItems - allItemsPerView);
    const allStartIndex = Math.min(allCurrentIndex, allMaxIndex);
    const allEndIndex = Math.min(allStartIndex + allItemsPerView, allTotalItems);
    const allStartups = allStartupsFiltered.slice(allStartIndex, allEndIndex);



    // Featured Startups Pagination handlers
    const handleFeaturedPageChange = (page) => {
        if (page >= 1 && page <= featuredTotalPages) {
            setFeaturedCurrentPage(page);
        }
    };

    const handleFeaturedPreviousPage = () => {
        if (featuredCurrentPage > 1) {
            setFeaturedCurrentPage(featuredCurrentPage - 1);
        }
    };

    const handleFeaturedNextPage = () => {
        if (featuredCurrentPage < featuredTotalPages) {
            setFeaturedCurrentPage(featuredCurrentPage + 1);
        }
    };

    // All Startups Arrow Navigation handlers
    const handleAllPrevious = () => {
        if (allCurrentIndex > 0) {
            setAllCurrentIndex(Math.max(0, allCurrentIndex - allItemsPerView));
        }
    };

    const handleAllNext = () => {
        if (allCurrentIndex < allMaxIndex) {
            setAllCurrentIndex(Math.min(allMaxIndex, allCurrentIndex + allItemsPerView));
        }
    };

    // Xử lý khi chọn danh mục
    const handleCategoryClick = (categoryName) => {
        // Nếu đã chọn thì bỏ chọn và quay về 'All'
        if (activeCategory === categoryName) {
            setActiveCategory('All');
        } else {
            setActiveCategory(categoryName);
        }
        // Reset về đầu khi thay đổi filter
        setFeaturedCurrentPage(1);
        setAllCurrentIndex(0);
    };

    // Xử lý khi chọn giai đoạn
    const handleStageClick = (stage) => {
        // Nếu đã chọn thì bỏ chọn và quay về trống
        if (activeFundingStage === stage.stageName) {
            setActiveFundingStage('');
        } else {
            setActiveFundingStage(stage.stageName);
        }
        // Reset về đầu khi thay đổi filter
        setFeaturedCurrentPage(1);
        setAllCurrentIndex(0);
    };

    // Hiển thị loading hoặc error message
    if (loading) {
        return (
            <div className="bg-gray-100 min-h-screen">
                <Navbar />
                <div className="container mx-auto pt-20 px-4 flex justify-center items-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-100 min-h-screen">
                <Navbar />
                <div className="container mx-auto pt-20 px-4 flex justify-center items-center">
                    <div className="text-center">
                        <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />
            <div className="container mx-auto pt-20 px-4">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Discover Startups</h2>
                    <Link to="/create-startup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Your Startup
                    </Link>
                </div>

                {/* Search and Filters Section */}
                <div className="bg-white rounded-xl shadow-md p-5 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex col-span-2">
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="Search startups by name, category, or location..."
                                value={searchTerm}
                                onChange={handleSearch}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                            />
                            <button
                                className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 transition-all"
                                onClick={handleSearchSubmit}
                            >
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                        </div>
                        <div className="flex gap-3">
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-all flex items-center"
                                >
                                    Clear Search <FontAwesomeIcon icon={faTimesCircle} className="ml-2" />
                                </button>
                            )}
                            {/* <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                <option>Sort By</option>
                                <option>Newest</option>
                                <option>Most Funded</option>
                                <option>Most Popular</option>
                            </select> */}
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
                                            key={category.category_ID}
                                            onClick={() => handleCategoryClick(category.category_Name)}
                                            className={`px-4 py-1 rounded-full text-sm transition-all ${activeCategory === category.category_Name
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                                                }`}
                                        >
                                            {category.category_Name}
                                        </button>
                                    ))}
                                </div>

                                <h6 className="font-semibold mb-3 mt-4">Funding Stage</h6>
                                <div className="flex flex-wrap gap-2">
                                    {fundingStages.map((stage) => (
                                        <button
                                            key={stage.stageId}
                                            onClick={() => handleStageClick(stage)}
                                            className={`px-4 py-1 rounded-full text-sm transition-all ${activeFundingStage === stage.stageName
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                                                }`}
                                        >
                                            {stage.stageName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Featured Startups Section */}
                {featuredStartups.length > 0 && (
                    <>
                        <h4 className="text-xl font-bold mb-4">Featured Startups</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {featuredStartups.map((startup) => (
                                <div
                                    key={startup.startup_ID}
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="relative h-48">
                                        {startup.categories && Array.isArray(startup.categories) && startup.categories.length > 0 && (
                                            <span
                                                className={`absolute top-3 left-3 text-white px-2 py-1 rounded text-xs ${categoryColors[startup.categories[0]] || 'bg-gray-500'}`}
                                            >
                                                {startup.categories[0]}
                                            </span>
                                        )}
                                        <img
                                            src={startup.backgroundUrl || startup.logo || 'https://via.placeholder.com/300x150?text=No+Image'}
                                            alt={startup.startup_Name || "Startup"}
                                            className="w-full h-full object-cover rounded-t-xl"
                                        />
                                        {startup.status === "verified" && (
                                            <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-full text-sm flex items-center">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-1" /> Verified
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h5 className="text-lg font-bold">{startup.startup_Name}</h5>
                                        <p className="text-gray-600 mb-2">{startup.description}</p>
                                        <div className="flex justify-between py-3 border-t border-gray-200 mt-3">
                                            <div className="text-center">
                                                <div className="font-bold text-blue-600">{startup.followerCount}</div>
                                                <div className="text-gray-600 text-sm">Followers</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-blue-600">{startup.abbreviationName || 'N/A'}</div>
                                                <div className="text-gray-600 text-sm">hehehe</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-blue-600">{startup.stage || 'N/A'}</div>
                                                <div className="text-gray-600 text-sm">Stage</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <div className="flex items-center">
                                                <img
                                                    src={startup.logo || 'https://via.placeholder.com/30x30?text=Logo'}
                                                    alt={startup.startup_Name || "Logo"}
                                                    className="w-8 h-8 rounded-full mr-2"
                                                />
                                                <div>
                                                    <small className="block font-medium">{startup.startup_Name}</small>
                                                    <small className="text-gray-600">{startup.email}</small>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/startup-detail/${startup.startup_ID}`}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>


                    </>
                )}



                {/* All Startups Section */}
                <h4 className="text-xl font-bold mb-4">All Startups</h4>
                {allStartups.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <p className="text-gray-600">No startups match your filter criteria.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Left Arrow */}
                        {allTotalItems > allItemsPerView && (
                            <button
                                onClick={handleAllPrevious}
                                disabled={allCurrentIndex === 0}
                                className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full border-2 border-gray-300 bg-white shadow-lg transition-all ${allCurrentIndex === 0
                                    ? 'text-gray-400 cursor-not-allowed opacity-50'
                                    : 'text-gray-600 hover:bg-gray-100 hover:border-blue-500'
                                    }`}
                            >
                                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        {/* Startups Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-8">
                            {allStartups.map((startup) => (
                                <div
                                    key={startup.startup_ID}
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="relative h-48">
                                        {startup.categories && Array.isArray(startup.categories) && startup.categories.length > 0 && (
                                            <span
                                                className={`absolute top-3 left-3 text-white px-2 py-1 rounded text-xs ${categoryColors[startup.categories[0]] || 'bg-gray-500'}`}
                                            >
                                                {startup.categories[0]}
                                            </span>
                                        )}
                                        <img
                                            src={startup.backgroundUrl || startup.logo || 'https://via.placeholder.com/300x150?text=No+Image'}
                                            alt={startup.startup_Name || "Startup"}
                                            className="w-full h-full object-cover rounded-t-xl"
                                        />
                                        {startup.status === "verified" && (
                                            <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-full text-sm flex items-center">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-1" /> Verified
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h5 className="text-lg font-bold">{startup.startup_Name}</h5>
                                        <p className="text-gray-600 mb-2 line-clamp-1">{startup.description}</p>
                                        <div className="flex justify-between py-3 border-t border-gray-200 mt-3">
                                            <div className="text-center">
                                                <div className="font-bold text-blue-600">{startup.followerCount}</div>
                                                <div className="text-gray-600 text-sm">Followers</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-blue-600">{startup.abbreviationName || 'N/A'}</div>
                                                <div className="text-gray-600 text-sm">Short Name</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-blue-600">{startup.stage || 'N/A'}</div>
                                                <div className="text-gray-600 text-sm">Stage</div>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/startup-detail/${startup.startup_ID}`}
                                            className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all mt-3"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Arrow */}
                        {allTotalItems > allItemsPerView && (
                            <button
                                onClick={handleAllNext}
                                disabled={allCurrentIndex >= allMaxIndex}
                                className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full border-2 border-gray-300 bg-white shadow-lg transition-all ${allCurrentIndex >= allMaxIndex
                                    ? 'text-gray-400 cursor-not-allowed opacity-50'
                                    : 'text-gray-600 hover:bg-gray-100 hover:border-blue-500'
                                    }`}
                            >
                                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}

                        {/* Current View Info */}
                        {allTotalItems > allItemsPerView && (
                            <div className="text-center mt-4 text-sm text-gray-600">
                                Showing {allStartIndex + 1} - {allEndIndex} of {allTotalItems} startups
                            </div>
                        )}
                    </div>
                )}

                {/* Featured Startups Pagination - Moved to bottom */}
                {featuredTotalPages > 1 && (
                    <nav className="mt-8">
                        <div className="flex justify-center items-center space-x-2">
                            {/* Previous Button */}
                            <button
                                onClick={handleFeaturedPreviousPage}
                                disabled={featuredCurrentPage === 1}
                                className={`px-4 py-2 border border-gray-300 rounded-lg transition-all ${featuredCurrentPage === 1
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Previous
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: featuredTotalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => handleFeaturedPageChange(page)}
                                    className={`px-4 py-2 rounded-lg transition-all ${featuredCurrentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Next Button */}
                            <button
                                onClick={handleFeaturedNextPage}
                                disabled={featuredCurrentPage === featuredTotalPages}
                                className={`px-4 py-2 border border-gray-300 rounded-lg transition-all ${featuredCurrentPage === featuredTotalPages
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Next
                            </button>
                        </div>

                        {/* Featured Pagination Info */}
                        <div className="text-center mt-4 text-sm text-gray-600">
                            Featured: Showing {featuredStartIndex + 1} to {Math.min(featuredEndIndex, featuredTotalItems)} of {featuredTotalItems} startups
                            (Page {featuredCurrentPage} of {featuredTotalPages})
                        </div>
                    </nav>
                )}
            </div>
        </div>
    );
};

export default Startups;   