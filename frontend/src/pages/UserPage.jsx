import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

const Field = ({ label, name, value, type = "text", disabled = false, width = "w-full", isEditing, onChange, error }) => {
    if (isEditing) {
        return (
            <div className={`mb-2 ${width}`}>
                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</span>
                <input
                    type={type}
                    name={name}
                    value={value || ""}
                    onChange={onChange} // Używamy funkcji przekazanej z góry
                    disabled={disabled}
                    className={`w-full border rounded px-2 py-1 text-gray-700 focus:outline-none focus:border-zubr-gold ${error ? "border-red-400" : "border-gray-300"} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
        );
    }
    return (
        <div className={`mb-2 ${width}`}>
            <span className="block text-xs font-bold text-gray-400 uppercase">{label}</span>
            <span className="text-gray-700 block min-h-[24px]">{value || "-"}</span>
        </div>
    );
};

function UserPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [cars, setCars] = useState([]);
    const [carsLoading, setCarsLoading] = useState(true);
    const [profileErrors, setProfileErrors] = useState({});
    const [carForm, setCarForm] = useState({
        brand: "",
        model: "",
        license_plate: "",
        seats: 4,
    });
    const [carErrors, setCarErrors] = useState({});
    const [carError, setCarError] = useState("");
    const [carSubmitting, setCarSubmitting] = useState(false);
    const [carDeletingId, setCarDeletingId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await api.get("/api/accounts/me/");
                setUser(res.data);
                setFormData(res.data);
            } catch (error) {
                console.error(error);
                if (error.response && error.response.status === 401) {
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        const loadCars = async () => {
            try {
                const res = await api.get("/api/accounts/my-cars/");
                setCars(res.data);
            } catch (error) {
                console.error(error);
                setCarError("Nie udało się pobrać pojazdów.");
            } finally {
                setCarsLoading(false);
            }
        };

        loadProfile();
        loadCars();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileErrors(prev => ({ ...prev, [name]: "" }));
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCarFormChange = (e) => {
        const { name, value } = e.target;
        setCarErrors(prev => ({ ...prev, [name]: "" }));
        setCarForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        const nextErrors = {};
        const normalizedFirstName = (formData.first_name || "").trim();
        const normalizedLastName = (formData.last_name || "").trim();
        const normalizedPhone = (formData.phone || "").replace(/[\s()-]+/g, "");
        const normalizedCity = (formData.city || "").trim();
        const rawPostalCode = (formData.postal_code || "").replace(/\s+/g, "");
        const normalizedPostalCode = /^\d{5}$/.test(rawPostalCode)
            ? `${rawPostalCode.slice(0, 2)}-${rawPostalCode.slice(2)}`
            : rawPostalCode;
        const normalizedStreet = (formData.street || "").trim();
        const normalizedStreetNumber = (formData.st_number || "").trim();
        const normalizedApartmentNumber = (formData.apt_number || "").trim();
        const namePattern = /^[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż\s-]+$/;
        const cityPattern = /^[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż\s'-]+$/;
        const streetPattern = /^[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s.'-]+$/;
        const buildingPattern = /^[0-9A-Za-z/]+$/;

        if (normalizedFirstName.length < 2 || normalizedFirstName.length > 50) {
            nextErrors.first_name = "Imię musi mieć od 2 do 50 znaków.";
        } else if (!namePattern.test(normalizedFirstName)) {
            nextErrors.first_name = "Imię może zawierać tylko litery, spacje i myślniki.";
        }

        if (normalizedLastName.length < 2 || normalizedLastName.length > 80) {
            nextErrors.last_name = "Nazwisko musi mieć od 2 do 80 znaków.";
        } else if (!namePattern.test(normalizedLastName)) {
            nextErrors.last_name = "Nazwisko może zawierać tylko litery, spacje i myślniki.";
        }

        if (normalizedPhone) {
            const phonePattern = /^\+?\d{9,15}$/;
            if (!phonePattern.test(normalizedPhone)) {
                nextErrors.phone = "Podaj poprawny numer telefonu.";
            }
        }

        if (normalizedCity.length < 2 || normalizedCity.length > 100) {
            nextErrors.city = "Miasto musi mieć od 2 do 100 znaków.";
        } else if (!cityPattern.test(normalizedCity)) {
            nextErrors.city = "Miasto może zawierać tylko litery, spacje, apostrof i myślnik.";
        }

        if (normalizedPostalCode && !/^\d{2}-\d{3}$/.test(normalizedPostalCode)) {
            nextErrors.postal_code = "Kod pocztowy musi mieć format 00-000.";
        }

        if (normalizedStreet) {
            if (normalizedStreet.length < 2 || normalizedStreet.length > 150) {
                nextErrors.street = "Ulica musi mieć od 2 do 150 znaków.";
            } else if (!streetPattern.test(normalizedStreet)) {
                nextErrors.street = "Ulica zawiera niedozwolone znaki.";
            }
        }

        if (normalizedStreetNumber && (normalizedStreetNumber.length > 10 || !buildingPattern.test(normalizedStreetNumber))) {
            nextErrors.st_number = "Podaj poprawny numer domu.";
        }

        if (normalizedApartmentNumber && (normalizedApartmentNumber.length > 10 || !buildingPattern.test(normalizedApartmentNumber))) {
            nextErrors.apt_number = "Podaj poprawny numer lokalu.";
        }

        if (normalizedStreet && !normalizedStreetNumber) {
            nextErrors.st_number = "Podaj numer domu dla wskazanej ulicy.";
        }

        if (normalizedStreetNumber && !normalizedStreet) {
            nextErrors.street = "Podaj ulicę dla wskazanego numeru domu.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setProfileErrors(nextErrors);
            return;
        }

        try {
            const payload = {
                ...formData,
                first_name: normalizedFirstName,
                last_name: normalizedLastName,
                phone: normalizedPhone,
                city: normalizedCity,
                postal_code: normalizedPostalCode,
                street: normalizedStreet,
                st_number: normalizedStreetNumber,
                apt_number: normalizedApartmentNumber,
            };
            const res = await api.patch("/api/accounts/me/", payload);
            setUser(res.data);
            setFormData(res.data);
            setProfileErrors({});
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            const detail = error.response?.data;
            if (detail && typeof detail === "object") {
                const nextServerErrors = {};
                Object.entries(detail).forEach(([key, messages]) => {
                    nextServerErrors[key] = Array.isArray(messages) ? messages[0] : messages;
                });
                setProfileErrors(nextServerErrors);
                return;
            }
            alert("Błąd podczas zapisywania profilu.");
        }
    };

    const handleCancel = () => {
        setFormData(user);
        setProfileErrors({});
        setIsEditing(false);
    };

    const handleAddCar = async (e) => {
        e.preventDefault();
        setCarSubmitting(true);
        setCarError("");
        setCarErrors({});

        const normalizedPlate = carForm.license_plate.replace(/\s+/g, "").toUpperCase();
        const normalizedBrand = carForm.brand.trim();
        const normalizedModel = carForm.model.trim();
        const seats = Number(carForm.seats);
        const nextErrors = {};

        if (normalizedBrand.length < 2 || normalizedBrand.length > 50) {
            nextErrors.brand = "Marka musi mieć od 2 do 50 znaków.";
        } else if (!/^[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s-]+$/.test(normalizedBrand)) {
            nextErrors.brand = "Marka może zawierać tylko litery, cyfry, spacje i myślniki.";
        }

        if (normalizedModel.length < 1 || normalizedModel.length > 50) {
            nextErrors.model = "Model musi mieć od 1 do 50 znaków.";
        } else if (!/^[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż0-9\s-]+$/.test(normalizedModel)) {
            nextErrors.model = "Model może zawierać tylko litery, cyfry, spacje i myślniki.";
        }

        if (!/^[A-Z0-9]{4,8}$/.test(normalizedPlate)) {
            nextErrors.license_plate = "Numer rejestracyjny musi mieć od 4 do 8 znaków alfanumerycznych.";
        }

        if (!Number.isInteger(seats) || seats < 1 || seats > 8) {
            nextErrors.seats = "Liczba miejsc musi być w zakresie od 1 do 8.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setCarErrors(nextErrors);
            setCarSubmitting(false);
            return;
        }

        try {
            const payload = {
                brand: normalizedBrand,
                model: normalizedModel,
                license_plate: normalizedPlate,
                seats,
            };

            const res = await api.post("/api/accounts/my-cars/", payload);
            setCars(prev => [...prev, res.data]);
            setCarForm({
                brand: "",
                model: "",
                license_plate: "",
                seats: 4,
            });
        } catch (error) {
            console.error(error);
            const detail = error.response?.data;
            if (detail && typeof detail === "object") {
                const nextServerErrors = {};
                Object.entries(detail).forEach(([key, messages]) => {
                    nextServerErrors[key] = Array.isArray(messages) ? messages[0] : messages;
                });
                setCarErrors(nextServerErrors);
                const firstError = Object.values(nextServerErrors)[0];
                setCarError(typeof firstError === "string" ? firstError : "Nie udało się dodać pojazdu.");
            } else {
                setCarError("Nie udało się dodać pojazdu.");
            }
        } finally {
            setCarSubmitting(false);
        }
    };

    const handleDeleteCar = async (carId) => {
        setCarDeletingId(carId);
        setCarError("");

        try {
            await api.delete(`/api/accounts/my-cars/${carId}/`);
            setCars(prev => prev.filter(car => car.id !== carId));
        } catch (error) {
            console.error(error);
            setCarError("Nie udało się usunąć pojazdu.");
        } finally {
            setCarDeletingId(null);
        }
    };

    if (loading) {
        return <div className="text-center mt-10">Ładowanie profilu...</div>;
    }

    if (!user) {
        return <div className="text-center mt-10">Brak danych użytkownika.</div>;
    }

    const getInitials = () => {
        const first = user.first_name ? user.first_name[0] : "";
        const last = user.last_name ? user.last_name[0] : "";
        const login = user.username ? user.username[0] : "?";
        return (first + last).toUpperCase() || login.toUpperCase();
    };

    return (
        <div className="w-full pb-10">
            {/* Nagłówek profilu */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border-t-4 border-zubr-gold">
                <div className="bg-zubr-dark h-32 w-full relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center text-zubr-dark text-3xl font-bold uppercase shadow-md">
                            {getInitials()}
                        </div>
                    </div>
                </div>
                <div className="px-6 pb-8 pt-14 sm:px-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                                {user.first_name} {user.last_name}
                            </h1>
                            <p className="text-gray-500">@{user.username || "użytkownik"}</p>
                            <p className="mt-1 text-sm text-gray-400">
                                Dołączył: {new Date(user.date_joined).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[420px] lg:flex-shrink-0">
                            <div className="rounded-2xl border border-zubr-gold/30 bg-zubr-light px-4 py-3 shadow-sm">
                                <p className="text-2xl font-bold text-zubr-dark">
                                    {user.stats?.completed_driver_rides ?? 0}
                                </p>
                                <p className="text-sm font-semibold text-gray-600">Przejazdy jako kierowca</p>
                            </div>
                            <div className="rounded-2xl border border-zubr-gold/30 bg-zubr-light px-4 py-3 shadow-sm">
                                <p className="text-2xl font-bold text-zubr-dark">
                                    {user.stats?.completed_passenger_rides ?? 0}
                                </p>
                                <p className="text-sm font-semibold text-gray-600">Przejazdy jako pasażer</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Karta: Dane kontaktowe */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-zubr-dark mb-4 border-b border-gray-100 pb-2">
                        Dane kontaktowe
                    </h2>
                    <div className="space-y-3">
                        <Field
                            label="Imię" name="first_name" value={formData.first_name}
                            isEditing={isEditing} onChange={handleChange} error={profileErrors.first_name}
                        />
                        <Field
                            label="Nazwisko" name="last_name" value={formData.last_name}
                            isEditing={isEditing} onChange={handleChange} error={profileErrors.last_name}
                        />
                        <Field
                            label="Email" name="email" value={formData.email} disabled={true}
                            isEditing={isEditing} onChange={handleChange}
                        />
                        <Field
                            label="Telefon" name="phone" value={formData.phone}
                            isEditing={isEditing} onChange={handleChange} error={profileErrors.phone}
                        />
                    </div>
                </div>

                {/* Karta: Adres */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-zubr-dark mb-4 border-b border-gray-100 pb-2">
                        Adres zamieszkania
                    </h2>
                    <div className="space-y-3">
                        <div className="flex gap-4">
                            <Field
                                label="Kod pocztowy" name="postal_code" value={formData.postal_code} width="w-1/3"
                                isEditing={isEditing} onChange={handleChange} error={profileErrors.postal_code}
                            />
                            <Field
                                label="Miasto" name="city" value={formData.city} width="w-2/3"
                                isEditing={isEditing} onChange={handleChange} error={profileErrors.city}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Field
                                label="Ulica" name="street" value={formData.street} width="w-2/3"
                                isEditing={isEditing} onChange={handleChange} error={profileErrors.street}
                            />
                            <Field
                                label="Nr domu" name="st_number" value={formData.st_number} width="w-1/3"
                                isEditing={isEditing} onChange={handleChange} error={profileErrors.st_number}
                            />
                        </div>
                        <Field
                            label="Nr lokalu" name="apt_number" value={formData.apt_number} width="w-1/3"
                            isEditing={isEditing} onChange={handleChange} error={profileErrors.apt_number}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center space-x-4">
                {isEditing ? (
                    <>
                        <button
                            onClick={handleCancel}
                            className="inline-flex items-center justify-center rounded-xl border border-zubr-dark px-6 py-3 font-bold text-zubr-dark transition hover:bg-zubr-dark hover:text-white"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center justify-center rounded-xl bg-zubr-dark px-6 py-3 font-bold text-white transition hover:bg-zubr-gold"
                        >
                            Zapisz zmiany
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center justify-center rounded-xl border border-zubr-dark px-6 py-3 font-bold text-zubr-dark transition hover:bg-zubr-dark hover:text-white"
                    >
                        Edytuj Profil
                    </button>
                )}
            </div>

            <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-zubr-dark mb-4 border-b border-gray-100 pb-2">
                    Moje pojazdy
                </h2>

                {carError && (
                    <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {carError}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Dodaj pojazd</h3>
                        <form onSubmit={handleAddCar} className="space-y-3">
                            <div>
                                <input
                                    type="text"
                                    name="brand"
                                    value={carForm.brand}
                                    onChange={handleCarFormChange}
                                    placeholder="Marka"
                                    required
                                    className={`w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-zubr-gold ${carErrors.brand ? "border-red-400" : "border-gray-300"}`}
                                />
                                {carErrors.brand && <p className="mt-1 text-xs text-red-600">{carErrors.brand}</p>}
                            </div>
                            <div>
                                <input
                                    type="text"
                                    name="model"
                                    value={carForm.model}
                                    onChange={handleCarFormChange}
                                    placeholder="Model"
                                    required
                                    className={`w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-zubr-gold ${carErrors.model ? "border-red-400" : "border-gray-300"}`}
                                />
                                {carErrors.model && <p className="mt-1 text-xs text-red-600">{carErrors.model}</p>}
                            </div>
                            <div>
                                <input
                                    type="text"
                                    name="license_plate"
                                    value={carForm.license_plate}
                                    onChange={handleCarFormChange}
                                    placeholder="Numer rejestracyjny"
                                    required
                                    maxLength={8}
                                    className={`w-full border rounded px-3 py-2 text-gray-700 uppercase focus:outline-none focus:border-zubr-gold ${carErrors.license_plate ? "border-red-400" : "border-gray-300"}`}
                                />
                                {carErrors.license_plate && <p className="mt-1 text-xs text-red-600">{carErrors.license_plate}</p>}
                            </div>
                            <div>
                                <input
                                    type="number"
                                    name="seats"
                                    value={carForm.seats}
                                    onChange={handleCarFormChange}
                                    placeholder="Liczba miejsc"
                                    required
                                    min={1}
                                    max={8}
                                    className={`w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-zubr-gold ${carErrors.seats ? "border-red-400" : "border-gray-300"}`}
                                />
                                {carErrors.seats && <p className="mt-1 text-xs text-red-600">{carErrors.seats}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={carSubmitting}
                                className="inline-flex items-center justify-center rounded-xl bg-zubr-dark px-5 py-3 font-bold text-white transition hover:bg-zubr-gold disabled:opacity-60"
                            >
                                {carSubmitting ? "Dodawanie..." : "Dodaj pojazd"}
                            </button>
                        </form>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Twoje zapisane pojazdy</h3>
                        {carsLoading ? (
                            <div className="text-sm text-gray-500">Ładowanie pojazdów...</div>
                        ) : cars.length === 0 ? (
                            <div className="text-sm text-gray-500 border border-dashed rounded px-4 py-6 text-center">
                                Nie masz jeszcze dodanych pojazdów.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cars.map((car) => (
                                    <div key={car.id} className="border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-800">{car.brand} {car.model}</p>
                                            <p className="text-sm text-gray-500">{car.license_plate} • {car.seats} miejsc</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCar(car.id)}
                                            disabled={carDeletingId === car.id}
                                            className="text-sm text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition disabled:opacity-60"
                                        >
                                            {carDeletingId === car.id ? "Usuwanie..." : "Usuń"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserPage;
