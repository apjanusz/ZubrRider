import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Car, MessageSquare, Star } from "lucide-react";
import DriverCard from "../components/DriverCard";

function MyRides() {
    const navigate = useNavigate();
    const [rides, setRides] = useState({ as_driver: [], as_passenger: [] });
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("driver");
    const [showAllPast, setShowAllPast] = useState(false);
    const [showMissingCarModal, setShowMissingCarModal] = useState(false);
    const [ratingRide, setRatingRide] = useState(null);
    const [ratingForm, setRatingForm] = useState({ score: 5, comment: "" });
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingError, setRatingError] = useState("");

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

    const handleOpenRating = (ride) => {
        setRatingRide(ride);
        setRatingForm({ score: 5, comment: "" });
        setRatingError("");
    };

    const handleCloseRating = () => {
        if (ratingSubmitting) {
            return;
        }
        setRatingRide(null);
        setRatingError("");
    };

    const handleSubmitRating = async (e) => {
        e.preventDefault();
        if (!ratingRide) {
            return;
        }

        setRatingSubmitting(true);
        setRatingError("");

        try {
            await api.post(`/api/community/rate/${ratingRide.id}/`, ratingForm);
            alert("Dziękujemy! Ocena została zapisana.");
            await fetchMyRides();
            setRatingRide(null);
        } catch (error) {
            const data = error.response?.data;
            const detail =
                data?.ride ||
                data?.score ||
                data?.comment ||
                data?.detail ||
                "Nie udało się zapisać oceny kierowcy.";
            setRatingError(Array.isArray(detail) ? detail.join(" ") : detail);
        } finally {
            setRatingSubmitting(false);
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
                                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                                >
                                    <div className="border-b border-gray-200 bg-white p-4">
                                        <span className="text-lg font-bold text-zubr-dark">{ride.start_location?.city} - {ride.end_location?.city}</span>
                                        <p className="mt-1 text-sm text-gray-500">{ride.departure_date} | {ride.departure_time?.slice(0, 5)}</p>
                                    </div>
                                    <div className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="text-left">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">Przejazd archiwalny</span>
                                        </div>
                                        {activeTab === "passenger" &&
                                            (ride.current_user_has_rated ? (
                                                <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                                                    <Star size={16} className="fill-green-700 text-green-700" />
                                                    Ocena dodana
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenRating(ride)}
                                                    className="inline-flex items-center justify-center rounded-xl bg-zubr-gold px-4 py-3 text-sm font-bold text-white opacity-100 transition hover:bg-yellow-400"
                                                >
                                                    Oceń kierowcę
                                                </button>
                                            ))}
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
                {ratingRide && (
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
                            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
                        >
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-zubr-dark">Oceń kierowcę</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Przejazd {ratingRide.start_location?.city} - {ratingRide.end_location?.city}
                                </p>
                                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zubr-dark text-base font-bold text-white">
                                        {ratingRide.driver?.first_name?.[0] || "?"}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                                            Oceniasz kierowcę
                                        </p>
                                        <p className="text-base font-semibold text-gray-800">
                                            {ratingRide.driver?.first_name || "Kierowca"} {ratingRide.driver?.last_name || ""}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitRating} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                                        Ocena
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[1, 2, 3, 4, 5].map((value) => {
                                            const isActive = ratingForm.score === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setRatingForm((prev) => ({ ...prev, score: value }))}
                                                    className={`flex items-center justify-center gap-1 rounded-xl border px-3 py-3 font-bold transition ${
                                                        isActive
                                                            ? "border-zubr-gold bg-zubr-gold text-zubr-dark"
                                                            : "border-gray-200 bg-white text-gray-600 hover:border-zubr-gold/50"
                                                    }`}
                                                >
                                                    <Star size={16} className={isActive ? "fill-zubr-dark text-zubr-dark" : "text-zubr-gold"} />
                                                    {value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                                        Komentarz
                                    </label>
                                    <textarea
                                        value={ratingForm.comment}
                                        onChange={(e) => setRatingForm((prev) => ({ ...prev, comment: e.target.value }))}
                                        rows={4}
                                        placeholder="Napisz kilka słów o przejeździe..."
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-zubr-gold"
                                    />
                                </div>

                                {ratingError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {ratingError}
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={handleCloseRating}
                                        className="inline-flex items-center justify-center rounded-xl border border-zubr-dark px-5 py-3 font-bold text-zubr-dark transition hover:bg-zubr-dark hover:text-white"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={ratingSubmitting}
                                        className="inline-flex items-center justify-center rounded-xl bg-zubr-dark px-5 py-3 font-bold text-white transition hover:bg-zubr-gold disabled:opacity-60"
                                    >
                                        {ratingSubmitting ? "Zapisywanie..." : "Wyślij ocenę"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

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
