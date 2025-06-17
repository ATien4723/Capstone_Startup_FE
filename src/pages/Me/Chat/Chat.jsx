import React, { useEffect } from 'react';
import useChat from '@/hooks/useChat';
import { getRelativeTime } from '@/utils/dateUtils';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import { getUserId } from '@/apis/authService';

export default function Chat() {
    const currentUserId = getUserId(); // ID của người dùng hiện tại

    const {
        // State
        channels,
        selectedChannel,
        loading,
        messages,
        input,
        showCreateGroup,
        newGroupName,
        creatorName,
        showDropdown,
        showAddMember,
        newMemberEmail,
        newMemberTitle,
        searchResults,
        selectedUser,
        isSearching,

        // Actions
        setSelectedChannel,
        setInput,
        setShowCreateGroup,
        setNewGroupName,
        setCreatorName,
        setShowDropdown,
        setShowAddMember,
        setNewMemberEmail,
        setNewMemberTitle,
        setSelectedUser,
        fetchChatRooms,

        // Methods
        handleCreateGroup,
        handleSendMessage,
        handleEmailInputChange,
        handleSelectUser,
        handleAddMember,
        handleDeleteChatRoom,
    } = useChat(currentUserId);

    // Lấy danh sách chatroom khi vào trang
    useEffect(() => {
        fetchChatRooms();
    }, [fetchChatRooms]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = () => {
            setShowDropdown(false);
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [setShowDropdown]);

    return (
        <>
            {/* Header */}
            <header className="bg-white shadow px-4 py-4 flex justify-between items-center mb-6 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
            </header>

            {/* Chat Interface */}
            <div className="bg-white shadow rounded-lg overflow-hidden flex h-[calc(100vh-180px)]">
                {/* Sidebar giữa: Kênh */}
                <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="font-bold text-gray-800">Text Channels</h2>
                        <button
                            className="ml-2 p-1 bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-600 rounded-full shadow transition-all duration-200 focus:outline-none flex items-center justify-center"
                            title="Add chat group"
                            onClick={() => setShowCreateGroup(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    <ul className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
                        {(channels || []).map(channel => (
                            <li key={channel.chatRoomId}>
                                <button
                                    onClick={() => setSelectedChannel(channel.chatRoomId)}
                                    className={`w-full flex items-center px-4 py-2 rounded text-left transition-all duration-200 ${selectedChannel === channel.chatRoomId ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-700 hover:bg-gray-200'}`}
                                >
                                    # {channel.roomName}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Khung chat chính */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Header */}
                    <div className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
                        <span className="text-lg font-bold text-gray-800">
                            # {channels.find(c => c.chatRoomId === selectedChannel)?.roomName || ''}
                        </span>

                        {selectedChannel && (
                            <div className="relative">
                                <button
                                    className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDropdown(!showDropdown);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                    </svg>
                                </button>

                                {showDropdown && (
                                    <div
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => {
                                                setShowAddMember(true);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Add Member
                                        </button>
                                        <button
                                            onClick={handleDeleteChatRoom}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        >
                                            Delete Chat Group
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tin nhắn */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                        {[...messages].reverse().map(msg => {
                            // console.log("Message:", msg);
                            const isMe = msg.accountId == currentUserId;
                            // console.log("isMe:", isMe, "msg.accountId:", msg.accountId);
                            return (
                                <div
                                    key={msg.messageId || msg.id}
                                    className={`flex items-start space-x-3 ${isMe ? 'justify-end' : ''}`}
                                >
                                    {!isMe && (
                                        <img
                                            src={msg.avatarUrl}
                                            alt="avatar"
                                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                        />
                                    )}
                                    <div
                                        className={`max-w-xs px-4 py-2 rounded-lg shadow
                                            ${isMe
                                                ? 'bg-blue-500 text-white ml-auto'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}
                                        style={{ wordBreak: 'break-word' }}
                                    >
                                        {!isMe && (
                                            <div className="font-semibold">
                                                {msg.memberTitle || msg.accountId}
                                            </div>
                                        )}
                                        <div>{msg.messageContent}</div>
                                        <div className="text-xs text-black-200/80">
                                            {msg.sentAt ? getRelativeTime(msg.sentAt) : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input gửi tin nhắn */}
                    <form className="p-4 border-t border-gray-200" onSubmit={handleSendMessage}>
                        <div className="flex">
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Type a message..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 transition-all"
                                disabled={loading}
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Popup tạo group chat */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                            onClick={() => setShowCreateGroup(false)}
                        >
                            ×
                        </button>
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Create New Chat Group</h3>
                        <form onSubmit={handleCreateGroup}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-1">Group Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="Enter group name..."
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={creatorName}
                                    onChange={e => setCreatorName(e.target.value)}
                                    placeholder="Enter name..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-all font-bold"
                                disabled={loading}
                            >
                                Create Group
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Popup thêm thành viên */}
            {showAddMember && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                            onClick={() => {
                                setShowAddMember(false);
                                setNewMemberEmail('');
                                setNewMemberTitle('');
                                setSelectedUser(null);
                                setSearchResults([]);
                            }}
                        >
                            ×
                        </button>
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Add Member</h3>

                        {/* Tìm kiếm thành viên startup */}
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1">Search member by email</label>
                            <Autocomplete
                                options={Array.isArray(searchResults) ? searchResults : []}
                                loading={isSearching}
                                getOptionLabel={option => option?.fullName || option?.roleName || ''}
                                value={selectedUser}
                                onChange={(event, value) => {
                                    handleSelectUser(value);
                                }}
                                inputValue={newMemberEmail}
                                onInputChange={(event, value, reason) => {
                                    handleEmailInputChange({ target: { value } });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Enter email..."
                                        variant="outlined"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.accountId}>
                                        <Avatar src={option.avatarUrl} sx={{ width: 24, height: 24, mr: 1 }} />
                                        <span className="ml-2">{option.fullName} ({option.roleName})</span>
                                    </li>
                                )}
                                noOptionsText="Không tìm thấy thành viên"
                                isOptionEqualToValue={(option, value) =>
                                    (option.accountId && value.accountId && option.accountId === value.accountId) ||
                                    (option.memberId && value.memberId && option.memberId === value.memberId)
                                }
                            />
                        </div>

                        {/* Thông tin người dùng đã chọn */}
                        {selectedUser && (
                            <div className="mb-4 p-3 bg-blue-50 rounded flex items-center justify-between">
                                <div className="flex items-center">
                                    {selectedUser.avatarUrl && (
                                        <img
                                            src={selectedUser.avatarUrl}
                                            alt="avatar"
                                            className="w-8 h-8 rounded-full mr-2 object-cover"
                                        />
                                    )}
                                    <div>
                                        <div className="font-medium">{selectedUser.fullName || 'No name'}</div>
                                        <div className="text-sm text-gray-600">{selectedUser.roleName || ''}</div>
                                    </div>
                                </div>
                                <button
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={() => setSelectedUser(null)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Form thêm thành viên */}
                        <form onSubmit={handleAddMember}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-1">Set display name for member</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newMemberTitle}
                                    onChange={e => setNewMemberTitle(e.target.value)}
                                    placeholder="Enter display name..."
                                    required
                                    disabled={!selectedUser}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-all font-bold"
                                disabled={loading || !selectedUser}
                            >
                                Add Member
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
} 