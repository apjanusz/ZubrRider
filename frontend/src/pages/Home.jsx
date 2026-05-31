import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { Search, Plus, MapPin, Calendar, Star, ArrowRight, Clock } from "lucide-react";

function Home() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Stan dla wyszukiwarki
    const [search, setSearch] = useState({
        from: "",
        to: "",
        date: ""
    });

    useEffect(() => {
        const fetchRides = async () => {
            try {
                const response = await api.get("/api/rides/");
                setRides(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Błąd podczas pobierania przejazdów", err);
                setError("Nie udało się pobrać przejazdów.");
                setLoading(false);
            }
        };
        fetchRides();
    }, []);

    // 1. Najpierw filtrujemy nadchodzące
    const now = new Date();
    const upcomingRides = rides.filter(ride => {
        const rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time}`);
        return rideDateTime >= now;
    });

    // 2. Potem filtrujemy na podstawie wyszukiwarki (Live Search)
    const filteredRides = upcomingRides.filter(ride => {
        const matchesFrom = ride.start_location?.city.toLowerCase().includes(search.from.toLowerCase());
        const matchesTo = ride.end_location?.city.toLowerCase().includes(search.to.toLowerCase());
        const matchesDate = !search.date || ride.departure_date === search.date;

        return matchesFrom && matchesTo && matchesDate;
    });

    return (
        <div className="flex flex-col gap-8">
            {/* Hero Section */}
            <div className="bg-zubr-dark rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-green-700 rounded-full opacity-50 blur-3xl"></div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Podróżuj razem <br/>
                        <span className="text-zubr-gold">taniej i wygodniej</span>
                    </h1>
                    <p className="text-green-100 text-lg mb-8 opacity-90">
                        Znajdź wolne miejsce w samochodzie lub zabierz pasażerów.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/my-rides"
                              className="bg-zubr-gold text-zubr-dark px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition shadow-lg flex items-center gap-2">
                            Moje przejazdy
                        </Link>
                        <a href="#rides"
                           className="border border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white hover:text-zubr-dark transition flex items-center gap-2">
                            <Search size={20} /> Szukaj trasy
                        </a>
                    </div>
                </div>
            </div>

            {/* Wyszukiwanie (Live) */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 -mt-16 mx-4 md:mx-0 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skąd?</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Np. Białystok"
                                value={search.from}
                                onChange={(e) => setSearch({...search, from: e.target.value})}
                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zubr-dark focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dokąd?</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Np. Choroszcz"
                                value={search.to}
                                onChange={(e) => setSearch({...search, to: e.target.value})}
                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zubr-dark focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kiedy?</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input
                                type="date"
                                value={search.date}
                                onChange={(e) => setSearch({...search, date: e.target.value})}
                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zubr-dark focus:outline-none"
                            />
                        </div>
                    </div>
                    <button
                        className="bg-zubr-dark text-white p-3 rounded-lg font-bold hover:bg-green-800 transition h-[50px] flex items-center justify-center gap-2"
                        onClick={() => document.getElementById('rides').scrollIntoView({ behavior: 'smooth' })}
                    >
                        <Search size={20} /> Szukaj
                    </button>
                </div>
            </div>

            {/* Lista przejazdów */}
            <div id="rides" className="mt-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-zubr-dark flex items-center gap-2">
                        <Calendar className="text-zubr-gold" />
                        {search.from || search.to || search.date ? "Wyniki wyszukiwania" : "Dostępne nadchodzące przejazdy"}
                    </h2>
                    {(search.from || search.to || search.date) && (
                        <button
                            onClick={() => setSearch({from: "", to: "", date: ""})}
                            className="text-sm text-red-500 font-bold hover:underline"
                        >
                            Wyczyść filtry
                        </button>
                    )}
                </div>

                {loading && <p className="text-center py-10 text-gray-500">Ładowanie przejazdów...</p>}

                {!loading && filteredRides.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <Search size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">Brak przejazdów spełniających Twoje kryteria.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRides.map((ride) => (
                        <div key={ride.id}
                             className="bg-white rounded-xl shadow-md hover:shadow-xl transition duration-300 border border-gray-100 overflow-hidden group">
                            {/* ... (reszta kafelka pozostaje bez zmian) ... */}
                            <div className="p-5 border-b border-gray-100 bg-gray-50">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="font-bold text-gray-800 text-lg">{ride.start_location?.city}</span>
                                    </div>
                                    <div className="ml-1 my-1 border-l-2 border-dashed border-gray-300 h-6"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="font-bold text-gray-800 text-lg">{ride.end_location?.city}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zubr-light flex items-center justify-center text-zubr-dark font-bold">
                                            {ride.driver?.first_name?.[0] || "?"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{ride.driver?.first_name}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Star size={12} className="fill-zubr-gold text-zubr-gold" /> 4.8 / 5
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-bold text-zubr-dark">{ride.cost_per_passenger} PLN</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
                                    <span className="flex items-center gap-1"><Clock size={14} /> {ride.departure_time?.slice(0, 5)}</span>
                                    <span>Wolne miejsca: {ride.available_seats}</span>
                                </div>
                            </div>

                            <Link
                                to={`/ride/${ride.id}`}
                                className="block bg-zubr-dark text-white text-center py-3 font-bold hover:bg-green-800 transition flex items-center justify-center gap-2"
                            >
                                Zobacz szczegóły <ArrowRight size={18} />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Home;
