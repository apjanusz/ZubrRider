import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function PublishRide() {
    const navigate = useNavigate();
    const [cars, setCars] = useState([]);
    const [loadingCars, setLoadingCars] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Formularz
    const [formData, setFormData] = useState({
        start_city: "",
        start_street: "",
        start_st_number: "",
        end_city: "",
        end_street: "",
        end_st_number: "",
        date: "",
        time: "",
        price: "",
        seats: 3,
        car_id: ""
    });

    useEffect(() => {
        // Pobierz listę samochodów użytkownika
        api.get("/api/accounts/my-cars/")
            .then(res => {
                setCars(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, car_id: res.data[0].id }));
                }
            })
            .catch(err => alert("Błąd pobierania aut: " + err))
            .finally(() => setLoadingCars(false));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Payload zgodny z RideCreateSerializer
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
                st_number: formData.start_st_number
            },
            end_location: {
                name: "Koniec",
                city: formData.end_city,
                street: formData.end_street,
                st_number: formData.end_st_number
            }
        };

        try {
            await api.post("/api/rides/create/", payload);
            alert("Przejazd dodany pomyślnie!");
            navigate("/my-rides");
        } catch (error) {
            console.error(error);
            alert("Wystąpił błąd przy dodawaniu przejazdu. Sprawdź poprawność danych.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingCars) return <div className="text-center mt-10">Ładowanie Twoich pojazdów...</div>;

    if (cars.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-xl shadow p-8 max-w-lg mx-auto border-t-4 border-red-500">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Nie masz dodanego samochodu!</h2>
                <p className="text-gray-600 mb-6">Aby dodać przejazd, musisz najpierw zarejestrować pojazd w swoim profilu.</p>
                <p className="text-sm text-gray-400">(Funkcja dodawania auta w przygotowaniu - poproś admina o dodanie auta w panelu Django)</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border-t-4 border-zubr-gold">
            <h1 className="text-3xl font-bold text-zubr-dark mb-6 text-center">Dodaj nowy przejazd</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* SKĄD */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-3 uppercase text-sm flex items-center gap-2">
                        📍 Miejsce startu
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-4 md:col-span-2">
                            <input name="start_city" placeholder="Miasto (np. Białystok)" required onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-zubr-gold outline-none" />
                        </div>
                        <div className="col-span-3 md:col-span-1">
                            <input name="start_street" placeholder="Ulica" required onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-zubr-gold outline-none" />
                        </div>
                        <div className="col-span-1">
                            <input name="start_st_number" placeholder="Nr" required onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-zubr-gold outline-none" />
                        </div>
                    </div>
                </div>

                {/* DOKĄD */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-3 uppercase text-sm flex items-center gap-2">
                        🏁 Miejsce docelowe
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-4 md:col-span-2">
                            <input name="end_city" placeholder="Miasto (np. Choroszcz)" required onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-zubr-gold outline-none" />
                        </div>
                        <div className="col-span-3 md:col-span-1">
                            <input name="end_street" placeholder="Ulica" required onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-zubr-gold outline-none" />
                        </div>
                        <div className="col-span-1">
                            <input name="end_st_number" placeholder="Nr" required onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-zubr-gold outline-none" />
                        </div>
                    </div>
                </div>

                {/* SZCZEGÓŁY */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Data</label>
                        <input type="date" name="date" required onChange={handleChange} 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-zubr-gold outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Godzina</label>
                        <input type="time" name="time" required onChange={handleChange} 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-zubr-gold outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Cena (PLN)</label>
                        <input type="number" name="price" placeholder="15.00" min="0" step="0.01" required onChange={handleChange} 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-zubr-gold outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Liczba miejsc</label>
                        <input type="number" name="seats" defaultValue="3" min="1" max="8" required onChange={handleChange} 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-zubr-gold outline-none" />
                    </div>
                </div>

                {/* AUTO */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Wybierz pojazd</label>
                    <select name="car_id" className="w-full p-3 border rounded bg-white focus:ring-2 focus:ring-zubr-gold outline-none" onChange={handleChange}>
                        {cars.map(car => (
                            <option key={car.id} value={car.id}>
                                {car.brand} {car.model} ({car.seats} os.)
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" disabled={submitting}
                    className="w-full bg-zubr-dark text-white py-3 rounded-lg font-bold text-lg hover:bg-green-800 transition transform active:scale-95">
                    {submitting ? "Publikowanie..." : "Opublikuj przejazd"}
                </button>
            </form>
        </div>
    );
}

export default PublishRide;