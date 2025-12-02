import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (password !== password2) {
            alert("Hasła muszą być identyczne!");
            setLoading(false);
            return;
        }

        try {
            await api.post("/api/accounts/register/", {
                username,
                email,
                password,
                password2
            });

            // Po sukcesie przekieruj do logowania
            navigate("/login");
        } catch (error) {
            if (error.response) {
                console.log(error.response.data);
                alert("Błąd: " + JSON.stringify(error.response.data));
            } else {
                alert("Błąd połączenia z serwerem!");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] py-10">
            {/* Karta rejestracji */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-4 border-zubr-gold">

                <h1 className="text-3xl font-bold text-center mb-2 text-zubr-dark">
                    Dołącz do stada! 🦬
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Załóż konto i podróżuj taniej.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Nazwa użytkownika */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nazwa użytkownika
                        </label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zubr-gold focus:border-transparent transition"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="np. KarolDziejma"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adres Email
                        </label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zubr-gold focus:border-transparent transition"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jan@przyklad.pl"
                            required
                        />
                    </div>

                    {/* Hasło */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hasło
                        </label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zubr-gold focus:border-transparent transition"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 8 znaków"
                            required
                        />
                    </div>

                    {/* Powtórz Hasło */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Powtórz hasło
                        </label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zubr-gold focus:border-transparent transition"
                            type="password"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            placeholder="Wpisz to samo hasło"
                            required
                        />
                    </div>

                    {/* Przycisk */}
                    <button
                        className={`w-full py-3 rounded-lg font-bold text-zubr-dark text-lg shadow-md transition duration-200 mt-4
                        ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-zubr-gold hover:bg-yellow-400 transform hover:-translate-y-0.5'}`}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Tworzenie konta..." : "Zarejestruj się"}
                    </button>
                </form>

                {/* Link do logowania */}
                <p className="mt-6 text-center text-sm text-gray-600">
                    Masz już konto?{' '}
                    <span
                        onClick={() => navigate('/login')}
                        className="text-zubr-dark font-bold cursor-pointer hover:underline"
                    >
                        Zaloguj się
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Register;