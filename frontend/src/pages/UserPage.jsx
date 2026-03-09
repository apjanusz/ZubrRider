import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

const Field = ({ label, name, value, type = "text", disabled = false, width = "w-full", isEditing, onChange }) => {
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
                    className={`w-full border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:border-zubr-gold ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
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

    // Stany do edycji
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        getUserProfile();
    }, []);

    const getUserProfile = async () => {
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            const res = await api.patch("/api/accounts/me/", formData);
            setUser(res.data);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert("Błąd podczas zapisywania profilu.");
        }
    };

    const handleCancel = () => {
        setFormData(user);
        setIsEditing(false);
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
        <div className="max-w-4xl mx-auto pb-10">
            {/* Nagłówek profilu */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border-t-4 border-zubr-gold">
                <div className="bg-zubr-dark h-32 w-full relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center text-zubr-dark text-3xl font-bold uppercase shadow-md">
                            {getInitials()}
                        </div>
                    </div>
                </div>
                <div className="pt-14 pb-8 px-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {user.first_name} {user.last_name}
                        </h1>
                        <p className="text-gray-500">@{user.username || "użytkownik"}</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Dołączył: {new Date(user.date_joined).toLocaleDateString()}
                        </p>
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
                            isEditing={isEditing} onChange={handleChange}
                        />
                        <Field
                            label="Nazwisko" name="last_name" value={formData.last_name}
                            isEditing={isEditing} onChange={handleChange}
                        />
                        <Field
                            label="Email" name="email" value={formData.email} disabled={true}
                            isEditing={isEditing} onChange={handleChange}
                        />
                        <Field
                            label="Telefon" name="phone" value={formData.phone}
                            isEditing={isEditing} onChange={handleChange}
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
                                isEditing={isEditing} onChange={handleChange}
                            />
                            <Field
                                label="Miasto" name="city" value={formData.city} width="w-2/3"
                                isEditing={isEditing} onChange={handleChange}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Field
                                label="Ulica" name="street" value={formData.street} width="w-2/3"
                                isEditing={isEditing} onChange={handleChange}
                            />
                            <Field
                                label="Nr domu" name="st_number" value={formData.st_number} width="w-1/3"
                                isEditing={isEditing} onChange={handleChange}
                            />
                        </div>
                        <Field
                            label="Nr lokalu" name="apt_number" value={formData.apt_number} width="w-1/3"
                            isEditing={isEditing} onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center space-x-4">
                {isEditing ? (
                    <>
                        <button
                            onClick={handleCancel}
                            className="text-gray-600 border border-gray-300 px-6 py-2 rounded hover:bg-gray-100 transition"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleSave}
                            className="text-white bg-green-600 border border-green-600 px-6 py-2 rounded hover:bg-green-700 transition shadow-md"
                        >
                            Zapisz zmiany
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-zubr-dark border border-zubr-dark px-6 py-2 rounded hover:bg-zubr-dark hover:text-white transition shadow-sm"
                    >
                        Edytuj Profil
                    </button>
                )}
            </div>
        </div>
    );
}

export default UserPage;