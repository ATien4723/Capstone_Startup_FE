import { useState, useCallback } from 'react';
import * as startupService from '@/apis/startupService';

export default function useChat(currentUserId) {
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lấy danh sách chatroom
    const fetchChatRooms = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.getChatRoomsForAccount(currentUserId);
            const items = Array.isArray(res.items) ? res.items : [];
            setChannels(items);
            if (items.length > 0 && !selectedChannel) {
                setSelectedChannel(items[0].chatRoomId);
            }
        } catch (err) {
            setChannels([]);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    // Tạo nhóm chat
    const createChatRoom = async (data) => {
        setLoading(true); setError(null);
        try {
            await startupService.createChatRoom(data);
            await fetchChatRooms();
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Thêm thành viên vào chatroom
    const addChatRoomMembers = async (data) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.addChatRoomMembers(data);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Lấy tất cả thành viên của một startup
    const getStartupMembers = async (startupId) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.getStartupMembers(startupId);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Lấy tất cả thành viên của một chatroom
    const getChatRoomMembers = async (chatRoomId) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.getChatRoomMembers(chatRoomId);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Lấy các chatroom mà account thuộc về
    const getChatRoomsForAccount = async (accountId, pageNumber = 1, pageSize = 10) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.getChatRoomsForAccount(accountId, pageNumber, pageSize);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Gửi message
    const sendMessage = async (data) => {
        setLoading(true); setError(null);
        try {
            const res = await startupService.sendMessage(data);
            return res;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Lấy các message trong một chatroom
    const getMessagesInRoom = async (chatRoomId, pageNumber = 1, pageSize = 10) => {
        try {
            const res = await startupService.getMessagesInRoom(chatRoomId, pageNumber, pageSize);
            return res;
        } catch (err) {
            throw err;
        }
    };

    return {
        channels,
        selectedChannel,
        setSelectedChannel,
        fetchChatRooms,
        createChatRoom,
        addChatRoomMembers,
        getStartupMembers,
        getChatRoomMembers,
        getChatRoomsForAccount,
        sendMessage,
        getMessagesInRoom,
        loading,
        error,
    };
} 