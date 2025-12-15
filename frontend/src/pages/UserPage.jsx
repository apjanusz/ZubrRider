import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function UserPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getUserProfile();
    }, []);

    const getUserProfile = async () => {
        try {
            const res = await api.get("/api/accounts/profile/");
            setUser(res.data);
        } catch (error) {
            console.error(error);
            alert("Nie udało się pobrać danych profilu.");
            // Opcjonalnie: jeśli token wygasł, wyloguj
            // navigate("/login"); 
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center mt-10">Ładowanie profilu...</div>;
    }

    if (!user) {
        return <div className="text-center mt-10">Brak danych użytkownika.</div>;
    }

    // Funkcja pomocnicza do wyświetlania awatara z inicjałów
    const getInitials = () => {
        const first = user.first_name ? user.first_name[0] : "";
        const last = user.last_name ? user.last_name[0] : "";
        const login = user.username ? user.username[0] : "?";
        return (first + last) || login;
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Nagłówek profilu */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border-t-4 border-zubr-gold">
                <div className="bg-zubr-dark h-32 w-full relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center text-zubr-dark text-3xl font-bold uppercase shadow-md">
                            {getInitials()}
                        </div>
                    </div>
                </div>
                <div className="pt-14 pb-8 px-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {user.first_name} {user.last_name}
                    </h1>
                    <p className="text-gray-500">@{user.username || "użytkownik"}</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Dołączył: {new Date(user.date_joined).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Karta: Dane kontaktowe */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-zubr-dark mb-4 border-b border-gray-100 pb-2">
                        Dane kontaktowe
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">Email</span>
                            <span className="text-gray-700">{user.email}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">Telefon</span>
                            <span className="text-gray-700">{user.phone || "Nie podano"}</span>
                        </div>
                    </div>
                </div>

                {/* Karta: Adres */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-zubr-dark mb-4 border-b border-gray-100 pb-2">
                        Adres zamieszkania
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">Miasto</span>
                            <span className="text-gray-700">
                                {user.postal_code} {user.city || "Nie podano"}
                            </span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">Ulica</span>
                            <span className="text-gray-700">
                                {user.street ? `ul. ${user.street} ${user.st_number}` : "Nie podano"}
                                {user.apt_number && ` / ${user.apt_number}`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center">
                <button className="text-zubr-dark border border-zubr-dark px-4 py-2 rounded hover:bg-zubr-dark hover:text-white transition">
                    Edytuj Profil (Wkrótce)
                </button>
            </div>
        </div>
    );
}

export default UserPage;