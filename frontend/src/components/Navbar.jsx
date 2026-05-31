import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Menu, X } from "lucide-react";

import logo from "../assets/logo_clear.svg";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function Navbar() {
    const headerRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = localStorage.getItem(ACCESS_TOKEN);
    const [hoveredTab, setHoveredTab] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);

    useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.getBoundingClientRect().height);
            }
        };

        updateHeaderHeight();
        window.addEventListener("resize", updateHeaderHeight);
        return () => window.removeEventListener("resize", updateHeaderHeight);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setIsMobileMenuOpen(false);
        navigate("/login");
    };

    const links = isAuthenticated
        ? [
            { name: "Szukaj", path: "/" },
            { name: "Moje Przejazdy", path: "/my-rides" },
            { name: "Profil", path: "/profile" },
            { name: "Wyloguj", path: "#logout", action: handleLogout },
        ]
        : [
            { name: "Logowanie", path: "/login" },
            { name: "Rejestracja", path: "/register" },
        ];

    return (
        <header ref={headerRef} className="relative z-50 w-full">
            <div className="relative w-full">
                <div className="w-full rounded-none bg-zubr-dark/95 shadow-2xl backdrop-blur-md sm:border-y sm:border-white/10">
                    <div className="mx-auto flex w-full max-w-7xl items-center gap-2 p-3 sm:px-6 lg:px-8">

                        <Link
                            to="/"
                            className="flex items-center px-4 py-2 transition-opacity hover:opacity-80 md:mr-2 md:border-r md:border-white/10"
                        >
                            <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />
                        </Link>

                        {isAuthenticated && (
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                                className="ml-auto inline-flex items-center justify-center rounded-xl border border-white/10 p-3 text-white transition hover:bg-white/10 md:hidden"
                                aria-label={isMobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
                                aria-expanded={isMobileMenuOpen}
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}

                        {!isAuthenticated && (
                            <div className="ml-auto flex items-center gap-2 md:hidden">
                                {links.map((link) => {
                                    const isActive = location.pathname === link.path;

                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            className={cn(
                                                "rounded-xl px-4 py-3 text-sm font-semibold transition",
                                                isActive
                                                    ? "bg-zubr-gold text-zubr-dark"
                                                    : "text-white hover:bg-white/10"
                                            )}
                                        >
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        <div className={cn(
                            "hidden min-w-0 items-center gap-2 md:flex md:flex-1",
                            !isAuthenticated ? "md:justify-end" : ""
                        )}>
                            {links.map((link) => {
                                const isActive = location.pathname === link.path;
                                const isHovered = hoveredTab === link.path;
                                const isLogout = link.name === "Wyloguj";

                                return (
                                    <div
                                        key={link.path}
                                        onMouseEnter={() => setHoveredTab(link.path)}
                                        onMouseLeave={() => setHoveredTab(null)}
                                        className={cn(
                                            "relative",
                                            isLogout ? "ml-auto" : ""
                                        )}
                                    >
                                        {link.action ? (
                                            <button
                                                onClick={link.action}
                                                className={cn(
                                                    "relative z-10 block whitespace-nowrap px-6 py-3 text-base font-medium transition-colors duration-200",
                                                    isActive ? "text-zubr-dark" : "text-gray-200",
                                                    isHovered && !isActive && isLogout ? "text-black" : "",
                                                    isHovered && !isActive && !isLogout ? "text-white" : ""
                                                )}
                                            >
                                                {link.name}
                                            </button>
                                        ) : (
                                            <Link
                                                to={link.path}
                                                className={cn(
                                                    "relative z-10 block whitespace-nowrap px-6 py-3 text-base font-medium transition-colors duration-200",
                                                    isActive ? "text-zubr-dark" : "text-gray-200",
                                                    isHovered && !isActive ? "text-white" : ""
                                                )}
                                            >
                                                {link.name}
                                            </Link>
                                        )}

                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-pill"
                                                    className="absolute inset-0 z-0 rounded-xl bg-zubr-gold"
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}

                                            {isHovered && !isActive && (
                                                <motion.div
                                                    className={cn(
                                                        "absolute inset-0 z-0 rounded-xl",
                                                        isLogout ? "bg-red-500" : "bg-white/10"
                                                    )}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {isAuthenticated && isMobileMenuOpen && (
                    <>
                        <motion.button
                            type="button"
                            aria-label="Zamknij menu"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-x-0 bottom-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
                            style={{ top: Math.max(headerHeight-4, 0) }}
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 32 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 32 }}
                            transition={{ duration: 0.2 }}
                            className="fixed bottom-0 right-0 z-40 flex w-[82vw] max-w-sm flex-col border-l border-white/10 bg-zubr-dark p-5 shadow-2xl md:hidden"
                            style={{ top: Math.max(headerHeight - 4, 0) }}
                        >
                            <div className="flex flex-1 flex-col gap-2">
                                {links.map((link) => {
                                    const isActive = location.pathname === link.path;
                                    const baseClasses = cn(
                                        "rounded-2xl px-4 py-4 text-left text-base font-semibold transition",
                                        isActive
                                            ? "bg-zubr-gold text-zubr-dark"
                                            : link.action
                                                ? "text-white hover:bg-red-500 hover:text-white"
                                                : "text-white hover:bg-white/10"
                                    );

                                    if (link.action) {
                                        return (
                                            <button
                                                key={link.path}
                                                type="button"
                                                onClick={link.action}
                                                className={baseClasses}
                                            >
                                                {link.name}
                                            </button>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={baseClasses}
                                        >
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}

export default Navbar;
