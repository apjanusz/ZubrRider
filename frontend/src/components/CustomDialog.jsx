import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

function CustomDialog({
    open,
    title,
    message,
    tone = "info",
    confirmLabel = "Rozumiem",
    cancelLabel = "",
    onConfirm,
    onCancel,
}) {
    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.96 }}
                        className="relative z-[10000] w-full max-w-md overflow-hidden rounded-3xl bg-white"
                    >
                        <div className="bg-gradient-to-r from-zubr-dark via-green-800 to-zubr-dark px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-zubr-gold">
                                        Informacja
                                    </p>
                                    <h2 className="text-xl font-bold">{title}</h2>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-6">
                            <p className="text-sm leading-7 text-gray-600">{message}</p>

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                {cancelLabel && (
                                    <button
                                        type="button"
                                        onClick={onCancel}
                                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-600 transition hover:bg-gray-50"
                                    >
                                        {cancelLabel}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    className="inline-flex items-center justify-center rounded-xl bg-zubr-gold px-5 py-3 font-bold text-zubr-dark transition hover:bg-yellow-400"
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default CustomDialog;
