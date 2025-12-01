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
                password2: password2
            });

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
        <form onSubmit={handleSubmit} className="form-container">
            <h1>Rejestracja</h1>
            <input
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nazwa użytkownika"
            />
            <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                />
            <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hasło"
            />
            <input
                className="form-input"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Powtórz hasło"

                />
            <button className="form-button" type="submit">
                {loading ? "Rejestrowanie..." : "Zarejestruj się"}
            </button>
        </form>
    );
}

export default Register;