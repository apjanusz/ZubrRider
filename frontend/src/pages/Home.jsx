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
        <div className="flex flex-col gap-6 sm:gap-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-zubr-dark px-5 py-8 text-white shadow-xl sm:px-8 sm:py-10">
                <div className="absolute right-0 top-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-green-700 opacity-50 blur-3xl sm:-mr-16 sm:-mt-16 sm:h-64 sm:w-64"></div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                        Podróżuj razem <br/>
                        <span className="text-zubr-gold">taniej i wygodniej</span>
                    </h1>
                    <p className="mb-6 text-base text-green-100 opacity-90 sm:mb-8 sm:text-lg">
                        Znajdź wolne miejsce w samochodzie lub zabierz pasażerów.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                        <Link to="/my-rides"
                              className="flex items-center justify-center gap-2 rounded-lg bg-zubr-gold px-6 py-3 text-center font-bold text-zubr-dark shadow-lg transition hover:bg-yellow-400">
                            Moje przejazdy
                        </Link>
                        <a href="#rides"
                           className="flex items-center justify-center gap-2 rounded-lg border border-white px-6 py-3 text-center font-bold text-white transition hover:bg-white hover:text-zubr-dark">
                            <Search size={20} /> Szukaj trasy
                        </a>
                    </div>
                </div>
            </div>

            {/* Wyszukiwanie (Live) */}
            <div className="relative z-20 -mt-10 rounded-xl border border-gray-100 bg-white p-4 shadow-md sm:-mt-16 sm:p-6">
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
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
                        className="flex h-[50px] items-center justify-center gap-2 rounded-lg bg-zubr-dark p-3 font-bold text-white transition hover:bg-green-800"
                        onClick={() => document.getElementById('rides').scrollIntoView({ behavior: 'smooth' })}
                    >
                        <Search size={20} /> Szukaj
                    </button>
                </div>
            </div>

            {/* Lista przejazdów */}
            <div id="rides" className="mt-2 sm:mt-4">
                <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="flex items-start gap-2 text-xl font-bold text-zubr-dark sm:items-center sm:text-2xl">
                        <Calendar className="text-zubr-gold" />
                        {search.from || search.to || search.date ? "Wyniki wyszukiwania" : "Dostępne nadchodzące przejazdy"}
                    </h2>
                    {(search.from || search.to || search.date) && (
                        <button
                            onClick={() => setSearch({from: "", to: "", date: ""})}
                            className="self-start text-sm font-bold text-red-500 hover:underline sm:self-auto"
                        >
                            Wyczyść filtry
                        </button>
                    )}
                </div>

                {loading && <p className="text-center py-10 text-gray-500">Ładowanie przejazdów...</p>}

                {!loading && filteredRides.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-14 text-center sm:py-20">
                        <Search size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">Brak przejazdów spełniających Twoje kryteria.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRides.map((ride) => (
                        <div key={ride.id}
                             className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition duration-300 hover:shadow-xl">
                            {/* ... (reszta kafelka pozostaje bez zmian) ... */}
                            <div className="border-b border-gray-100 bg-gray-50 p-4 sm:p-5">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-base font-bold text-gray-800 sm:text-lg">{ride.start_location?.city}</span>
                                    </div>
                                    <div className="ml-1 my-1 border-l-2 border-dashed border-gray-300 h-6"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="text-base font-bold text-gray-800 sm:text-lg">{ride.end_location?.city}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-5">
                                <div className="mb-4 flex items-start justify-between gap-3">
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
                                        <span className="block text-xl font-bold text-zubr-dark sm:text-2xl">{ride.cost_per_passenger} PLN</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="flex items-center gap-1"><Clock size={14} /> {ride.departure_time?.slice(0, 5)}</span>
                                    <span>Wolne miejsca: {ride.available_seats}</span>
                                </div>
                            </div>

                            <Link
                                to={`/ride/${ride.id}`}
                                className="flex items-center justify-center gap-2 bg-zubr-dark py-3 text-center font-bold text-white transition hover:bg-green-800"
                            >
                                Zobacz szczegóły
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Home;
