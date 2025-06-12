import React, { useState } from 'react';

// Dữ liệu mẫu
const servers = [
    { id: 1, name: 'Capstone', icon: 'C' },
    { id: 2, name: 'Dev', icon: 'D' },
    { id: 3, name: 'AI', icon: 'A' },
];
const channels = [
    { id: 1, name: 'general' },
    { id: 2, name: 'random' },
    { id: 3, name: 'support' },
];
const messages = [
    { id: 1, user: 'Alice', content: 'Xin chào mọi người!' },
    { id: 2, user: 'Bob', content: 'Chào Alice!' },
    { id: 3, user: 'Charlie', content: 'Có ai rảnh không?' },
];

export default function Chat() {
    const [selectedServer, setSelectedServer] = useState(servers[0].id);
    const [selectedChannel, setSelectedChannel] = useState(channels[0].id);
    const [input, setInput] = useState('');

    return (
        <>
            {/* Header */}
            <header className="bg-white shadow px-4 py-4 flex justify-between items-center mb-6 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
            </header>

            {/* Chat Interface */}
            <div className="bg-white shadow rounded-lg overflow-hidden flex h-[calc(100vh-180px)]">
                {/* Sidebar trái: Server */}
                <div className="w-20 bg-gray-800 flex flex-col items-center py-4 space-y-4">
                    {servers.map(server => (
                        <button
                            key={server.id}
                            onClick={() => setSelectedServer(server.id)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold mb-2 transition-all duration-200 ${selectedServer === server.id ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-blue-500 hover:text-white'}`}
                        >
                            {server.icon}
                        </button>
                    ))}
                    <button className="w-12 h-12 rounded-2xl bg-gray-700 text-gray-400 text-2xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">+</button>
                </div>

                {/* Sidebar giữa: Kênh */}
                <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="font-bold text-gray-800">Text Channels</h2>
                    </div>
                    <ul className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
                        {channels.map(channel => (
                            <li key={channel.id}>
                                <button
                                    onClick={() => setSelectedChannel(channel.id)}
                                    className={`w-full flex items-center px-4 py-2 rounded text-left transition-all duration-200 ${selectedChannel === channel.id ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-700 hover:bg-gray-200'}`}
                                >
                                    # {channel.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Khung chat chính */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Header */}
                    <div className="h-14 flex items-center px-6 border-b border-gray-200 bg-white">
                        <span className="text-lg font-bold text-gray-800"># {channels.find(c => c.id === selectedChannel)?.name}</span>
                    </div>

                    {/* Tin nhắn */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className="flex items-start space-x-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">{msg.user[0]}</div>
                                <div>
                                    <div className="font-semibold text-gray-800">{msg.user}</div>
                                    <div className="text-gray-700">{msg.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input gửi tin nhắn */}
                    <form className="p-4 border-t border-gray-200" onSubmit={e => { e.preventDefault(); }}>
                        <div className="flex">
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập tin nhắn..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 transition-all"
                            >
                                Gửi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
} 