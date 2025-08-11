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
    faSortDown,
    faPlus
} from '@fortawesome/free-solid-svg-icons';
import { getAllAccounts } from '@/apis/accountService';
import { createAdmin } from '@/apis/adminService';
import { toast } from 'react-toastify';

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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    useEffect(() => {
        const fetchAccounts = async () => {
            setLoading(true);
            try {
                const response = await getAllAccounts();
                // API trả về trực tiếp array, không có .data
                const accountsData = Array.isArray(response) ? response : [];

                // Lọc và sắp xếp dữ liệu
                let filteredAccounts = accountsData.filter(account => {
                    const fullName = `${account.firstName || ''} ${account.lastName || ''}`.trim();
                    const matchesSearch =
                        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (account.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

                    const matchesRole = selectedRole === 'all' || account.role === selectedRole;
                    const matchesStatus = selectedStatus === 'all' ||
                        (selectedStatus === 'verified' && account.status === 'verified') ||
                        (selectedStatus === 'unverified' && account.status === 'unverified');

                    return matchesSearch && matchesRole && matchesStatus;
                });

                // Sắp xếp theo firstName thay vì fullName
                filteredAccounts.sort((a, b) => {
                    let valueA, valueB;

                    if (sortField === 'fullName') {
                        valueA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
                        valueB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
                    } else {
                        valueA = a[sortField];
                        valueB = b[sortField];
                    }

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
            } catch (error) {
                console.error('Error loading account list:', error);
                setAccounts([]);
            } finally {
                setLoading(false);
            }
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

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast.error('Please enter all required information');
            return;
        }

        setCreateLoading(true);
        try {
            await createAdmin(formData);
            toast.success('Admin account created successfully');
            setShowCreateModal(false);
            setFormData({ email: '', password: '' });
            // Refresh danh sách
            const response = await getAllAccounts();
            const accountsData = Array.isArray(response) ? response : [];
            setAccounts(accountsData.slice(0, 10)); // Hiển thị trang đầu
        } catch (error) {
            toast.error('An error occurred while creating the admin account');
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Account Management</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Create Admin
                </button>
            </div>

            {/* Bộ lọc và tìm kiếm */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
                    <div className="w-full md:w-1/3 relative">
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
                    </div>

                    <div className="flex space-x-4">
                        <div className="relative">
                            <select
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value)}
                                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500  bg-white"
                            >
                                <option value="all">All roles</option>
                                <option value="admin">Admin</option>
                                <option value="startup">Startup</option>
                            </select>
                        </div>

                        <div className="relative">
                            <select
                                value={selectedStatus}
                                onChange={e => setSelectedStatus(e.target.value)}
                                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                                <option value="all">All statuses</option>
                                <option value="verified">Verified</option>
                                <option value="unverified">Unverified</option>
                            </select>
                        </div>
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
                                        Full Name {getSortIcon('fullName')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('email')}>
                                    <div className="flex items-center">
                                        Email {getSortIcon('email')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('role')}>
                                    <div className="flex items-center">
                                        Role {getSortIcon('role')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                                    <div className="flex items-center">
                                        Status {getSortIcon('status')}
                                    </div>
                                </th>
                                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Xác thực
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('createdAt')}>
                                    <div className="flex items-center">
                                        Ngày tạo {getSortIcon('createdAt')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th> */}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : accounts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No accounts found
                                    </td>
                                </tr>
                            ) : (
                                accounts.map((account, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {(currentPage - 1) * 10 + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {`${account.firstName || ''} ${account.lastName || ''}`.trim() || 'No name'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {account.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${account.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                    account.role === 'startup' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'}`}>
                                                {account.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${account.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {account.status === 'verified' ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {account.verified ? (
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                                            ) : (
                                                <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />
                                            )}
                                        </td> */}
                                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {account.createdAt}
                                        </td> */}
                                        {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                                        </td> */}
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
                            Previous
                        </button>
                        <span className="text-sm text-gray-700">
                            Page <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                                ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal tạo admin */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-xl font-bold mb-4">Create Admin Account</h2>
                        <form onSubmit={handleCreateAdmin}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {createLoading ? 'Creating...' : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountList; 
