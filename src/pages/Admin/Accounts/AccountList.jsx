import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faEdit,
    faLock,
    faUnlock,
    faCheckCircle,
    faTimesCircle,
    faSort,
    faSortUp,
    faSortDown
} from '@fortawesome/free-solid-svg-icons';

const AccountList = () => {
    const [accounts, setAccounts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortField, setSortField] = useState('fullName');
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Giả lập dữ liệu từ API
        const fetchAccounts = () => {
            setLoading(true);
            // Trong thực tế, đây sẽ là cuộc gọi API
            setTimeout(() => {
                const mockAccounts = Array.from({ length: 50 }, (_, i) => ({
                    id: i + 1,
                    username: `user${i + 1}`,
                    fullName: `Người dùng ${i + 1}`,
                    email: `user${i + 1}@example.com`,
                    role: i % 5 === 0 ? 'Admin' : i % 3 === 0 ? 'Moderator' : 'User',
                    status: i % 10 === 0 ? 'Locked' : 'Active',
                    verified: i % 4 !== 0,
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString('vi-VN')
                }));

                // Lọc và sắp xếp dữ liệu
                let filteredAccounts = mockAccounts.filter(account => {
                    const matchesSearch =
                        account.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        account.username.toLowerCase().includes(searchTerm.toLowerCase());

                    const matchesRole = selectedRole === 'all' || account.role === selectedRole;
                    const matchesStatus = selectedStatus === 'all' ||
                        (selectedStatus === 'active' && account.status === 'Active') ||
                        (selectedStatus === 'locked' && account.status === 'Locked');

                    return matchesSearch && matchesRole && matchesStatus;
                });

                // Sắp xếp
                filteredAccounts.sort((a, b) => {
                    let valueA = a[sortField];
                    let valueB = b[sortField];

                    // Đảm bảo so sánh chuỗi nếu là chuỗi
                    if (typeof valueA === 'string') {
                        valueA = valueA.toLowerCase();
                        valueB = valueB.toLowerCase();
                    }

                    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
                    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });

                // Phân trang
                const perPage = 10;
                const totalPages = Math.ceil(filteredAccounts.length / perPage);
                const startIndex = (currentPage - 1) * perPage;
                const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + perPage);

                setAccounts(paginatedAccounts);
                setTotalPages(totalPages);
                setLoading(false);
            }, 500); // Giả lập độ trễ mạng
        };

        fetchAccounts();
    }, [searchTerm, currentPage, sortField, sortDirection, selectedRole, selectedStatus]);

    const handleSort = (field) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field) => {
        if (field !== sortField) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-400" />;
        if (sortDirection === 'asc') return <FontAwesomeIcon icon={faSortUp} className="ml-1 text-purple-600" />;
        return <FontAwesomeIcon icon={faSortDown} className="ml-1 text-purple-600" />;
    };

    const handleLockAccount = (accountId) => {
        // Giả lập việc thay đổi trạng thái tài khoản
        setAccounts(accounts.map(account =>
            account.id === accountId
                ? { ...account, status: account.status === 'Active' ? 'Locked' : 'Active' }
                : account
        ));
    };

    const handleVerifyAccount = (accountId) => {
        // Giả lập việc xác thực tài khoản
        setAccounts(accounts.map(account =>
            account.id === accountId
                ? { ...account, verified: true }
                : account
        ));
    };

    return (
        <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản Lý Tài Khoản</h1>

            {/* Bộ lọc và tìm kiếm */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
                    <div className="w-full md:w-1/3 relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm tài khoản..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
                    </div>

                    <div className="flex space-x-4">
                        <select
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">Tất cả vai trò</option>
                            <option value="Admin">Admin</option>
                            <option value="Moderator">Moderator</option>
                            <option value="User">User</option>
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="locked">Đã khóa</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bảng dữ liệu */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('id')}>
                                    <div className="flex items-center">
                                        ID {getSortIcon('id')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('fullName')}>
                                    <div className="flex items-center">
                                        Tên người dùng {getSortIcon('fullName')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('email')}>
                                    <div className="flex items-center">
                                        Email {getSortIcon('email')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('role')}>
                                    <div className="flex items-center">
                                        Vai trò {getSortIcon('role')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                                    <div className="flex items-center">
                                        Trạng thái {getSortIcon('status')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Xác thực
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('createdAt')}>
                                    <div className="flex items-center">
                                        Ngày tạo {getSortIcon('createdAt')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : accounts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Không tìm thấy tài khoản nào
                                    </td>
                                </tr>
                            ) : (
                                accounts.map(account => (
                                    <tr key={account.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {account.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {account.fullName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {account.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${account.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                    account.role === 'Moderator' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'}`}>
                                                {account.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${account.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {account.status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {account.verified ? (
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                                            ) : (
                                                <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {account.createdAt}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button className="text-indigo-600 hover:text-indigo-900">
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    className={`${account.status === 'Active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                    onClick={() => handleLockAccount(account.id)}
                                                >
                                                    <FontAwesomeIcon icon={account.status === 'Active' ? faLock : faUnlock} />
                                                </button>
                                                {!account.verified && (
                                                    <button
                                                        className="text-blue-600 hover:text-blue-900"
                                                        onClick={() => handleVerifyAccount(account.id)}
                                                    >
                                                        <FontAwesomeIcon icon={faCheckCircle} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between items-center">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                                ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            Trước
                        </button>
                        <span className="text-sm text-gray-700">
                            Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                                ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            Tiếp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountList; 