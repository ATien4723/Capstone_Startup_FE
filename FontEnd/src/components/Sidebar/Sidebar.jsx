import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTachometerAlt,
    faNewspaper,
    faComments,
    faTasks,
    faCalendarAlt,
    faUserTie,
    faUsers
} from '@fortawesome/free-solid-svg-icons';

const menu = [
    { label: "Posts", icon: faNewspaper, to: "/posts" },
    { label: "Chat", icon: faComments, to: "/chat" },
    { label: "Tasks", icon: faTasks, to: "/tasks" },
    { label: "Calendar", icon: faCalendarAlt, to: "/calendar" },
    { label: "Candidates", icon: faUserTie, to: "/candidates" },
    { label: "Members", icon: faUsers, to: "/members" },
];

export default function Sidebar() {
    const location = useLocation();
    return (
        <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-800 to-blue-600 text-white flex flex-col fixed">
            {/* <div className="flex items-center justify-center py-6">
                <img src="/logo.png" alt="Startup Logo" className="w-10 h-10 mr-2" />
                <span className="text-xl font-bold">Startup Admin</span>
            </div> */}
            <div className="mt-20">
                {/* Dashboard on top */}
                <Link
                    to="/dashboard"
                    className={`flex items-center px-6 py-3 mb-2 font-bold text-lg rounded transition-all duration-200 ${location.pathname === "/dashboard" ? "bg-blue-800 text-white shadow" : "hover:bg-blue-600 hover:text-white text-blue-100"}`}
                >
                    <FontAwesomeIcon icon={faTachometerAlt} className={`mr-3 text-xl transition-all duration-200 ${location.pathname === "/dashboard" ? "text-white" : "text-blue-200 group-hover:text-white"}`} />
                    Dashboard
                </Link>
                <hr className="border-blue-300 mb-2 mx-6" />
                <nav className="flex-1 ">
                    <ul>
                        {menu.map(item => {
                            const isActive = location.pathname === item.to;
                            return (
                                <li key={item.label}>
                                    <Link
                                        to={item.to}
                                        className={`flex items-center px-6 py-3 rounded transition-all duration-200 font-medium ${isActive ? "bg-blue-900 text-white shadow font-bold" : "hover:bg-blue-700 hover:text-white text-blue-100"}`}
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