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

    // Thêm style để ngăn chặn sự thay đổi layout khi thanh cuộn xuất hiện
    React.useEffect(() => {
        // Thêm CSS để đặt scrollbar-gutter: stable vào body
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
            html {
                overflow-y: scroll;
                scrollbar-gutter: stable;
            }
            body {
                margin-right: 0 !important;
            }
        `;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <MeSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Navbar (Topbar) fixed */}
                <div className="fixed top-0 left-64 right-0 z-30">
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