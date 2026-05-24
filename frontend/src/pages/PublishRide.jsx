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
    CheckCircle2,
    Route,
    LoaderCircle
} from "lucide-react";

function buildAddressQuery(prefix, formData) {
    const rawValue = formData[`${prefix}_address`].trim();
    if (!rawValue) {
        return "";
    }

    const normalized = rawValue.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();
    const commaParts = normalized.split(",").map(part => part.trim()).filter(Boolean);

    if (commaParts.length >= 2) {
        const baseParts = commaParts.filter(part => part.toLowerCase() !== "poland");
        return [...baseParts, "Poland"].join(", ");
    }

    const tokens = normalized.split(" ").filter(Boolean);
    const streetIndex = tokens.findIndex(token => /\d/.test(token));

    if (streetIndex > 0) {
        const city = tokens.slice(0, streetIndex).join(" ");
        const street = tokens.slice(streetIndex - 1).join(" ");
        return `${street}, ${city}, Poland`;
    }

    return `${normalized}, Poland`;
}

function hasSearchableInput(prefix, formData) {
    const query = formData[`${prefix}_address`].trim();
    if (query.length < 8) {
        return false;
    }

    const normalized = normalizeForMatch(query);
    const hasSeparator = normalized.includes(",");
    const hasStreetNumber = /\d/.test(normalized);

    return hasSeparator || hasStreetNumber;
}

