import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

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

    if (loading) return <div className="text-center mt-10">Ładowanie profilu kierowcy...</div>;
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
                        <h1 className="text-3xl font-bold text-gray-800">
                            {driver.first_name} {driver.last_name}
                        </h1>
                        <p className="text-gray-500 text-lg">@{driver.username}</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Kierowca od: {new Date(driver.date_joined).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Statystyki w Headerze */}
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <div className="text-center bg-gray-50 p-3 rounded-lg border border-gray-100 min-w-[100px]">
                            <span className="block text-2xl font-bold text-zubr-dark">{driver.stats.rides_count}</span>
                            <span className="text-xs text-gray-500 uppercase font-bold">Przejazdów</span>
                        </div>
                        <div className="text-center bg-gray-50 p-3 rounded-lg border border-gray-100 min-w-[100px]">
                            <span className="block text-2xl font-bold text-zubr-gold drop-shadow-sm">
                                {driver.stats.rating_avg} <span className="text-sm text-black">★</span>
                            </span>
                            <span className="text-xs text-gray-500 uppercase font-bold">
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
                        <h2 className="text-xl font-bold text-zubr-dark mb-4 flex items-center gap-2">
                            🚗 Pojazdy
                        </h2>
                        {driver.cars.length > 0 ? (
                            <div className="space-y-4">
                                {driver.cars.map((car, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="font-bold text-gray-800">{car.brand} {car.model}</p>
                                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                                            <span>{car.license_plate}</span>
                                            <span>Miejsc: {car.seats}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">Brak przypisanych pojazdów.</p>
                        )}
                    </div>
                </div>

                {/* Kolumna Prawa: Opinie */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-8 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold text-zubr-dark mb-6 flex items-center gap-2">
                            💬 Opinie pasażerów
                        </h2>

                        {driver.reviews.length > 0 ? (
                            <div className="space-y-6">
                                {driver.reviews.map((review, index) => (
                                    <div key={index} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800">{review.rater_name || "Anonim"}</span>
                                            <span className="text-zubr-gold font-bold">
                                                {review.score} / 5 ★
                                            </span>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-500">Ten kierowca nie ma jeszcze żadnych opinii.</p>
                                <p className="text-sm text-gray-400">Bądź pierwszym pasażerem!</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default DriverProfile;