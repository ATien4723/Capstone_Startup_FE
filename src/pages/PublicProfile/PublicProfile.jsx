import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCamera, faMapMarkerAlt, faImage, faPaperclip, faEllipsisH, faFileAlt, faGlobe, faBriefcase, faHeart, faComment, faShareSquare, faSmile } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faFacebook, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faHeart as farHeart, faComment as farComment, faShareSquare as farShareSquare } from '@fortawesome/free-regular-svg-icons';
import Navbar from '@components/Navbar/Navbar';
import { getAccountInfo, getFollowing, getFollowers, updateProfile, updateBio } from '@/apis/accountService';
import { toast } from 'react-toastify';

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
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [newBio, setNewBio] = useState('');
    const [editProfile, setEditProfile] = useState(false);
    const [editBio, setEditBio] = useState(false);
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

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                const [accountInfo, followingData, followersData] = await Promise.all([
                    getAccountInfo(id),
                    getFollowing(id),
                    getFollowers(id)
                ]);
                setProfileData(accountInfo);
                setFollowing(followingData);
                setFollowers(followersData);
                setNewBio(accountInfo.bio || '');
                setFormData({
                    firstName: accountInfo?.firstName || '',
                    lastName: accountInfo?.lastName || '',
                    gender: accountInfo?.gender || '',
                    dob: accountInfo?.dob || '',
                    address: accountInfo?.address || '',
                    phoneNumber: accountInfo?.phoneNumber || '',
                    avatarUrl: accountInfo?.avatarUrl || '',
                    introTitle: accountInfo?.bio?.introTitle || '',
                    position: accountInfo?.bio?.position || '',
                    workplace: accountInfo?.bio?.workplace || '',
                    facebookUrl: accountInfo?.facebookUrl || '',
                    linkedinUrl: accountInfo?.linkedinUrl || '',
                    githubUrl: accountInfo?.githubUrl || '',
                    portfolioUrl: accountInfo?.portfolioUrl || '',
                    country: accountInfo?.bio?.country || '',
                });
            } catch (error) {
                toast.error('Failed to load profile data');
                console.error('Error fetching profile data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProfileData();
        }
    }, [id]);

    // Chỉ lấy các trường profile để gửi API
    const getProfileFields = (data) => {
        const { firstName, lastName, gender, dob, address, phoneNumber, avatarUrl } = data;
        return { firstName, lastName, gender, dob, address, phoneNumber, avatarUrl };
    };
    // Chỉ lấy các trường bio để gửi API
    const getBioFields = (data) => {
        const { introTitle, position, workplace, facebookUrl, linkedinUrl, githubUrl, portfolioUrl, country } = data;
        return { introTitle, position, workplace, facebookUrl, linkedinUrl, githubUrl, portfolioUrl, country };
    };

    const handleUpdateProfile = async () => {
        try {
            const updatedProfile = await updateProfile(id, getProfileFields(formData));
            setProfileData(updatedProfile);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
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
                    src={profileData.coverImage || ""}
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
                                            <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full text-gray-700 shadow hover:bg-gray-100">
                                                <FontAwesomeIcon icon={faCamera} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <h4 className="font-bold text-xl">{profileData.firstName}</h4>
                                <p className="text-gray-600 mb-3">{profileData.jobTitle}</p>
                                <p className="text-gray-600 mb-3">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> {profileData.location}
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center mb-4">
                                    <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full shadow-sm focus:outline-none">All Post</button>
                                    <button className="px-6 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-full shadow-sm bg-white hover:bg-blue-50 focus:outline-none">Media</button>
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
                                </div>
                                {/* Update Profile Button and Modal */}
                                <div>
                                    <button
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                                        onClick={() => setEditProfile(true)}
                                    >
                                        Update Profile
                                    </button>
                                    {editProfile && (
                                        <Modal onClose={() => setEditProfile(false)}>
                                            <h2 className="text-xl font-bold mb-4">Update Profile</h2>
                                            <input value={formData.firstName} onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))} placeholder="First Name" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.lastName} onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))} placeholder="Last Name" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.gender} onChange={e => setFormData(f => ({ ...f, gender: e.target.value }))} placeholder="Gender" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.dob} onChange={e => setFormData(f => ({ ...f, dob: e.target.value }))} placeholder="Date of Birth" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} placeholder="Address" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.phoneNumber} onChange={e => setFormData(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="Phone Number" className="input mb-2 w-full border p-2 rounded" />
                                            <input value={formData.avatarUrl} onChange={e => setFormData(f => ({ ...f, avatarUrl: e.target.value }))} placeholder="Avatar URL" className="input mb-2 w-full border p-2 rounded" />
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                                                    onClick={async () => {
                                                        await handleUpdateProfile();
                                                        setEditProfile(false);
                                                    }}
                                                >
                                                    Save Profile
                                                </button>
                                                <button className="px-4 py-2" onClick={() => setEditProfile(false)}>Cancel</button>
                                            </div>
                                        </Modal>
                                    )}
                                </div>
                                {/* Update Bio Button and Modal */}
                                <div>
                                    <button
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                                        onClick={() => setEditBio(true)}
                                    >
                                        Update Bio
                                    </button>
                                    {editBio && (
                                        <Modal onClose={() => setEditBio(false)}>
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
                                                    }}
                                                >
                                                    Save Bio
                                                </button>
                                                <button className="px-4 py-2" onClick={() => setEditBio(false)}>Cancel</button>
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