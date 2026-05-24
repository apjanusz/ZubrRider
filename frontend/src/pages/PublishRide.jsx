import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import RideMap from "../components/RideMap";
import {
    MapPin,
    Flag,
    Calendar,
    CircleDollarSign,
    Users,
    Car,
    Plus,
    AlertCircle,
    CheckCircle2,
    Route,
    LoaderCircle
} from "lucide-react";

function buildAddressQuery(prefix, formData) {
    const parts = [
        [formData[`${prefix}_street`], formData[`${prefix}_st_number`]].filter(Boolean).join(" "),
        formData[`${prefix}_city`],
        formData[`${prefix}_postal_code`],
        "Poland",
    ];

    return parts.filter(Boolean).join(", ");
}

function hasSearchableInput(prefix, formData) {
    const city = formData[`${prefix}_city`].trim();
    const street = formData[`${prefix}_street`].trim();
    const postalCode = formData[`${prefix}_postal_code`].trim();

    return city.length >= 2 || street.length >= 2 || postalCode.length >= 3;
}

function PublishRide() {
    const navigate = useNavigate();
    const [cars, setCars] = useState([]);
    const [loadingCars, setLoadingCars] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState({ start: false, end: false });
    const [locationSuggestions, setLocationSuggestions] = useState({ start: [], end: [] });
    const [selectedLocations, setSelectedLocations] = useState({ start: null, end: null });
    const [previewRoute, setPreviewRoute] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [formError, setFormError] = useState("");
    const [suggestionError, setSuggestionError] = useState({ start: "", end: "" });
    const [previewError, setPreviewError] = useState("");
    const latestSuggestionRequest = useRef({ start: 0, end: 0 });

    const [formData, setFormData] = useState({
        start_city: "",
        start_street: "",
        start_st_number: "",
        start_postal_code: "",
        end_city: "",
        end_street: "",
        end_st_number: "",
        end_postal_code: "",
        date: "",
        time: "",
        price: "",
        seats: 3,
        car_id: ""
    });

    useEffect(() => {
        api.get("/api/accounts/my-cars/")
            .then(res => {
                setCars(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, car_id: res.data[0].id }));
                }
            })
            .catch(err => console.error("Błąd pobierania aut: ", err))
            .finally(() => setLoadingCars(false));
    }, []);

    useEffect(() => {
        const fetchRoutePreview = async () => {
            if (!selectedLocations.start || !selectedLocations.end) {
                setPreviewRoute(null);
                setPreviewError("");
                return;
            }

            setLoadingPreview(true);
            setPreviewError("");
            try {
                const res = await api.post("/api/maps/route/", {
                    start: {
                        latitude: Number(selectedLocations.start.latitude),
                        longitude: Number(selectedLocations.start.longitude),
                    },
                    end: {
                        latitude: Number(selectedLocations.end.latitude),
                        longitude: Number(selectedLocations.end.longitude),
                    },
                });
                setPreviewRoute(res.data);
            } catch (error) {
                setPreviewRoute(null);
                setPreviewError(error.response?.data?.detail || "Nie udało się pobrać podglądu trasy.");
            } finally {
                setLoadingPreview(false);
            }
        };

        fetchRoutePreview();
    }, [selectedLocations]);

    useEffect(() => {
        const scheduleSuggestions = (prefix) => {
            const hasInput = hasSearchableInput(prefix, formData);

            if (!hasInput) {
                latestSuggestionRequest.current[prefix] += 1;
                setLoadingSuggestions(prev => ({ ...prev, [prefix]: false }));
                setLocationSuggestions(prev => ({ ...prev, [prefix]: [] }));
                setSuggestionError(prev => ({ ...prev, [prefix]: "" }));
                return undefined;
            }

            if (selectedLocations[prefix]) {
                setLoadingSuggestions(prev => ({ ...prev, [prefix]: false }));
                setLocationSuggestions(prev => ({ ...prev, [prefix]: [] }));
                setSuggestionError(prev => ({ ...prev, [prefix]: "" }));
                return undefined;
            }

            const query = buildAddressQuery(prefix, formData).trim();
            if (query.length < 4) {
                setLoadingSuggestions(prev => ({ ...prev, [prefix]: false }));
                setLocationSuggestions(prev => ({ ...prev, [prefix]: [] }));
                setSuggestionError(prev => ({ ...prev, [prefix]: "" }));
                return undefined;
            }

            const timeoutId = setTimeout(async () => {
                const requestId = latestSuggestionRequest.current[prefix] + 1;
                latestSuggestionRequest.current[prefix] = requestId;
                setLoadingSuggestions(prev => ({ ...prev, [prefix]: true }));

                try {
                    const res = await api.get("/api/maps/geocode/", {
                        params: { query, size: 5 },
                    });

                    if (latestSuggestionRequest.current[prefix] !== requestId) {
                        return;
                    }

                    const results = res.data.results || [];
                    setLocationSuggestions(prev => ({ ...prev, [prefix]: results }));
                    setSuggestionError(prev => ({
                        ...prev,
                        [prefix]: results.length ? "" : "Brak trafień dla podanego adresu.",
                    }));
                } catch (error) {
                    if (latestSuggestionRequest.current[prefix] !== requestId) {
                        return;
                    }

                    setLocationSuggestions(prev => ({ ...prev, [prefix]: [] }));
                    setSuggestionError(prev => ({
                        ...prev,
                        [prefix]: error.response?.data?.detail || "Nie udało się pobrać sugestii adresu.",
                    }));
                } finally {
                    if (latestSuggestionRequest.current[prefix] === requestId) {
                        setLoadingSuggestions(prev => ({ ...prev, [prefix]: false }));
                    }
                }
            }, 400);

            return () => clearTimeout(timeoutId);
        };

        const cleanupStart = scheduleSuggestions("start");
        const cleanupEnd = scheduleSuggestions("end");

        return () => {
            cleanupStart?.();
            cleanupEnd?.();
        };
    }, [
        formData.start_city,
        formData.start_street,
        formData.start_st_number,
        formData.start_postal_code,
        formData.end_city,
        formData.end_street,
        formData.end_st_number,
        formData.end_postal_code,
        selectedLocations,
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const prefix = name.startsWith("start_") ? "start" : name.startsWith("end_") ? "end" : null;

        setFormData(prev => ({ ...prev, [name]: value }));

        if (prefix) {
            setSelectedLocations(prev => ({ ...prev, [prefix]: null }));
            setLocationSuggestions(prev => ({ ...prev, [prefix]: [] }));
            setSuggestionError(prev => ({ ...prev, [prefix]: "" }));
        }
    };

    const selectSuggestion = (prefix, suggestion) => {
        latestSuggestionRequest.current[prefix] += 1;
        setSelectedLocations(prev => ({ ...prev, [prefix]: suggestion }));
        setLocationSuggestions(prev => ({ ...prev, [prefix]: [] }));
        setSuggestionError(prev => ({ ...prev, [prefix]: "" }));
        setLoadingSuggestions(prev => ({ ...prev, [prefix]: false }));
        setFormData(prev => ({
            ...prev,
            [`${prefix}_city`]: suggestion.locality || prev[`${prefix}_city`],
            [`${prefix}_street`]: suggestion.street || prev[`${prefix}_street`],
            [`${prefix}_postal_code`]: suggestion.postal_code || prev[`${prefix}_postal_code`],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError("");

        if (!formData.car_id) {
            setFormError("Wybierz pojazd, którym chcesz zrealizować przejazd.");
            setSubmitting(false);
            return;
        }

        const payload = {
            car_id: formData.car_id,
            departure_date: formData.date,
            departure_time: formData.time,
            cost_per_passenger: formData.price,
            available_seats: formData.seats,
            start_location: {
                name: "Start",
                city: formData.start_city,
                street: formData.start_street,
                st_number: formData.start_st_number,
                postal_code: formData.start_postal_code,
                latitude: selectedLocations.start?.latitude,
                longitude: selectedLocations.start?.longitude,
            },
            end_location: {
                name: "Koniec",
                city: formData.end_city,
                street: formData.end_street,
                st_number: formData.end_st_number,
                postal_code: formData.end_postal_code,
                latitude: selectedLocations.end?.latitude,
                longitude: selectedLocations.end?.longitude,
            }
        };

        try {
            await api.post("/api/rides/create/", payload);
            alert("Przejazd dodany pomyślnie!");
            navigate("/my-rides");
        } catch (error) {
            console.error(error);
            const detail =
                error.response?.data?.location ||
                error.response?.data?.car_id ||
                error.response?.data?.available_seats ||
                error.response?.data?.detail ||
                "Wystąpił błąd przy dodawaniu przejazdu. Sprawdź poprawność danych.";
            setFormError(Array.isArray(detail) ? detail.join(" ") : detail);
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingCars) {
        return <div className="text-center mt-10 text-gray-500">Ładowanie Twoich pojazdów...</div>;
    }

    if (cars.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow p-8 max-w-lg mx-auto border-t-4 border-red-500">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h2 className="text-xl font-bold mb-4 text-gray-800">Nie masz dodanego samochodu!</h2>
                <p className="text-gray-600 mb-6">
                    Aby opublikować przejazd, najpierw dodaj pojazd w swoim profilu.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="inline-flex items-center gap-2 rounded-lg bg-zubr-dark px-5 py-3 font-semibold text-white transition hover:bg-zubr-gold"
                >
                    <Car size={18} />
                    Przejdź do profilu
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zubr-dark mb-2">Dodaj nowy przejazd</h1>
                <p className="text-gray-600">Wypełnij dane przejazdu, wybierz adresy i sprawdź trasę na mapie.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 min-w-0">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                        <MapPin size={16} className="text-zubr-gold" /> Miejsce startu
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-4 md:col-span-2">
                            <input
                                name="start_city"
                                placeholder="Miasto"
                                value={formData.start_city}
                                required
                                onChange={handleChange}
                                className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                            />
                        </div>
                        <div className="col-span-3 md:col-span-1">
                            <input
                                name="start_street"
                                placeholder="Ulica"
                                value={formData.start_street}
                                onChange={handleChange}
                                className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                            />
                        </div>
                        <div className="col-span-1">
                            <input
                                name="start_st_number"
                                placeholder="Nr"
                                value={formData.start_st_number}
                                onChange={handleChange}
                                className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                            />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                            <input
                                name="start_postal_code"
                                placeholder="Kod pocztowy"
                                value={formData.start_postal_code}
                                onChange={handleChange}
                                className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 min-h-6">
                        {loadingSuggestions.start && (
                            <span className="text-sm text-gray-500 flex items-center gap-2">
                                <LoaderCircle size={16} className="animate-spin" />
                                Szukam adresu startowego...
                            </span>
                        )}
                        {selectedLocations.start && (
                            <span className="text-sm text-green-700 flex items-center gap-1">
                                <CheckCircle2 size={16} />
                                Wybrano konkretny adres startowy
                            </span>
                        )}
                    </div>
                    {suggestionError.start && (
                        <p className="mt-3 text-sm text-red-600">{suggestionError.start}</p>
                    )}
                    {locationSuggestions.start.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {locationSuggestions.start.map((suggestion, index) => (
                                <button
                                    key={`${suggestion.label}-${index}`}
                                    type="button"
                                    onClick={() => selectSuggestion("start", suggestion)}
                                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-zubr-gold transition"
                                >
                                    <div className="font-semibold text-gray-800">{suggestion.label}</div>
                                    <div className="text-xs text-gray-500">
                                        {suggestion.latitude}, {suggestion.longitude}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                        </div>

                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Flag size={16} className="text-zubr-gold" /> Miejsce docelowe
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-4 md:col-span-2">
                            <input
                                name="end_city"
                                placeholder="Miasto"
                                value={formData.end_city}
                                required
                                onChange={handleChange}
                                className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                            />
                        </div>
                        <div className="col-span-3 md:col-span-1">
                            <input
                                name="end_street"
                                placeholder="Ulica"
                                value={formData.end_street}
                                onChange={handleChange}
                                className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                            />
                        </div>
                        <div className="col-span-1">
                            <input
                                name="end_st_number"
                                placeholder="Nr"
                                value={formData.end_st_number}
                                onChange={handleChange}
                                className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                            />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                            <input
                                name="end_postal_code"
                                placeholder="Kod pocztowy"
                                value={formData.end_postal_code}
                                onChange={handleChange}
                                className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 min-h-6">
                        {loadingSuggestions.end && (
                            <span className="text-sm text-gray-500 flex items-center gap-2">
                                <LoaderCircle size={16} className="animate-spin" />
                                Szukam adresu docelowego...
                            </span>
                        )}
                        {selectedLocations.end && (
                            <span className="text-sm text-green-700 flex items-center gap-1">
                                <CheckCircle2 size={16} />
                                Wybrano konkretny adres docelowy
                            </span>
                        )}
                    </div>
                    {suggestionError.end && (
                        <p className="mt-3 text-sm text-red-600">{suggestionError.end}</p>
                    )}
                    {locationSuggestions.end.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {locationSuggestions.end.map((suggestion, index) => (
                                <button
                                    key={`${suggestion.label}-${index}`}
                                    type="button"
                                    onClick={() => selectSuggestion("end", suggestion)}
                                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-zubr-gold transition"
                                >
                                    <div className="font-semibold text-gray-800">{suggestion.label}</div>
                                    <div className="text-xs text-gray-500">
                                        {suggestion.latitude}, {suggestion.longitude}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-1">
                            <Calendar size={14} /> Data wyjazdu
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            required
                            onChange={handleChange}
                            className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm bg-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                            Godzina
                        </label>
                        <input
                            type="time"
                            name="time"
                            value={formData.time}
                            required
                            onChange={handleChange}
                            className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm bg-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-1">
                            <CircleDollarSign size={14} /> Cena (PLN)
                        </label>
                        <input
                            type="number"
                            name="price"
                            placeholder="0.00"
                            value={formData.price}
                            min="0"
                            step="0.01"
                            required
                            onChange={handleChange}
                            className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-1">
                            <Users size={14} /> Liczba miejsc
                        </label>
                        <input
                            type="number"
                            name="seats"
                            value={formData.seats}
                            min="1"
                            max="8"
                            required
                            onChange={handleChange}
                            className="w-full p-2.5 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                        />
                    </div>
                        </div>

                        <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Car size={14} /> Wybierz pojazd
                    </label>
                    <select
                        name="car_id"
                        value={formData.car_id}
                        required
                        className="w-full p-3 border rounded bg-white focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                        onChange={handleChange}
                    >
                        <option value="" disabled>Wybierz pojazd</option>
                        {cars.map(car => (
                            <option key={car.id} value={car.id}>
                                {car.brand} {car.model} ({car.license_plate})
                            </option>
                        ))}
                    </select>
                        </div>

                        {formError && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-md">
                                {formError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-zubr-dark text-white py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                        >
                            {submitting ? "Trwa publikowanie..." : (
                                <>
                                    <Plus size={22} /> Opublikuj przejazd
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-1 min-w-0">
                    <div className="bg-white rounded-xl shadow-md p-5 sticky top-24 space-y-4 border border-gray-100">
                        <div>
                            <h2 className="text-lg font-semibold text-zubr-dark flex items-center gap-2 mb-3">
                                <Route className="text-zubr-gold" size={20} />
                                Podgląd trasy
                            </h2>
                            <RideMap
                                start={selectedLocations.start}
                                end={selectedLocations.end}
                                geometry={previewRoute?.geometry}
                                heightClassName="h-64"
                            />
                        </div>

                        <div className="text-sm text-gray-600 space-y-2">
                            <div>
                                <span className="font-medium text-gray-800">Start:</span>{" "}
                                {selectedLocations.start?.label || "Wybierz adres startowy z sugestii"}
                            </div>
                            <div>
                                <span className="font-medium text-gray-800">Koniec:</span>{" "}
                                {selectedLocations.end?.label || "Wybierz adres docelowy z sugestii"}
                            </div>
                        </div>

                        {loadingPreview ? (
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                <LoaderCircle size={16} className="animate-spin" />
                                Wyznaczanie trasy...
                            </div>
                        ) : previewRoute ? (
                            <div className="bg-zubr-cream rounded-lg p-4 text-sm text-gray-700 space-y-1">
                                <div>
                                    <span className="font-semibold">Dystans:</span>{" "}
                                    {(previewRoute.distance_m / 1000).toFixed(1)} km
                                </div>
                                <div>
                                    <span className="font-semibold">Szacowany czas:</span>{" "}
                                    {Math.round(previewRoute.duration_s / 60)} min
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">
                                Wybierz sugestie adresów dla startu i końca, aby zobaczyć trasę.
                            </div>
                        )}

                        {previewError && (
                            <div className="text-sm text-red-600">{previewError}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PublishRide;
