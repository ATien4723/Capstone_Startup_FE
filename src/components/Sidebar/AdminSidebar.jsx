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
    { label: "Account Management", icon: faUsers, to: "/admin/accounts" },
    { label: "Category Management", icon: faFileAlt, to: "/admin/categories" },
    { label: "Policy Management", icon: faShieldAlt, to: "/admin/policies" }
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

                            return (
                                <li key={item.label} className="mb-1">
                                    <Link
                                        to={item.to}
                                        className={`flex mt-2 items-center px-6 py-3 rounded transition-all duration-200 font-bold ${isActive ? "bg-purple-900 text-white shadow font-bold" : "hover:bg-purple-700 hover:text-white text-purple-100"}`}
                                    >
                                        <FontAwesomeIcon icon={item.icon} className={`mr-3 text-lg transition-all duration-200 ${isActive ? "text-white" : "text-purple-200 group-hover:text-white"}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </aside>
    );
} 
