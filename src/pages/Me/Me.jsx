import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MeSidebar from "@/components/Sidebar/MeSidebar";
import MeNavbar from "@/components/Navbar/MeNavbar";

const Me = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Chuyển hướng đến dashboard mặc định nếu truy cập vào /me
    React.useEffect(() => {
        if (location.pathname === "/me") {
            navigate("/me/dashboard");
        }
    }, [navigate, location]);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <MeSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col ml-64">
                {/* Navbar (Topbar) fixed */}
                <div className="fixed top-0 left-64 right-0 z-30 w-[calc(100%-16rem)]">
                    <MeNavbar />
                </div>

                {/* Content Area */}
                <div className="pt-16 px-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Me; 