import React from "react";
import { Link } from "react-router-dom";

// DANE TESTOWE (MOCK DATA)
const DUMMIES = [
    {
        id: 1,
        driver: "Janusz",
        from: "Białystok",
        to: "Choroszcz",
        date: "2026-12-12 08:00",
        price: "15 PLN",
        seats: 2,
        car: "Volkswagen Passat"
    },
    {
        id: 2,
        driver: "Karol",
        from: "Choroszcz",
        to: "Biedronka",
        date: "2026-01-02 12:30",
        price: "50 PLN",
        seats: 0,
        car: "Passeratti"
    }
];

function Home() {
    return (
        <div className="flex flex-col gap-8">

            <div className="bg-zubr-dark rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-green-700 rounded-full opacity-50 blur-3xl"></div>

                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Podróżuj po Choroszczy <br/>
                        <span className="text-zubr-gold">taniej i wygodniej</span>
                    </h1>
                    <p className="text-green-100 text-lg mb-8 opacity-90">
                        Znajdź wolne miejsce w samochodzie lub zabierz pasażerów.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/publish-ride"
                              className="bg-zubr-gold text-zubr-dark px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition shadow-lg">
                            Dodaj przejazd
                        </Link>
                        <a href="#rides"
                           className="border border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white hover:text-zubr-dark transition">
                            Szukaj trasy
                        </a>
                    </div>
                </div>
            </div>

            {/* Wyszukiwanie (wizualne) */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 -mt-16 mx-4 md:mx-0 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skąd?</label>
                        <input type="text" placeholder="Np. Białystok"
                               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zubr-dark focus:outline-none"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dokąd?</label>
                        <input type="text" placeholder="Np. Warszawa"
                               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zubr-dark focus:outline-none"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kiedy?</label>
                        <input type="date"
                               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zubr-dark focus:outline-none"/>
                    </div>
                    <button
                        className="bg-zubr-dark text-white p-3 rounded-lg font-bold hover:bg-green-800 transition h-[50px] flex items-center justify-center">
                        🔍 Szukaj
                    </button>
                </div>
            </div>

            {/* Lista przejazdów */}
            <div id="rides" className="mt-4">
                <h2 className="text-2xl font-bold text-zubr-dark mb-6 flex items-center gap-2">
                    Dostępne przejazdy
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {DUMMIES.map((ride) => (
                        <div key={ride.id}
                             className="bg-white rounded-xl shadow-md hover:shadow-xl transition duration-300 border border-gray-100 overflow-hidden group">

                            <div className="p-5 border-b border-gray-100 bg-gray-50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Start</span>
                                        <span className="font-bold text-gray-800 text-lg">{ride.from}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 my-2 opacity-60">
                                    <div className="h-8 w-0.5 bg-gray-300 mx-1"></div>
                                    <span className="text-sm">⬇️ Czas podróży: ok. 2h</span>
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cel</span>
                                    <span className="font-bold text-gray-800 text-lg">{ride.to}</span>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zubr-light flex items-center justify-center text-zubr-dark font-bold">
                                            {ride.driver[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{ride.driver}</p>
                                            <p className="text-xs text-gray-500">⭐ 4.8 / 5</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-bold text-zubr-dark">{ride.price}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
                                    <span>{ride.date}</span>
                                    <span>Wolne: {ride.seats}</span>
                                </div>
                            </div>

                            {/* ZMIANA: Link zamiast div */}
                            <Link 
                                to={`/ride/${ride.id}`}
                                className="block bg-zubr-dark text-white text-center py-3 font-bold cursor-pointer hover:bg-green-800 transition"
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