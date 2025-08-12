import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/Sidebar/AdminSidebar";
import AdminNavbar from "@/components/Navbar/AdminNavbar";

const Admin = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Chuyển hướng đến dashboard mặc định nếu truy cập vào /admin
    React.useEffect(() => {
        if (location.pathname === "/admin") {
            navigate("/admin/dashboard");
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
            <AdminSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Navbar (Topbar) fixed */}
                <div className="fixed top-0 left-64 right-0 z-30">
                    <AdminNavbar />
                </div>

                {/* Content Area */}
                <div className="pt-16 px-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Admin; 