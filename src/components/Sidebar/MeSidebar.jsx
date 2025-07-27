import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import {
    faTachometerAlt,
    faComments,
    faNewspaper,
    faUser,
    faChartLine,
    faCog,
    faChevronDown,
    faChevronUp,
    faClipboardList,
    faFileAlt,
    faBuilding,
    faMagnifyingGlassChart,
    faUserGroup,
    faMessage
} from '@fortawesome/free-solid-svg-icons';

const meMenu = [
    { label: "Dashboard", icon: faTachometerAlt, to: "/me/dashboard" },
    {
        label: "Chat",
        icon: faComments,
        to: "/me/chat",
        hasSubmenu: true,
        submenu: [
            { label: "Nhóm Chat", icon: faUserGroup, to: "/me/chat" },
            { label: "Tin nhắn cá nhân", icon: faMessage, to: "/me/chat/user" }
        ]
    },
    {
        label: "Posts",
        icon: faNewspaper,
        to: "/me/post",
        hasSubmenu: true,
        submenu: [
            { label: "Post", to: "/me/post" },
            { label: "Internship Post", to: "/me/post/internship" }
        ]
    },
    { label: "Member", icon: faUser, to: "/me/member" },
    {
        label: "Tasks",
        icon: faChartLine,
        to: "/me/milestones",

    },
    { label: "CV Management", icon: faFileAlt, to: "/me/cv" },
    { label: "Startup Info", icon: faBuilding, to: "/me/startup-info" },
    { label: "Analytics", icon: faMagnifyingGlassChart, to: "/me/analytics" },
];

export default function MeSidebar() {
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
        <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-800 to-blue-600 text-white flex flex-col">
            {/* <div className="flex items-center justify-center py-6">
                <span className="text-xl font-bold">Trang cá nhân</span>
            </div> */}
            <div className="mt-20 ">
                {/* Dashboard on top */}
                <Link
                    to="/me/dashboard"
                    className={`flex items-center px-6 py-3 mb-2 font-bold text-lg rounded transition-all duration-200 ${location.pathname === "/me/dashboard" ? "bg-blue-800 text-white shadow" : "hover:bg-blue-600 hover:text-white text-blue-100"}`}
                >
                    <FontAwesomeIcon icon={faTachometerAlt} className={`mr-3 text-xl transition-all duration-200 ${location.pathname === "/me/dashboard" ? "text-white" : "text-blue-200 group-hover:text-white"}`} />
                    Dashboard
                </Link>
                <hr className="border-blue-300 mb-2 mx-6" />
                <nav className="flex-1">
                    <ul>
                        {meMenu.slice(1).map(item => {
                            const isActive = location.pathname.startsWith(item.to);
                            const isSubmenuOpen = openSubmenu === item.label;

                            return (
                                <li key={item.label} className="mb-1">
                                    {item.hasSubmenu ? (
                                        <>
                                            <div
                                                onClick={() => toggleSubmenu(item.label)}
                                                className={`flex mt-2 items-center px-6 py-3 rounded transition-all duration-200 font-bold cursor-pointer ${isActive ? "bg-blue-900 text-white shadow font-bold" : "hover:bg-blue-700 hover:text-white text-blue-100"}`}
                                            >
                                                <FontAwesomeIcon icon={item.icon} className={`mr-3 text-lg transition-all duration-200 ${isActive ? "text-white" : "text-blue-200 group-hover:text-white"}`} />
                                                <span>{item.label}</span>
                                                <FontAwesomeIcon
                                                    icon={isSubmenuOpen ? faChevronUp : faChevronDown}
                                                    className="ml-auto text-sm"
                                                />
                                            </div>

                                            {/* Submenu */}
                                            {isSubmenuOpen && (
                                                <ul className="pl-10 mt-1 space-y-1 bg-blue-900/20 rounded-md p-2">
                                                    {item.submenu.map(subItem => {
                                                        const isSubActive = location.pathname === subItem.to;
                                                        return (
                                                            <li key={subItem.label}>
                                                                <Link
                                                                    to={subItem.to}
                                                                    className={`block py-2 px-4 rounded-lg transition duration-200 ${isSubActive
                                                                        ? "bg-blue-700 text-white shadow-md"
                                                                        : "bg-blue-900/20 text-blue-100 hover:bg-blue-600 hover:text-white"
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
                                            className={`flex mt-2 items-center px-6 py-3 rounded transition-all duration-200 font-bold ${isActive ? "bg-blue-900 text-white shadow font-bold" : "hover:bg-blue-700 hover:text-white text-blue-100"}`}
                                        >
                                            <FontAwesomeIcon icon={item.icon} className={`mr-3 text-lg transition-all duration-200 ${isActive ? "text-white" : "text-blue-200 group-hover:text-white"}`} />
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