import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet, useLocation } from "react-router-dom";
function Layout() {
    const location = useLocation();
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

    return (
        <div className="flex flex-col min-h-screen bg-zubr-light">
            <Navbar />

            <main className={`flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isAuthPage ? "flex items-center py-2 sm:py-3" : "py-8 pt-10"}`}>
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}

export default Layout;
