import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Car } from "lucide-react";
import DriverCard from "../components/DriverCard";

function MyRides() {
    const navigate = useNavigate();
    const [rides, setRides] = useState({ as_driver: [], as_passenger: [] });
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("driver");
    const [showAllPast, setShowAllPast] = useState(false);
    const [showMissingCarModal, setShowMissingCarModal] = useState(false);

    useEffect(() => {
        fetchMyRides();
        fetchMyCars();
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

    const fetchMyCars = async () => {
        try {
            const res = await api.get("/api/accounts/my-cars/");
            setCars(res.data);
        } catch (error) {
            console.error("Błąd pobierania pojazdów:", error);
        }
    };

    const handleAddRide = () => {
        if (cars.length === 0) {
            setShowMissingCarModal(true);
            return;
        }

        navigate("/publish-ride");
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
        <div className="w-full pb-12">
            <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zubr-dark sm:text-3xl">Moje Przejazdy</h1>
                    <p className="mt-2 text-sm text-gray-600 sm:text-base">
                        Zarządzaj swoimi przejazdami jako kierowca i pasażer.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleAddRide}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-zubr-dark px-5 py-3 font-bold text-white transition hover:bg-zubr-gold sm:w-auto"
                >
                    Dodaj przejazd
                </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-2 border-b border-gray-200 pb-3 sm:mb-8 sm:grid-cols-2 sm:gap-0 sm:pb-0">
                <button
                    className={`border-b-4 px-4 py-3 text-left font-bold transition-colors sm:px-6 ${activeTab === "driver" ? "border-zubr-gold text-zubr-dark" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    onClick={() => { setActiveTab("driver"); setShowAllPast(false); }}
                >
                    Jako Kierowca ({rides.as_driver.length})
                </button>
                <button
                    className={`border-b-4 px-4 py-3 text-left font-bold transition-colors sm:px-6 ${activeTab === "passenger" ? "border-zubr-gold text-zubr-dark" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    onClick={() => { setActiveTab("passenger"); setShowAllPast(false); }}
                >
                    Jako Pasażer ({rides.as_passenger.length})
                </button>
            </div>

            {activeTab === "driver" && <DriverCard />}

            <div className="space-y-8 sm:space-y-10">
                <div>
                    <h2 className="mb-5 text-xl font-bold text-zubr-dark sm:mb-6 sm:text-2xl">Nadchodzące przejazdy</h2>
                    {displayedRides.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                                            className="flex flex-col overflow-hidden rounded-xl border-2 border-zubr-gold bg-white shadow-lg"
                                        >
                                            <div className="border-b border-gray-100 bg-gray-50 p-4">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <span className="text-base font-bold text-zubr-dark sm:text-lg">
                                                        {ride.start_location?.city} - {ride.end_location?.city}
                                                    </span>
                                                    <span className="w-fit rounded bg-green-100 px-2 py-1 text-xs font-bold uppercase text-green-700">
                                                        {ride.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Data: {ride.departure_date} | Godzina: {ride.departure_time?.slice(0, 5)}
                                                </p>
                                            </div>

                                            <div className="flex-1 space-y-3 p-4">
                                                <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">Pojazd</span>
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <span className="font-medium">{ride.car?.brand} {ride.car?.model}</span>
                                                        <span className="w-fit rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs">{ride.car?.license_plate}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1 rounded-lg border border-gray-100 bg-gray-50 p-3">
                                                    <span className="text-xs font-bold text-gray-500 uppercase">Status rezerwacji</span>
                                                    <div className="flex items-end justify-between gap-3">
                                                        <span className="text-2xl font-bold text-zubr-dark">
                                                            {bookedSeats} / {ride.car?.seats}
                                                        </span>
                                                        <span className="text-xs text-gray-400 mb-1">zajętych miejsc</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 bg-gray-50 p-4 sm:flex-row">
                                                <Link to={`/ride/${ride.id}`} className="flex-1 rounded bg-zubr-dark py-2 text-center font-bold text-white transition hover:bg-green-800">
                                                    Szczegóły
                                                </Link>
                                                {activeTab === "passenger" && (
                                                    <button
                                                        onClick={() => handleCancelBooking(ride.id)}
                                                        className="flex-1 rounded border border-red-200 bg-red-50 py-2 text-center font-bold text-red-600 transition hover:bg-red-100"
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
                    <div className="mt-10 border-t border-gray-200 pt-6 sm:mt-12 sm:pt-8">
                        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-400 sm:mb-6 sm:text-xl">
                            Historia - Przejazdy zakończone
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {displayedHistory.map((ride) => (
                                <motion.div
                                    key={ride.id}
                                    initial={{ opacity: 0.6 }}
                                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm grayscale opacity-75"
                                >
                                    <div className="border-b border-gray-200 bg-gray-50 p-4">
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
                                className="mt-5 text-sm font-bold text-zubr-dark hover:underline sm:mt-6"
                            >
                                {showAllPast ? "Ukryj starsze" : `Pokaż wszystkie poprzednie (${historyRides.length})`}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showMissingCarModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.96 }}
                            className="w-full max-w-xl rounded-3xl border-t-4 border-red-500 bg-white p-8 text-center shadow-2xl"
                        >
                            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                            <h2 className="mb-4 text-3xl font-bold text-zubr-dark">Nie masz dodanego samochodu!</h2>
                            <p className="mx-auto mb-8 max-w-md text-lg text-gray-600">
                                Aby opublikować przejazd, najpierw dodaj pojazd w swoim profilu.
                            </p>
                            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => navigate("/profile")}
                                    className="inline-flex items-center gap-2 rounded-xl bg-zubr-dark px-5 py-3 font-bold text-white transition hover:bg-zubr-gold"
                                >
                                    <Car size={18} />
                                    Przejdz do profilu
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowMissingCarModal(false)}
                                    className="rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-600 transition hover:bg-gray-50"
                                >
                                    Zamknij
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MyRides;
