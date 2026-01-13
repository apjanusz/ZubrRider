import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function MyRides() {
    const [rides, setRides] = useState({ as_driver: [], as_passenger: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("driver"); // "driver" lub "passenger"

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

    if (loading) return <div className="text-center mt-10">Ładowanie Twoich tras...</div>;

    const displayedRides = activeTab === "driver" ? rides.as_driver : rides.as_passenger;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-zubr-dark mb-8">Moje Przejazdy</h1>

            {/* Zakładki */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    className={`px-6 py-3 font-bold transition-colors border-b-4 ${
                        activeTab === "driver"
                            ? "border-zubr-gold text-zubr-dark"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("driver")}
                >
                    Jako Kierowca ({rides.as_driver.length})
                </button>
                <button
                    className={`px-6 py-3 font-bold transition-colors border-b-4 ${
                        activeTab === "passenger"
                            ? "border-zubr-gold text-zubr-dark"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("passenger")}
                >
                    Jako Pasażer ({rides.as_passenger.length})
                </button>
            </div>

            {/* Lista */}
            {displayedRides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedRides.map((ride) => (
                        <div key={ride.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden hover:shadow-lg transition">
                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-zubr-dark truncate max-w-[70%]">
                                        {ride.start_location.city} ➝ {ride.end_location.city}
                                    </span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">
                                        {ride.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {ride.departure_date} • {ride.departure_time.slice(0, 5)}
                                </p>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-center text-sm mb-4">
                                    <span>Wolne miejsca: {ride.available_seats}</span>
                                    <span className="font-bold text-lg">{ride.cost_per_passenger} PLN</span>
                                </div>
                                <Link
                                    to={`/ride/${ride.id}`}
                                    className="block text-center bg-white border border-zubr-dark text-zubr-dark py-2 rounded hover:bg-zubr-dark hover:text-white transition"
                                >
                                    Szczegóły
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg mb-4">Brak przejazdów w tej kategorii.</p>
                    {activeTab === "driver" && (
                        <Link to="/publish-ride" className="bg-zubr-gold text-zubr-dark px-6 py-2 rounded-lg font-bold shadow hover:bg-yellow-400">
                            Dodaj pierwszy przejazd
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

export default MyRides;