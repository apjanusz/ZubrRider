import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";
function Layout() {
    return (
        <div className="flex flex-col min-h-screen bg-zubr-light">
            <Navbar />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-48">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}

export default Layout;