import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post("/api/accounts/token/", {
                email: email,
                password: password
            });

            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            navigate("/");

        } catch (error) {
            console.log(error);
            if (error.response) {
                alert("Błąd logowania: " + JSON.stringify(error.response.data));
            } else {
                alert("Błąd połączenia z serwerem!");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            {/* logowanie karta */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-4 border-zubr-dark">

                {/* header */}
                <h1 className="text-3xl font-bold text-center mb-8 text-zubr-dark">
                    Witaj ponownie!
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adres Email
                        </label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zubr-dark focus:border-transparent transition"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jan.kowalski@przyklad.pl"
                            required
                        />
                    </div>

                    {/* haslo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hasło
                        </label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zubr-dark focus:border-transparent transition"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {/* przycisk */}
                    <button
                        className={`w-full py-3 rounded-lg font-bold text-white text-lg shadow-md transition duration-200 
                        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-zubr-dark hover:bg-green-800 transform hover:-translate-y-0.5'}`}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Logowanie..." : "Zaloguj się"}
                    </button>
                </form>

                {/* rejestracja */}
                <p className="mt-6 text-center text-sm text-gray-600">
                    Nie masz jeszcze konta?{' '}
                    <span
                        onClick={() => navigate('/register')}
                        className="text-zubr-dark font-bold cursor-pointer hover:underline"
                    >
                        Dołącz do nas
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Login;