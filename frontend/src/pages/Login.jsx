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
        <form onSubmit={handleSubmit} className="form-container">
            <h1>Logowanie</h1>
            <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adres Email"
                required
            />
            <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hasło"
                required
            />
            <button className="form-button" type="submit" disabled={loading}>
                {loading ? "Logowanie..." : "Zaloguj"}
            </button>
        </form>
    );
}

export default Login;