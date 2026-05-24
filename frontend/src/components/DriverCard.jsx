import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X, QrCode, CheckCircle, Lock } from "lucide-react";
import api from "../api";

// ── Tutaj wklej link do zdjęcia/strony, który ma być zakodowany w QR ──
const DRIVER_CARD_QR_URL = "https://WSTAW_TUTAJ_LINK_DO_ZDJECIA";

function formatDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
}

function ProgressBar({ current, required }) {
    const pct = Math.min((current / required) * 100, 100);
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-500">Przejazdy w tym miesiącu</span>
                <span className={pct >= 100 ? "text-green-600" : "text-zubr-dark"}>
                    {current} / {required}
                </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : "bg-zubr-gold"}`}
                />
            </div>
        </div>
    );
}

function QRModal({ onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
            >
                {/* header */}
                <div className="bg-zubr-dark px-6 pt-6 pb-4 text-white text-center">
                    <Award className="mx-auto mb-2" size={36} />
                    <h2 className="text-xl font-extrabold tracking-tight">Aktywny Kierowca Aglomeracji</h2>
                    <p className="text-xs text-gray-300 mt-1 font-medium uppercase tracking-widest">
                        Karta Kierowcy — Ulga Parkingowa
                    </p>
                </div>

                {/* QR */}
                <div className="flex flex-col items-center gap-4 px-6 py-8">
                    <div className="p-3 rounded-2xl border-4 border-zubr-gold shadow-lg bg-white">
                        <QRCodeSVG
                            value={DRIVER_CARD_QR_URL}
                            size={200}
                            bgColor="#ffffff"
                            fgColor="#1a1a1a"
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                    <p className="text-xs text-gray-400 text-center max-w-[220px]">
                        Zeskanuj kod, aby otworzyć dokument uprawniający do darmowego parkowania w Strefach Carpooling.
                    </p>
                </div>

                {/* footer */}
                <div className="bg-green-50 border-t border-green-100 px-6 py-3 flex items-center justify-center gap-2">
                    <CheckCircle size={16} className="text-green-600 shrink-0" />
                    <span className="text-xs font-bold text-green-700">Status: AKTYWNY</span>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                    aria-label="Zamknij"
                >
                    <X size={18} />
                </button>
            </motion.div>
        </motion.div>
    );
}

export default function DriverCard() {
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        api.get("/api/accounts/driver-card/")
            .then((res) => setCard(res.data))
            .catch(() => setCard(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;
    if (!card) return null;

    const { eligible, rides_this_month, required_rides, valid_from, valid_until } = card;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border-2 p-5 mb-8 ${
                    eligible
                        ? "border-green-400 bg-green-50"
                        : "border-gray-200 bg-white"
                }`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* left */}
                    <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl shrink-0 ${eligible ? "bg-green-100" : "bg-gray-100"}`}>
                            {eligible ? (
                                <Award size={28} className="text-green-600" />
                            ) : (
                                <Lock size={28} className="text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-extrabold text-zubr-dark text-lg leading-tight">
                                Karta Kierowcy
                            </h3>
                            {eligible ? (
                                <p className="text-sm text-green-700 font-medium mt-0.5">
                                    Aktywna · Ważna do <span className="font-bold">{formatDate(valid_until)}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Wykonaj {required_rides - rides_this_month} więcej{" "}
                                    {required_rides - rides_this_month === 1 ? "przejazd" : "przejazdów"} w tym miesiącu, aby odblokować kartę.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* right — button */}
                    {eligible && (
                        <button
                            onClick={() => setShowQR(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-zubr-dark px-5 py-3 font-bold text-white transition hover:bg-zubr-gold shrink-0"
                        >
                            <QrCode size={18} />
                            Pokaż kod QR
                        </button>
                    )}
                </div>

                {/* progress bar */}
                <div className="mt-4">
                    <ProgressBar current={rides_this_month} required={required_rides} />
                </div>

                {eligible && (
                    <p className="text-[11px] text-gray-400 mt-3">
                        Karta uprawnia do darmowego parkowania w wyznaczonych Strefach Carpooling (miejsca Eco/Zielone).
                        Ważna od <span className="font-semibold">{formatDate(valid_from)}</span> do{" "}
                        <span className="font-semibold">{formatDate(valid_until)}</span>.
                    </p>
                )}
            </motion.div>

            <AnimatePresence>
                {showQR && <QRModal onClose={() => setShowQR(false)} />}
            </AnimatePresence>
        </>
    );
}
