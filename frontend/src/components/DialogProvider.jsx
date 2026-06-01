import { createContext, useContext, useState } from "react";

import CustomDialog from "./CustomDialog";

const DialogContext = createContext(null);

const initialState = {
    open: false,
    title: "",
    message: "",
    tone: "info",
    confirmLabel: "Rozumiem",
    cancelLabel: "",
};

function DialogProvider({ children }) {
    const [dialogState, setDialogState] = useState(initialState);

    const closeDialog = (result = false) => {
        setDialogState((prev) => {
            prev.resolve?.(result);
            return initialState;
        });
    };

    const showNotice = ({ title, message, tone = "info", confirmLabel = "Rozumiem" }) =>
        new Promise((resolve) => {
            setDialogState({
                open: true,
                title,
                message,
                tone,
                confirmLabel,
                cancelLabel: "",
                resolve,
            });
        });

    const showConfirm = ({
        title,
        message,
        tone = "confirm",
        confirmLabel = "Potwierdź",
        cancelLabel = "Anuluj",
    }) =>
        new Promise((resolve) => {
            setDialogState({
                open: true,
                title,
                message,
                tone,
                confirmLabel,
                cancelLabel,
                resolve,
            });
        });

    const value = {
        showNotice,
        showConfirm,
    };

    return (
        <DialogContext.Provider value={value}>
            {children}
            <CustomDialog
                open={dialogState.open}
                title={dialogState.title}
                message={dialogState.message}
                tone={dialogState.tone}
                confirmLabel={dialogState.confirmLabel}
                cancelLabel={dialogState.cancelLabel}
                onConfirm={() => closeDialog(true)}
                onCancel={() => closeDialog(false)}
            />
        </DialogContext.Provider>
    );
}

function useDialog() {
    const context = useContext(DialogContext);

    if (!context) {
        throw new Error("useDialog must be used within DialogProvider");
    }

    return context;
}

export { DialogProvider, useDialog };
