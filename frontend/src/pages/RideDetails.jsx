import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";

function RideDetails() {
    const { id } = useParams();
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Funkcja do pobierania danych (na razie mockujemy, jeśli API zwróci błąd lub nie ma danych w bazie)
    useEffect(() => {
        const fetchRide = async () => {
            try {
                // Próba pobrania z API
                const res = await api.get(`/api/rides/${id}/`);
                setRide(res.data);
            } catch (error) {
                console.log("Błąd API, używam danych testowych dla demo", error);
                
                // MOCK DATA na wypadek braku backendu/danych
                // To pozwala Ci testować UI bez wypełnionej bazy danych
                setRide({
                    id: id,
                    driver: { id: 1, first_name: "Janusz", last_name: "Tracz", username: "tracz_janusz", rating: 4.8 },
                    car: { brand: "Volkswagen", model: "Passat", license_plate: "BI 12345", seats: 4 },
                    start_location: { city: "Białystok", street: "Lipowa", st_number: "14" },
                    end_location: { city: "Choroszcz", street: "Powstania Styczniowego", st_number: "1" },
                    departure_date: "2026-12-12",
                    departure_time: "08:00:00",
                    cost_per_passenger: "15.00",
                    available_seats: 3,
                    description: "Jadę spokojnie, nie palę w aucie. Zapraszam!"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchRide();
    }, [id]);

    if (loading) return <div className="text-center mt-10">Ładowanie szczegółów przejazdu...</div>;
    if (!ride) return <div className="text-center mt-10">Nie znaleziono przejazdu.</div>;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            
            {/* Nagłówek Trasy */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-l-8 border-zubr-gold">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <div className="flex items-center gap-3 text-zubr-dark mb-1">
                            <span className="font-bold text-2xl">{ride.start_location.city}</span>
                            <span className="text-2xl">➝</span>
                            <span className="font-bold text-2xl">{ride.end_location.city}</span>
                        </div>
                        <p className="text-gray-500">
                            {ride.departure_date} o godz. {ride.departure_time.slice(0, 5)}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                        <span className="block text-3xl font-bold text-zubr-dark">
                            {ride.cost_per_passenger} PLN
                        </span>
                        <span className="text-sm text-gray-500">za osobę</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Lewa kolumna: Szczegóły + Kierowca */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* Mapa (Placeholder) */}
                    <div className="bg-gray-200 rounded-xl h-64 flex items-center justify-center shadow-inner">
                        <span className="text-gray-500 font-semibold">📍 Mapa trasy (Google Maps / Leaflet)</span>
                    </div>

                    {/* Adresy */}
                    <div className="bg-white p-6 rounded-xl shadow-md relative overflow-hidden">
                        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200"></div>
                        
                        <div className="relative pl-8 mb-8">
                            <div className="absolute left-0 top-1 w-3 h-3 bg-green-600 rounded-full ring-4 ring-white"></div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase">Start</h3>
                            <p className="font-bold text-lg text-gray-800">
                                ul. {ride.start_location.street} {ride.start_location.st_number}
                            </p>
                            <p className="text-gray-600">{ride.start_location.city}</p>
                        </div>

                        <div className="relative pl-8">
                            <div className="absolute left-0 top-1 w-3 h-3 bg-red-500 rounded-full ring-4 ring-white"></div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase">Koniec</h3>
                            <p className="font-bold text-lg text-gray-800">
                                ul. {ride.end_location.street} {ride.end_location.st_number}
                            </p>
                            <p className="text-gray-600">{ride.end_location.city}</p>
                        </div>
                    </div>

                    {/* O Kierowcy */}
                    <div className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-zubr-dark rounded-full flex items-center justify-center text-white text-xl font-bold">
                                {ride.driver.first_name[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{ride.driver.first_name}</h3>
                                <Link to={`/driver/${ride.driver.id}`} className="text-sm text-zubr-dark hover:underline font-semibold">
                                    Zobacz profil kierowcy
                                </Link>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm">Samochód</p>
                            <p className="font-bold">{ride.car.brand} {ride.car.model}</p>
                        </div>
                    </div>
                </div>

                {/* Prawa kolumna: Rezerwacja */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-md sticky top-24">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Podsumowanie</h3>
                        
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                            <span className="text-gray-600">Dostępne miejsca</span>
                            <span className="font-bold text-green-600">{ride.available_seats}</span>
                        </div>

                        <button 
                            className="w-full bg-zubr-gold text-zubr-dark py-3 rounded-lg font-bold text-lg hover:bg-yellow-400 transition shadow-md"
                            onClick={() => alert("Funkcja rezerwacji w budowie!")}
                        >
                            Zarezerwuj miejsce
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-3">
                            Płatność gotówką u kierowcy lub przez portfel.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default RideDetails;