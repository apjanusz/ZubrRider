import { useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet, useLocation } from "react-router-dom";

function getPageTitle(pathname) {
    if (pathname === "/") {
        return "ZubrRider";
    }

    if (pathname === "/login") {
        return "ZubrRider | Logowanie";
    }

    if (pathname === "/register") {
        return "ZubrRider | Rejestracja";
    }

    if (pathname === "/profile") {
        return "ZubrRider | Mój profil";
    }

    if (pathname === "/my-rides") {
        return "ZubrRider | Moje przejazdy";
    }

    if (pathname === "/publish-ride") {
        return "ZubrRider | Dodaj przejazd";
    }

    if (pathname.startsWith("/ride/")) {
        return "ZubrRider | Szczegóły przejazdu";
    }

    if (pathname.startsWith("/driver/")) {
        return "ZubrRider | Profil kierowcy";
    }

    return "ZubrRider | Strona";
}

function Layout() {
    const location = useLocation();
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

    useEffect(() => {
        document.title = getPageTitle(location.pathname);
    }, [location.pathname]);

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
