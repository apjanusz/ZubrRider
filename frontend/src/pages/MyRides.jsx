import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";

function MyRides() {
    const [rides, setRides] = useState({ as_driver: [], as_passenger: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("driver");
    const [showAllPast, setShowAllPast] = useState(false);

    useEffect(() => {
        fetchMyRides();
    }, []);

    const fetchMyRides = async () => {
        try {
            const res = await api.get("/api/rides/my-rides/");
            setRides(res.data);
        } catch (error) {
            console.error("Błąd pobierania tras:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (rideId) => {
        const confirmCancel = window.confirm("Czy na pewno chcesz zrezygnować z rezerwacji?");
        if (confirmCancel) {
            try {
                await api.post(`/api/rides/${rideId}/cancel/`);
                setRides(prev => ({
                    ...prev,
                    as_passenger: prev.as_passenger.filter(r => r.id !== rideId)
                }));
            } catch (err) {
                alert(err.response?.data?.error || "Nie udało się anulować rezerwacji.");
            }
        }
    };

    if (loading) return <div className="text-center mt-10">Ładowanie Twoich tras...</div>;

    const now = new Date();
    const sortFn = (a, b) => new Date(`${a.departure_date}T${a.departure_time}`) - new Date(`${b.departure_date}T${b.departure_time}`);

    const upcomingDriver = rides.as_driver.filter(r => new Date(`${r.departure_date}T${r.departure_time}`) >= now).sort(sortFn);
    const pastDriver = rides.as_driver.filter(r => new Date(`${r.departure_date}T${r.departure_time}`) < now).sort(sortFn);

    const upcomingPassenger = rides.as_passenger.filter(r => new Date(`${r.departure_date}T${r.departure_time}`) >= now).sort(sortFn);
    const pastPassenger = rides.as_passenger.filter(r => new Date(`${r.departure_date}T${r.departure_time}`) < now).sort(sortFn);

    const displayedRides = activeTab === "driver" ? upcomingDriver : upcomingPassenger;
    const historyRides = activeTab === "driver" ? pastDriver : pastPassenger;
    const displayedHistory = showAllPast ? historyRides : historyRides.slice(-3);

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <h1 className="text-3xl font-bold text-zubr-dark mb-8">Moje Przejazdy</h1>

            <div className="flex border-b border-gray-200 mb-8">
                <button
                    className={`px-6 py-3 font-bold transition-colors border-b-4 ${activeTab === "driver" ? "border-zubr-gold text-zubr-dark" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    onClick={() => { setActiveTab("driver"); setShowAllPast(false); }}
                >
                    Jako Kierowca ({rides.as_driver.length})
                </button>
                <button
                    className={`px-6 py-3 font-bold transition-colors border-b-4 ${activeTab === "passenger" ? "border-zubr-gold text-zubr-dark" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    onClick={() => { setActiveTab("passenger"); setShowAllPast(false); }}
                >
                    Jako Pasażer ({rides.as_passenger.length})
                </button>
            </div>

            <div className="space-y-10">
                <div>
                    <h2 className="text-2xl font-bold text-zubr-dark mb-6">Nadchodzące przejazdy</h2>
                    {displayedRides.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {displayedRides.map((ride) => {
                                    const bookedSeats = (ride.car?.seats || 0) - ride.available_seats;

                                    return (
                                        <motion.div
                                            key={ride.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="bg-white rounded-xl shadow-lg border-2 border-zubr-gold overflow-hidden flex flex-col"
                                        >
                                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-zubr-dark text-lg">
                                                        {ride.start_location?.city} - {ride.end_location?.city}
                                                    </span>
                                                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded uppercase">
                                                        {ride.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Data: {ride.departure_date} | Godzina: {ride.departure_time?.slice(0, 5)}
                                                </p>
                                            </div>

                                            <div className="p-4 flex-1 space-y-3">
                                                <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">Pojazd</span>
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium">{ride.car?.brand} {ride.car?.model}</span>
                                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{ride.car?.license_plate}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                    <span className="text-xs font-bold text-gray-500 uppercase">Status rezerwacji</span>
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-2xl font-bold text-zubr-dark">
                                                            {bookedSeats} / {ride.car?.seats}
                                                        </span>
                                                        <span className="text-xs text-gray-400 mb-1">zajętych miejsc</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-gray-50 flex gap-2">
                                                <Link to={`/ride/${ride.id}`} className="flex-1 text-center bg-zubr-dark text-white py-2 rounded font-bold hover:bg-green-800 transition">
                                                    Szczegóły
                                                </Link>
                                                {activeTab === "passenger" && (
                                                    <button
                                                        onClick={() => handleCancelBooking(ride.id)}
                                                        className="flex-1 text-center bg-red-50 text-red-600 border border-red-200 py-2 rounded font-bold hover:bg-red-100 transition"
                                                    >
                                                        Anuluj
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Brak aktywnych przejazdów w tej kategorii.</p>
                    )}
                </div>

                {historyRides.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <h2 className="text-xl font-bold text-gray-400 mb-6 flex items-center gap-2">
                            Historia - Przejazdy zakończone
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedHistory.map((ride) => (
                                <motion.div
                                    key={ride.id}
                                    initial={{ opacity: 0.6 }}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden grayscale opacity-75"
                                >
                                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                                        <span className="font-bold text-gray-500">{ride.start_location?.city} - {ride.end_location?.city}</span>
                                        <p className="text-xs text-gray-400 mt-1">{ride.departure_date} | {ride.departure_time?.slice(0, 5)}</p>
                                    </div>
                                    <div className="p-3 text-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Przejazd archiwalny</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {historyRides.length > 3 && (
                            <button
                                onClick={() => setShowAllPast(!showAllPast)}
                                className="mt-6 text-sm font-bold text-zubr-dark hover:underline"
                            >
                                {showAllPast ? "Ukryj starsze" : `Pokaż wszystkie poprzednie (${historyRides.length})`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyRides;