import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const mostrarToast = (mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}

      {toast && (
        <div className={`toast toast-${toast.tipo}`}>
          {toast.mensaje}
        </div>
      )}
    </ToastContext.Provider>
  );
}