function normalizeForMatch(value) {
    return (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function extractAddressParts(query) {
    const normalized = normalizeForMatch(query);
    const withoutCountry = normalized.replace(/\bpoland\b/g, "").trim();
    const commaParts = withoutCountry.split(",").map(part => part.trim()).filter(Boolean);

    if (commaParts.length >= 2) {
        return {
            streetPart: commaParts[0],
            cityPart: commaParts[1],
        };
    }

    const tokens = withoutCountry.split(" ").filter(Boolean);
    const numberIndex = tokens.findIndex(token => /\d/.test(token));

    if (numberIndex > 0) {
        return {
            cityPart: tokens.slice(0, numberIndex - 1).join(" "),
            streetPart: tokens.slice(numberIndex - 1).join(" "),
        };
    }

    return {
        streetPart: withoutCountry,
        cityPart: "",
    };
}

function scoreSuggestion(query, suggestion) {
    const { streetPart, cityPart } = extractAddressParts(query);
    const label = normalizeForMatch(suggestion.label);
    const city = normalizeForMatch(suggestion.locality || suggestion.city);
    const street = normalizeForMatch(suggestion.street);
    let score = 0;

    if (cityPart) {
        if (city === cityPart) {
            score += 120;
        } else if (label.includes(cityPart)) {
            score += 70;
        } else {
            score -= 80;
        }
    }

    if (streetPart) {
        if (street && street === streetPart) {
            score += 90;
        } else if (label.includes(streetPart)) {
            score += 50;
        }
    }

    if (label.includes("poland")) {
        score += 5;
    }

    return score;
}

function rankSuggestions(query, suggestions) {
    const ranked = suggestions
        .map(suggestion => ({ suggestion, score: scoreSuggestion(query, suggestion) }))
        .filter(item => item.score > -40)
        .sort((a, b) => b.score - a.score)
        .map(item => item.suggestion);

    return ranked;
}

function normalizeSuggestion(suggestion) {
    return {
        label: suggestion.label || "",
        city: suggestion.locality || suggestion.city || "",
        street: suggestion.street || "",
        postal_code: suggestion.postal_code || "",
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
    };
}

function PublishRide() {
    const navigate = useNavigate();
    const [cars, setCars] = useState([]);
    const [loadingCars, setLoadingCars] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState({ start: false, end: false });
    const [locationSuggestions, setLocationSuggestions] = useState({ start: [], end: [] });
    const [selectedAddresses, setSelectedAddresses] = useState({ start: null, end: null });
    const [previewRoute, setPreviewRoute] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [formError, setFormError] = useState("");
    const [suggestionError, setSuggestionError] = useState({ start: "", end: "" });
    const [previewError, setPreviewError] = useState("");
    const latestSuggestionRequest = useRef({ start: 0, end: 0 });

    const [formData, setFormData] = useState({
        start_address: "",
        end_address: "",
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
                } else {
                    navigate("/my-rides");
                }
            })
            .catch(err => console.error("Błąd pobierania aut: ", err))
            .finally(() => setLoadingCars(false));
    }, [navigate]);

    useEffect(() => {
        const fetchRoutePreview = async () => {
            if (!selectedAddresses.start || !selectedAddresses.end) {
                setPreviewRoute(null);
                setPreviewError("");
                return;
            }

            setLoadingPreview(true);
            setPreviewError("");
            try {
                const res = await api.post("/api/maps/route/", {
                    start: {
                        latitude: Number(selectedAddresses.start.latitude),
                        longitude: Number(selectedAddresses.start.longitude),
                    },
                    end: {
                        latitude: Number(selectedAddresses.end.latitude),
                        longitude: Number(selectedAddresses.end.longitude),
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
    }, [selectedAddresses]);

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

            if (selectedAddresses[prefix]) {
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

                    const results = rankSuggestions(query, res.data.results || []);
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
            }, 600);

            return () => clearTimeout(timeoutId);
        };

        const cleanupStart = scheduleSuggestions("start");
        const cleanupEnd = scheduleSuggestions("end");

        return () => {
            cleanupStart?.();
            cleanupEnd?.();
        };
    }, [
        formData.start_address,
        formData.end_address,
        selectedAddresses,
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const prefix = name.startsWith("start_") ? "start" : name.startsWith("end_") ? "end" : null;
        const hadSelectedAddress = prefix ? Boolean(selectedAddresses[prefix]) : false;

        setFormData(prev => ({ ...prev, [name]: value }));

        if (prefix) {
            setSelectedAddresses(prev => ({ ...prev, [prefix]: null }));
            setLocationSuggestions(prev => ({ ...prev, [prefix]: [] }));
            setSuggestionError(prev => ({
                ...prev,
                [prefix]: hadSelectedAddress ? "Adres został zmieniony. Wybierz go ponownie z sugestii." : "",
            }));
        }
    };

    const selectSuggestion = (prefix, suggestion) => {
        const normalized = normalizeSuggestion(suggestion);
        latestSuggestionRequest.current[prefix] += 1;
        setSelectedAddresses(prev => ({ ...prev, [prefix]: normalized }));
        setLocationSuggestions(prev => ({ ...prev, [prefix]: [] }));
        setSuggestionError(prev => ({ ...prev, [prefix]: "" }));
        setLoadingSuggestions(prev => ({ ...prev, [prefix]: false }));
        setFormData(prev => ({
            ...prev,
            [`${prefix}_address`]: normalized.label || prev[`${prefix}_address`],
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

        if (!selectedAddresses.start || !selectedAddresses.end) {
            setFormError("Wybierz z sugestii potwierdzony adres startowy i docelowy.");
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
                name: selectedAddresses.start.label,
                city: selectedAddresses.start.city,
                street: selectedAddresses.start.street,
                st_number: "",
                postal_code: selectedAddresses.start.postal_code,
                latitude: selectedAddresses.start.latitude,
                longitude: selectedAddresses.start.longitude,
            },
            end_location: {
                name: selectedAddresses.end.label,
                city: selectedAddresses.end.city,
                street: selectedAddresses.end.street,
                st_number: "",
                postal_code: selectedAddresses.end.postal_code,
                latitude: selectedAddresses.end.latitude,
                longitude: selectedAddresses.end.longitude,
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
        return <div className="text-center mt-10 text-gray-500">Przekierowanie do Twoich przejazdów...</div>;
    }

    const canSubmitRide = Boolean(selectedAddresses.start && selectedAddresses.end && formData.car_id);
    const showStartStatus = loadingSuggestions.start || selectedAddresses.start;
    const showEndStatus = loadingSuggestions.end || selectedAddresses.end;

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <div className="mb-8">
                <button
                    type="button"
                    onClick={() => navigate("/my-rides")}
                    className="mb-4 text-sm font-bold text-zubr-dark hover:underline"
                >
                    Wroc do moich przejazdow
                </button>
                <h1 className="text-3xl font-bold text-zubr-dark mb-2">Dodaj nowy przejazd</h1>
                <p className="text-gray-600">Wpisz adresy w formacie ulica i numer, potem miasto, a następnie wybierz właściwe sugestie.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 min-w-0">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                            <h3 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                                <MapPin size={16} className="text-zubr-gold" /> Miejsce startu
                            </h3>
                            <input
                                name="start_address"
                                placeholder="Np. Wiejska 45, Bialystok"
                                value={formData.start_address}
                                required
                                onChange={handleChange}
                                className="w-full p-3 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                            />
                            <p className="mt-3 text-sm text-gray-500">Preferowany format: ulica i numer, potem miasto.</p>
                            {showStartStatus && (
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    {loadingSuggestions.start && (
                                        <span className="text-sm text-gray-500 flex items-center gap-2">
                                            <LoaderCircle size={16} className="animate-spin" />
                                            Szukam adresu startowego...
                                        </span>
                                    )}
                                    {selectedAddresses.start && (
                                        <span className="text-sm text-green-700 flex items-center gap-1">
                                            <CheckCircle2 size={16} />
                                            Wybrano konkretny adres startowy
                                        </span>
                                    )}
                                </div>
                            )}
                            {suggestionError.start && (
                                <p className="mt-3 text-sm text-red-600">{suggestionError.start}</p>
                            )}
                            {formData.start_address && !selectedAddresses.start && !suggestionError.start && (
                                <p className="mt-3 text-sm text-amber-600">Wybierz adres startowy z listy sugestii.</p>
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
                            <input
                                name="end_address"
                                placeholder="Np. Lipowa 12, Choroszcz"
                                value={formData.end_address}
                                required
                                onChange={handleChange}
                                className="w-full p-3 border rounded focus:ring-2 focus:ring-zubr-gold outline-none text-sm"
                            />
                            <p className="mt-3 text-sm text-gray-500">Preferowany format: ulica i numer, potem miasto.</p>
                            {showEndStatus && (
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    {loadingSuggestions.end && (
                                        <span className="text-sm text-gray-500 flex items-center gap-2">
                                            <LoaderCircle size={16} className="animate-spin" />
                                            Szukam adresu docelowego...
                                        </span>
                                    )}
                                    {selectedAddresses.end && (
                                        <span className="text-sm text-green-700 flex items-center gap-1">
                                            <CheckCircle2 size={16} />
                                            Wybrano konkretny adres docelowy
                                        </span>
                                    )}
                                </div>
                            )}
                            {suggestionError.end && (
                                <p className="mt-3 text-sm text-red-600">{suggestionError.end}</p>
                            )}
                            {formData.end_address && !selectedAddresses.end && !suggestionError.end && (
                                <p className="mt-3 text-sm text-amber-600">Wybierz adres docelowy z listy sugestii.</p>
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
                            disabled={submitting || !canSubmitRide}
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
                                start={selectedAddresses.start}
                                end={selectedAddresses.end}
                                geometry={previewRoute?.geometry}
                                heightClassName="h-64"
                            />
                        </div>

                        <div className="text-sm text-gray-600 space-y-2">
                            <div>
                                <span className="font-medium text-gray-800">Start:</span>{" "}
                                {selectedAddresses.start?.label || "Wybierz adres startowy z sugestii"}
                            </div>
                            <div>
                                <span className="font-medium text-gray-800">Koniec:</span>{" "}
                                {selectedAddresses.end?.label || "Wybierz adres docelowy z sugestii"}
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
