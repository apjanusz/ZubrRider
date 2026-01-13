import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import logo from "../assets/logo_clear.svg";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = localStorage.getItem(ACCESS_TOKEN);
    const [hoveredTab, setHoveredTab] = useState(null);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const links = isAuthenticated
        ? [
            { name: "Szukaj", path: "/" },
            { name: "Dodaj", path: "/publish-ride" },      // Zmieniona nazwa
            { name: "Moje Przejazdy", path: "/my-rides" }, // NOWY LINK
            { name: "Profil", path: "/profile" },          // Zmieniona nazwa
            { name: "Wyloguj", path: "#logout", action: handleLogout },
        ]
        : [
            { name: "Logowanie", path: "/login" },
            { name: "Rejestracja", path: "/register" },
        ];

    return (
        <div className="fixed top-6 inset-x-0 z-50 flex justify-center px-4">
            <div className="flex items-center gap-2 p-3 bg-zubr-dark/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">

                <Link
                    to="/"
                    className="px-4 py-2 mr-2 flex items-center hover:opacity-80 transition-opacity border-r border-white/10"
                >
                    <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />
                </Link>

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
                                isLogout ? "ml-8" : ""
                            )}
                        >
                            {/* ELEMENT KLIKALNY (Tekst) */}
                            {link.action ? (
                                <button
                                    onClick={link.action}
                                    className={cn(
                                        "relative z-10 px-6 py-3 text-base font-medium transition-colors duration-200 block whitespace-nowrap",
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
                                        "relative z-10 px-6 py-3 text-base font-medium transition-colors duration-200 block whitespace-nowrap",
                                        isActive ? "text-zubr-dark" : "text-gray-200",
                                        isHovered && !isActive ? "text-white" : ""
                                    )}
                                >
                                    {link.name}
                                </Link>
                            )}

                            {/* TŁO (ANIMACJE) */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute inset-0 bg-zubr-gold rounded-xl z-0"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                {isHovered && !isActive && (
                                    <motion.div
                                        className={cn(
                                            "absolute inset-0 rounded-xl z-0",
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
    );
}

export default Navbar;