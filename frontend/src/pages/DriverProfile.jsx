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
        <div className="w-full pb-10">
            {/* Header Profilu */}
            <div className="mb-6 overflow-hidden rounded-2xl border-t-4 border-zubr-gold bg-white shadow-xl sm:mb-8">
                <div className="relative h-28 w-full bg-zubr-dark sm:h-40">
                    <div className="absolute -bottom-12 left-5 sm:-bottom-14 sm:left-10">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gray-100 text-3xl font-bold uppercase text-zubr-dark shadow-lg sm:h-32 sm:w-32 sm:text-4xl">
                            {getInitials()}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-5 px-5 pb-5 pt-14 sm:px-10 sm:pb-6 sm:pt-16 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                                {driver.first_name} {driver.last_name}
                            </h1>
                            {/* <ShieldCheck className="text-blue-500" size={24} title="Użytkownik zweryfikowany" /> */}
                        </div>
                        <p className="text-base text-gray-500 sm:text-lg">@{driver.username}</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-400">
                            <Calendar size={16} />
                            Kierowca od: {new Date(driver.date_joined).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Statystyki w Headerze */}
                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:mt-0 md:w-auto md:gap-6">
                        <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center md:min-w-[120px]">
                            <div className="flex justify-center mb-1 text-zubr-dark">
                                <Navigation size={20} />
                            </div>
                            <span className="block text-2xl font-bold text-zubr-dark">{driver.stats.rides_count}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Przejazdów</span>
                        </div>
                        <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center md:min-w-[120px]">
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">

                {/* Kolumna Lewa: Samochody */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="rounded-xl bg-white p-5 shadow-md sm:p-6">
                        <h2 className="mb-5 flex items-center gap-3 text-lg font-bold text-zubr-dark sm:mb-6 sm:text-xl">
                            <Car size={24} className="text-zubr-gold" /> Pojazdy
                        </h2>
                        {driver.cars.length > 0 ? (
                            <div className="space-y-4">
                                {driver.cars.map((car, index) => (
                                    <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <CheckCircle2 size={14} className="text-green-600" />
                                            <p className="font-bold text-gray-800">{car.brand} {car.model}</p>
                                        </div>
                                        <div className="mt-1 flex flex-col gap-2 text-xs font-medium text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                                            <span className="w-fit rounded border border-gray-100 bg-white px-2 py-1 uppercase tracking-tighter">{car.license_plate}</span>
                                            <span className="flex items-center gap-1">Miejsc: {car.seats}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-lg border border-dashed py-4 text-center text-sm italic text-gray-400">Brak przypisanych pojazdów.</p>
                        )}
                    </div>
                </div>

                {/* Kolumna Prawa: Opinie */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl bg-white p-5 shadow-md sm:p-8">
                        <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-zubr-dark sm:mb-8 sm:text-2xl">
                            <MessageSquare size={26} className="text-zubr-gold" /> Opinie pasażerów
                        </h2>

                        {driver.reviews.length > 0 ? (
                            <div className="space-y-6 sm:space-y-8">
                                {driver.reviews.map((review, index) => (
                                    <div key={index} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0 sm:pb-8">
                                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <User size={18} />
                                                </div>
                                                <span className="font-bold text-gray-800">{review.rater_name || "Anonimowy pasażer"}</span>
                                            </div>
                                            <div className="flex w-fit items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-3 py-1">
                                                <span className="font-bold text-zubr-gold">{review.score}</span>
                                                <Star size={14} className="fill-zubr-gold text-zubr-gold" />
                                            </div>
                                        </div>
                                        <p className="pl-0 text-gray-600 italic leading-relaxed sm:pl-11">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center sm:py-16">
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
