import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTachometerAlt,
    faComments,
    faNewspaper,
    faUser,
    faChartLine,
    faCog
} from '@fortawesome/free-solid-svg-icons';

const meMenu = [
    { label: "Dashboard", icon: faTachometerAlt, to: "/me/dashboard" },
    { label: "Chat", icon: faComments, to: "/me/chat" },
    { label: "Posts", icon: faNewspaper, to: "/me/post" },
    { label: "Member", icon: faUser, to: "/me/member" },
    { label: "Statistics", icon: faChartLine, to: "/me/stats" },
    { label: "Settings", icon: faCog, to: "/me/settings" },
];

export default function MeSidebar() {
    const location = useLocation();

    return (
        <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-800 to-blue-600 text-white flex flex-col fixed">
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
                            const isActive = location.pathname === item.to;
                            return (
                                <li key={item.label}>
                                    <Link
                                        to={item.to}
                                        className={`flex mt-2 items-center px-6 py-3 rounded transition-all duration-200 font-bold ${isActive ? "bg-blue-900 text-white shadow font-bold" : "hover:bg-blue-700 hover:text-white text-blue-100"}`}
                                    >
                                        <FontAwesomeIcon icon={item.icon} className={`mr-3 text-lg transition-all duration-200 ${isActive ? "text-white" : "text-blue-200 group-hover:text-white"}`} />
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