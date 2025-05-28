import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell, faCaretDown, faBars, faTimes, faUser,
    faCog, faEnvelope, faQuestionCircle, faHeadset, faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { logout, getUserId, getUserInfoFromToken } from "@/apis/authService";
import Cookies from "js-cookie";


export default function Navbar() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const timeoutRef = useRef(null);
    const isAuthenticated = !!Cookies.get("accessToken");
    const currentUserId = getUserId();
    const userInfo = getUserInfoFromToken();

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        clearTimeout(timeoutRef.current);
        setDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setDropdownOpen(false);
        }, 300); // Delay 300ms trước khi đóng
    };


    const navItems = [
        { label: 'Home', to: '/home' },
        { label: 'Startups', to: '/startups' },
        { label: 'InvestmentEvents', to: '/investment-events' },
        { label: 'Policy', to: '/policy' },
    ];

    const dropdownItems = [
        { label: 'Profile', to: `/profile/${currentUserId}`, icon: faUser },
        { label: 'Settings', to: `/settings/${currentUserId}`, icon: faCog },
        { label: 'Messages', to: '/messages', icon: faEnvelope },
        { label: 'Help Center', to: '/help', icon: faQuestionCircle },
        { label: 'Contact Support', to: '/support', icon: faHeadset },
    ];



    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-blue-900 to-blue-700 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="text-xl font-bold text-white">Simes</Link>

                {/* Hamburger button (mobile) */}
                <button
                    className="lg:hidden text-white text-2xl focus:outline-none"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
                </button>

                {/* Menu (desktop) */}
                <ul className="hidden lg:flex space-x-6 text-sm font-medium">
                    {navItems.map((item) => (
                        <li key={item.label}>
                            <Link
                                to={item.to}
                                className={`px-4 py-2 rounded-lg transition-all duration-300 ${window.location.pathname === item.to
                                    ? 'bg-white/20 text-black'
                                    : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Right section (notification & user) */}
                <div className="hidden lg:flex items-center space-x-4">
                    {isAuthenticated ? (
                        <>
                            {/* Notification */}
                            <Link to="/notifications" className="relative">
                                <FontAwesomeIcon icon={faBell} className="text-lg hover:text-white/80" />
                                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 border-2 border-blue-900">3</span>
                            </Link>

                            {/* Dropdown (hover) */}
                            <div
                                className="relative group"
                                ref={dropdownRef}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <button className="flex items-center text-white text-sm">
                                    <img src="/api/placeholder/40/40" className="w-8 h-8 rounded-full mr-2 border border-white/20" alt="User" />
                                    <span>TienDz</span>
                                    <FontAwesomeIcon
                                        icon={faCaretDown}
                                        className={`ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Hover menu */}
                                {dropdownOpen && (
                                    <div
                                        className="absolute right-0 w-56 bg-white rounded-lg shadow-xl z-50"
                                        style={{ top: 'calc(100% + 8px)' }}
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">Account</div>
                                        {dropdownItems.slice(0, 3).map((item) => (
                                            <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                                                <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                                {item.label}
                                            </Link>
                                        ))}
                                        <hr className="my-2" />
                                        <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">Support</div>
                                        {dropdownItems.slice(3, 5).map((item) => (
                                            <Link key={item.label} to={item.to} className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                                                <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 text-gray-500" />
                                                {item.label}
                                            </Link>
                                        ))}
                                        <hr className="my-2" />
                                        <button
                                            onClick={() => {
                                                logout();  // gọi hàm xóa cookie và redirect
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-blue-50 focus:outline-none"
                                            type="button"
                                        >
                                            <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 w-5 text-gray-500" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="px-6 py-2  text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="lg:hidden bg-blue-800 px-4 py-3 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.to}
                            className={`block px-4 py-2 rounded-md ${window.location.pathname === item.to
                                ? 'bg-white/20 text-black'
                                : 'text-white hover:bg-white/10'
                                }`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                    {!isAuthenticated && (
                        <Link
                            to="/login"
                            className="block px-4 py-2 bg-white text-blue-600 rounded-md font-semibold hover:bg-blue-50 transition-all duration-300"
                            onClick={() => setMenuOpen(false)}
                        >
                            Login
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
