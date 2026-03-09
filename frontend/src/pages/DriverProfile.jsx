import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import {
    Star,
    Car,
    MessageSquare,
    Calendar,
    Navigation,
    User,
    CheckCircle2,
    ShieldCheck
} from "lucide-react";

function DriverProfile() {
    const { id } = useParams();
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDriver = async () => {
            try {
                const res = await api.get(`/api/accounts/driver/${id}/`);
                setDriver(res.data);
            } catch (error) {
                console.error(error);
                alert("Nie znaleziono kierowcy.");
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        fetchDriver();
    }, [id, navigate]);

    if (loading) return <div className="text-center mt-10 text-gray-500">Ładowanie profilu kierowcy...</div>;
    if (!driver) return null;

    const getInitials = () => {
        const first = driver.first_name ? driver.first_name[0] : "";
        const last = driver.last_name ? driver.last_name[0] : "";
        return (first + last) || driver.username[0];
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            {/* Header Profilu */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border-t-4 border-zubr-gold">
                <div className="bg-zubr-dark h-40 w-full relative">
                    <div className="absolute -bottom-14 left-10">
                        <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white flex items-center justify-center text-zubr-dark text-4xl font-bold uppercase shadow-lg">
                            {getInitials()}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-6 px-10 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-gray-800">
                                {driver.first_name} {driver.last_name}
                            </h1>
                            <ShieldCheck className="text-blue-500" size={24} title="Użytkownik zweryfikowany" />
                        </div>
                        <p className="text-gray-500 text-lg">@{driver.username}</p>
                        <p className="text-sm text-gray-400 mt-2 flex items-center gap-2 font-medium">
                            <Calendar size={16} />
                            Kierowca od: {new Date(driver.date_joined).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Statystyki w Headerze */}
                    <div className="flex gap-6 mt-6 md:mt-0">
                        <div className="text-center bg-gray-50 p-4 rounded-xl border border-gray-100 min-w-[120px]">
                            <div className="flex justify-center mb-1 text-zubr-dark">
                                <Navigation size={20} />
                            </div>
                            <span className="block text-2xl font-bold text-zubr-dark">{driver.stats.rides_count}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Przejazdów</span>
                        </div>
                        <div className="text-center bg-gray-50 p-4 rounded-xl border border-gray-100 min-w-[120px]">
                            <div className="flex justify-center mb-1 text-zubr-gold">
                                <Star size={20} className="fill-zubr-gold" />
                            </div>
                            <span className="block text-2xl font-bold text-zubr-dark">
                                {driver.stats.rating_avg}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                Ocena ({driver.stats.rating_count})
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Kolumna Lewa: Samochody */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-zubr-dark mb-6 flex items-center gap-3">
                            <Car size={24} className="text-zubr-gold" /> Pojazdy
                        </h2>
                        {driver.cars.length > 0 ? (
                            <div className="space-y-4">
                                {driver.cars.map((car, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 size={14} className="text-green-600" />
                                            <p className="font-bold text-gray-800">{car.brand} {car.model}</p>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium text-gray-500 mt-1">
                                            <span className="bg-white px-2 py-1 rounded border border-gray-100 uppercase tracking-tighter">{car.license_plate}</span>
                                            <span className="flex items-center gap-1">Miejsc: {car.seats}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic text-sm py-4 text-center border border-dashed rounded-lg">Brak przypisanych pojazdów.</p>
                        )}
                    </div>
                </div>

                {/* Kolumna Prawa: Opinie */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-8 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold text-zubr-dark mb-8 flex items-center gap-3">
                            <MessageSquare size={26} className="text-zubr-gold" /> Opinie pasażerów
                        </h2>

                        {driver.reviews.length > 0 ? (
                            <div className="space-y-8">
                                {driver.reviews.map((review, index) => (
                                    <div key={index} className="border-b border-gray-50 last:border-0 pb-8 last:pb-0">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <User size={18} />
                                                </div>
                                                <span className="font-bold text-gray-800">{review.rater_name || "Anonimowy pasażer"}</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                                <span className="font-bold text-zubr-gold">{review.score}</span>
                                                <Star size={14} className="fill-zubr-gold text-zubr-gold" />
                                            </div>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed italic pl-11">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-500 font-medium">Ten kierowca nie ma jeszcze żadnych opinii.</p>
                                <p className="text-sm text-gray-400 mt-1">Bądź pierwszym pasażerem, który wystawi recenzję!</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default DriverProfile;