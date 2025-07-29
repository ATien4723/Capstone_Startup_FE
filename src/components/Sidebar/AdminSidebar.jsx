import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import {
    faTachometerAlt,
    faUsers,
    faFileAlt,
    faShieldAlt,
    faChartLine,
    faBuilding,
    faBell,
    faChevronDown,
    faChevronUp,
    faUserShield,
    faKey,
    faGavel
} from '@fortawesome/free-solid-svg-icons';

const adminMenu = [
    { label: "Dashboard", icon: faTachometerAlt, to: "/admin/dashboard" },
    {
        label: "Quản lý Tài khoản",
        icon: faUsers,
        to: "/admin/accounts",
        hasSubmenu: true,
        submenu: [
            { label: "Danh sách tài khoản", icon: faUsers, to: "/admin/accounts/list" },
            { label: "Xác thực tài khoản", icon: faUserShield, to: "/admin/accounts/verification" }
        ]
    },
    {
        label: "Quản lý Chính sách",
        icon: faFileAlt,
        to: "/admin/policies",
        hasSubmenu: true,
        submenu: [
            { label: "Danh sách chính sách", to: "/admin/policies/list" },
            { label: "Loại chính sách", to: "/admin/policies/types" }
        ]
    },
    {
        label: "Quản lý Quyền",
        icon: faShieldAlt,
        to: "/admin/permissions",
        hasSubmenu: true,
        submenu: [
            { label: "Vai trò", icon: faKey, to: "/admin/permissions/roles" },
            { label: "Phân quyền", icon: faGavel, to: "/admin/permissions/assign" }
        ]
    },
    { label: "Quản lý Startup", icon: faBuilding, to: "/admin/startups" },
    { label: "Thống kê", icon: faChartLine, to: "/admin/statistics" },
    { label: "Thông báo", icon: faBell, to: "/admin/notifications" },
];

export default function AdminSidebar() {
    const location = useLocation();
    const [openSubmenu, setOpenSubmenu] = useState(null);

    const toggleSubmenu = (label) => {
        if (openSubmenu === label) {
            setOpenSubmenu(null);
        } else {
            setOpenSubmenu(label);
        }
    };

    return (
        <aside className="w-64 min-h-screen bg-gradient-to-b from-purple-800 to-purple-600 text-white flex flex-col">
            <div className="mt-20 ">
                {/* Dashboard on top */}
                <Link
                    to="/admin/dashboard"
                    className={`flex items-center px-6 py-3 mb-2 font-bold text-lg rounded transition-all duration-200 ${location.pathname === "/admin/dashboard" ? "bg-purple-800 text-white shadow" : "hover:bg-purple-600 hover:text-white text-purple-100"}`}
                >
                    <FontAwesomeIcon icon={faTachometerAlt} className={`mr-3 text-xl transition-all duration-200 ${location.pathname === "/admin/dashboard" ? "text-white" : "text-purple-200 group-hover:text-white"}`} />
                    Dashboard
                </Link>
                <hr className="border-purple-300 mb-2 mx-6" />
                <nav className="flex-1">
                    <ul>
                        {adminMenu.slice(1).map(item => {
                            const isActive = location.pathname.startsWith(item.to);
                            const isSubmenuOpen = openSubmenu === item.label;

                            return (
                                <li key={item.label} className="mb-1">
                                    {item.hasSubmenu ? (
                                        <>
                                            <div
                                                onClick={() => toggleSubmenu(item.label)}
                                                className={`flex mt-2 items-center px-6 py-3 rounded transition-all duration-200 font-bold cursor-pointer ${isActive ? "bg-purple-900 text-white shadow font-bold" : "hover:bg-purple-700 hover:text-white text-purple-100"}`}
                                            >
                                                <FontAwesomeIcon icon={item.icon} className={`mr-3 text-lg transition-all duration-200 ${isActive ? "text-white" : "text-purple-200 group-hover:text-white"}`} />
                                                <span>{item.label}</span>
                                                <FontAwesomeIcon
                                                    icon={isSubmenuOpen ? faChevronUp : faChevronDown}
                                                    className="ml-auto text-sm"
                                                />
                                            </div>

                                            {/* Submenu */}
                                            {isSubmenuOpen && (
                                                <ul className="pl-10 mt-1 space-y-1 bg-purple-900/20 rounded-md p-2">
                                                    {item.submenu.map(subItem => {
                                                        const isSubActive = location.pathname === subItem.to;
                                                        return (
                                                            <li key={subItem.label}>
                                                                <Link
                                                                    to={subItem.to}
                                                                    className={`block py-2 px-4 rounded-lg transition duration-200 ${isSubActive
                                                                        ? "bg-purple-700 text-white shadow-md"
                                                                        : "bg-purple-900/20 text-purple-100 hover:bg-purple-600 hover:text-white"
                                                                        }`}
                                                                >
                                                                    {subItem.label}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            to={item.to}
                                            className={`flex mt-2 items-center px-6 py-3 rounded transition-all duration-200 font-bold ${isActive ? "bg-purple-900 text-white shadow font-bold" : "hover:bg-purple-700 hover:text-white text-purple-100"}`}
                                        >
                                            <FontAwesomeIcon icon={item.icon} className={`mr-3 text-lg transition-all duration-200 ${isActive ? "text-white" : "text-purple-200 group-hover:text-white"}`} />
                                            <span>{item.label}</span>
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </aside>
    );
} 