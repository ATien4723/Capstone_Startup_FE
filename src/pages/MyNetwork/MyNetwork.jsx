import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@components/Navbar/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUserPlus, faUserCheck, faUserMinus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { getUserId } from '@/apis/authService';
import { useRecommendAccounts } from '@/hooks/useProfileHooks';
import useFollow from '@/hooks/useFollow';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const MyNetwork = () => {
    const navigate = useNavigate();
    const currentUserId = getUserId();
    const { data: suggestedConnections, isLoading, error, refetch } = useRecommendAccounts(currentUserId, 1, 10);

    // State cho dialog popup
    const [openSearchDialog, setOpenSearchDialog] = useState(false);

    // Sử dụng hook useFollow đã nâng cấp với chức năng tìm kiếm
    const {
        handleFollow,
        handleUnfollow,
        following,
        followers,
        followingIds,
        processingId,
        isFollowing,
        refetchData,
        // Lấy các state và hàm tìm kiếm từ hook
        searchTerm,
        setSearchTerm,
        searchResults,
        searchLoading,
        handleSearchInputChange
    } = useFollow(currentUserId);

    const handleConnect = async (id) => {
        // Sử dụng trực tiếp theo trạng thái follow từ hook
        if (!isFollowing(id)) {
            await handleFollow(id);
        } else {
            await handleUnfollow(id);
        }
        refetchData(); // cập nhật lại số lượng
    };

    const handleIgnore = (id) => {
        // Loại bỏ người dùng khỏi danh sách gợi ý
        refetch();
    };

    // Hàm chuyển đến trang cá nhân
    const goToProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    // Xử lý khi input thay đổi
    const handleInputChange = (event, value) => {
        handleSearchInputChange(value);
    };

    // Xử lý khi chọn người dùng từ autocomplete
    const handleUserSelect = (event, value) => {
        if (value) {
            goToProfile(value.accountId);
            setOpenSearchDialog(false); // Đóng dialog khi chọn user
        }
    };

    // Mở dialog tìm kiếm
    const openSearchPopup = () => {
        setOpenSearchDialog(true);
        // Reset kết quả tìm kiếm khi mở dialog
        setSearchTerm('');
        handleSearchInputChange('');
    };

    // Đóng dialog tìm kiếm
    const closeSearchPopup = () => {
        setOpenSearchDialog(false);
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <Navbar />
            <div className="container mx-auto pt-20 px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left Column - Network Stats */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                            <h2 className="font-semibold text-lg mb-4">Network Overview</h2>
                            <div className="grid grid-cols-2 text-center">
                                <div>
                                    <Link to="/network/following" className="block">
                                        <div className="font-bold text-xl hover:text-blue-600">{following.length}</div>
                                        <div className="text-sm text-gray-600 hover:text-blue-600">Following</div>
                                    </Link>
                                </div>
                                <div>
                                    <Link to="/network/followers" className="block">
                                        <div className="font-bold text-xl hover:text-blue-600">{followers.length}</div>
                                        <div className="text-sm text-gray-600 hover:text-blue-600">Followers</div>
                                    </Link>
                                </div>
                            </div>
                            <div className="mt-4 border-t pt-3">
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Connection Suggestions */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                            <h2 className="font-semibold text-lg mb-2">Invite 5 colleagues to connect today</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                More connections mean more opportunities. Start with your friends, teammates, and acquaintances.
                            </p>

                            <button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-full flex items-center justify-center"
                                onClick={openSearchPopup}
                            >
                                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                                Search for people you know
                            </button>

                            {/* Dialog popup tìm kiếm */}
                            <Dialog
                                open={openSearchDialog}
                                onClose={closeSearchPopup}
                                fullWidth
                                maxWidth="sm"
                            >
                                <DialogTitle>
                                    Search users
                                    <IconButton
                                        aria-label="close"
                                        onClick={closeSearchPopup}
                                        sx={{
                                            position: 'absolute',
                                            right: 8,
                                            top: 8,
                                        }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </DialogTitle>
                                <DialogContent dividers>
                                    {/* MUI Autocomplete sử dụng dữ liệu từ hook useFollow */}
                                    <Autocomplete
                                        id="user-search"
                                        options={searchResults || []}
                                        getOptionLabel={(option) => option.fullName || ''}
                                        loading={searchLoading}
                                        onInputChange={handleInputChange}
                                        onChange={handleUserSelect}
                                        noOptionsText="No new users found to follow"
                                        loadingText="Searching..."
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Search users"
                                                variant="outlined"
                                                fullWidth
                                                autoFocus
                                                helperText="Results do not show users you have already followed"
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                    startAdornment: (
                                                        <FontAwesomeIcon icon={faSearch} className="mr-2 text-gray-400" />
                                                    ),
                                                }}
                                            />
                                        )}
                                        renderOption={(props, option) => (
                                            <Box component="li" {...props} key={option.accountId} className="flex items-center p-2 hover:bg-gray-100">
                                                <Avatar
                                                    src={option.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                                    alt={option.fullName}
                                                    className="mr-3"
                                                    sx={{ width: 40, height: 40 }}
                                                />
                                                <div className="flex-grow">
                                                    <div className="font-medium">{option.fullName}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {option.position || 'User'}
                                                        {option.workplace && ` at ${option.workplace}`}
                                                    </div>
                                                    {option.followerCount !== undefined && (
                                                        <div className="text-xs text-gray-500">
                                                            Followers: {option.followerCount}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    className={`ml-2 py-1 px-3 rounded-full text-sm font-medium flex items-center
                                                        ${isFollowing(option.accountId)
                                                            ? 'bg-gray-100 border border-gray-500 hover:bg-gray-200'
                                                            : 'border border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleConnect(option.accountId);
                                                    }}
                                                    disabled={processingId === option.accountId}
                                                >
                                                    {isFollowing(option.accountId) ? (
                                                        <>
                                                            <FontAwesomeIcon icon={faUserCheck} className="mr-1" />
                                                            <span>Following</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FontAwesomeIcon icon={faUserPlus} className="mr-1" />
                                                            <span>Follow</span>
                                                        </>
                                                    )}
                                                </button>
                                            </Box>
                                        )}
                                        sx={{ mb: 3 }}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-medium text-lg">People you may know</h2>
                            </div>

                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                                    <div className="text-gray-500">Loading suggestions...</div>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8 text-red-500">Unable to load connection suggestions</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {suggestedConnections.map(person => (
                                        <div key={person.accountId} className="border rounded-lg relative">
                                            <button
                                                className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                                                onClick={() => handleIgnore(person.accountId)}
                                            >
                                                <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
                                            </button>
                                            <div className="p-3 text-center flex flex-col h-auto">
                                                <div className="mb-2 cursor-pointer">
                                                    <Link to={`/profile/${person.accountId}`}>
                                                        <img
                                                            src={person.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                                                            alt={person.fullName}
                                                            className="w-20 h-20 rounded-full mx-auto object-cover hover:opacity-90"
                                                        />
                                                    </Link>
                                                </div>
                                                <h3
                                                    className="font-medium text-sm cursor-pointer hover:text-blue-600"
                                                >
                                                    <Link to={`/profile/${person.accountId}`}>{person.fullName}</Link>
                                                </h3>
                                                <div className="flex-grow">
                                                    <p className="text-xs text-gray-600 mb-3 line-clamp-2 h-8">{person.position || ''}</p>
                                                    <p className="text-xs text-gray-500 mb-2">Followers: {person.totalFollowers}</p>
                                                </div>
                                                <div className="mt-auto">
                                                    <button
                                                        className={`w-full py-1 px-3 rounded-full text-sm font-medium flex items-center justify-center transition-colors
                                                            ${isFollowing(person.accountId)
                                                                ? 'bg-gray-100 border border-gray-500 hover:bg-gray-200 hover:text-red-600 hover:border-red-600 group'
                                                                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                                                        onClick={() => handleConnect(person.accountId)}
                                                        disabled={processingId === person.accountId}
                                                    >
                                                        {isFollowing(person.accountId) ? (
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
                                                                    {processingId === person.accountId ? 'Processing...' : 'Following'}
                                                                </span>
                                                                <span className="hidden group-hover:inline">
                                                                    Unfollow
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                                                {processingId === person.accountId ? 'Processing...' : 'Follow'}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyNetwork;

