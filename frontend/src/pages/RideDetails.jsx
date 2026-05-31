import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../api";
import RideMap from "../components/RideMap";

function RideDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [routeData, setRouteData] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeError, setRouteError] = useState("");

    useEffect(() => {
        const fetchRide = async () => {
            try {
                const res = await api.get(`/api/rides/${id}/`);
                setRide(res.data);
            } catch {
                setRide({
                    id,
                    driver: { id: 1, first_name: "Janusz", last_name: "Tracz", username: "tracz_janusz", rating: 4.8 },
                    car: { brand: "Volkswagen", model: "Passat", license_plate: "BI 12345", seats: 4 },
                    start_location: {
                        city: "Białystok",
                        street: "Lipowa",
                        st_number: "14",
                        latitude: 53.1325,
                        longitude: 23.1688,
                    },
                    end_location: {
                        city: "Choroszcz",
                        street: "Powstania Styczniowego",
                        st_number: "1",
                        latitude: 53.1432,
                        longitude: 22.9887,
                    },
                    departure_date: "2026-12-12",
                    departure_time: "08:00:00",
                    cost_per_passenger: "15.00",
                    available_seats: 3,
                    description: "Jadę spokojnie, nie palę w aucie. Zapraszam!",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchRide();
    }, [id]);

    useEffect(() => {
        const fetchRoute = async () => {
            if (!ride?.start_location?.latitude || !ride?.end_location?.latitude) {
                setRouteData(null);
                return;
            }

            setRouteLoading(true);
            setRouteError("");
            try {
                const res = await api.post("/api/maps/route/", {
                    start: {
                        latitude: Number(ride.start_location.latitude),
                        longitude: Number(ride.start_location.longitude),
                    },
                    end: {
                        latitude: Number(ride.end_location.latitude),
                        longitude: Number(ride.end_location.longitude),
                    },
                });
                setRouteData(res.data);
            } catch (error) {
                setRouteData(null);
                setRouteError(error.response?.data?.detail || "Nie udało się wyznaczyć trasy dla tego przejazdu.");
            } finally {
                setRouteLoading(false);
            }
        };

        fetchRoute();
    }, [ride]);

    if (loading) return <div className="text-center mt-10">Ładowanie szczegółów przejazdu...</div>;
    if (!ride) return <div className="text-center mt-10">Nie znaleziono przejazdu.</div>;

    return (
        <div className="w-full pb-12">
            <div className="mb-6 rounded-xl border-l-8 border-zubr-gold bg-white p-5 shadow-lg sm:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-zubr-dark sm:gap-3">
                            <span className="text-xl font-bold sm:text-2xl">{ride.start_location.city}</span>
                            <span className="text-xl sm:text-2xl">➝</span>
                            <span className="text-xl font-bold sm:text-2xl">{ride.end_location.city}</span>
                        </div>
                        <p className="text-sm text-gray-500 sm:text-base">
                            {ride.departure_date} o godz. {ride.departure_time.slice(0, 5)}
                        </p>
                    </div>
                    <div className="text-left md:text-right">
                        <span className="block text-2xl font-bold text-zubr-dark sm:text-3xl">
                            {ride.cost_per_passenger} PLN
                        </span>
                        <span className="text-sm text-gray-500">za osobę</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-6 md:col-span-2">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <RideMap
                            start={ride.start_location}
                            end={ride.end_location}
                            geometry={routeData?.geometry}
                            heightClassName="h-64 sm:h-72"
                        />
                        <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div className="text-gray-500">
                                {routeLoading
                                    ? "Wyznaczanie trasy..."
                                    : routeError
                                        ? routeError
                                    : routeData?.distance_m
                                        ? `Dystans: ${(routeData.distance_m / 1000).toFixed(1)} km`
                                        : "Mapa pokazuje punkty startu i końca przejazdu."}
                            </div>
                            <div className="font-medium text-gray-600">
                                {routeData?.duration_s
                                    ? `Szacowany czas: ${Math.round(routeData.duration_s / 60)} min`
                                    : ""}
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-md sm:p-6">
                        <div className="absolute bottom-5 left-5 top-5 w-0.5 bg-gray-200 sm:bottom-6 sm:left-6 sm:top-6"></div>

                        <div className="relative mb-8 pl-8">
                            <div className="absolute left-0 top-1 w-3 h-3 bg-green-600 rounded-full ring-4 ring-white"></div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase">Start</h3>
                            <p className="text-base font-bold text-gray-800 sm:text-lg">
                                ul. {ride.start_location.street} {ride.start_location.st_number}
                            </p>
                            <p className="text-gray-600">{ride.start_location.city}</p>
                        </div>

                        <div className="relative pl-8">
                            <div className="absolute left-0 top-1 w-3 h-3 bg-red-500 rounded-full ring-4 ring-white"></div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase">Koniec</h3>
                            <p className="text-base font-bold text-gray-800 sm:text-lg">
                                ul. {ride.end_location.street} {ride.end_location.st_number}
                            </p>
                            <p className="text-gray-600">{ride.end_location.city}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-md sm:p-6 md:flex-row md:items-center md:justify-between">
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
                        <div className="text-left md:text-right">
                            <p className="text-gray-500 text-sm">Samochód</p>
                            <p className="font-bold">{ride.car.brand} {ride.car.model}</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-1">
                    <div className="rounded-xl bg-white p-5 shadow-md sm:p-6 md:sticky md:top-24">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Podsumowanie</h3>

                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                            <span className="text-gray-600">Dostępne miejsca</span>
                            <span className="font-bold text-green-600">{ride.available_seats}</span>
                        </div>

                        {ride.available_seats > 0 ? (
                            <button
                                className="w-full rounded-lg bg-zubr-gold py-3 text-lg font-bold text-zubr-dark shadow-md transition hover:bg-yellow-400"
                                onClick={async () => {
                                    try {
                                        await api.post(`/api/rides/${ride.id}/book/`);
                                        alert("Udało się! Zarezerwowałeś przejazd.");
                                        navigate("/my-rides");
                                    } catch (err) {
                                        const errorMsg = err.response?.data?.error || "Wystąpił błąd podczas rezerwacji.";
                                        alert(errorMsg);
                                    }
                                }}
                            >
                                Zarezerwuj miejsce
                            </button>
                        ) : (
                            <button disabled className="w-full cursor-not-allowed rounded-lg bg-gray-300 py-3 text-lg font-bold text-gray-600">
                                Brak wolnych miejsc
                            </button>
                        )}
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
