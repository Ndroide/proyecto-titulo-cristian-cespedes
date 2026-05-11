import { createContext, useContext, useState } from "react";

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const [confirmacion, setConfirmacion] = useState(null);

  const confirmar = ({ titulo, mensaje }) => {
    return new Promise((resolve) => {
      setConfirmacion({
        titulo,
        mensaje,
        onConfirmar: () => {
          setConfirmacion(null);
          resolve(true);
        },
        onCancelar: () => {
          setConfirmacion(null);
          resolve(false);
        },
      });
    });
  };

  return (
    <ConfirmContext.Provider value={{ confirmar }}>
      {children}

      {confirmacion && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>{confirmacion.titulo}</h3>
            <p>{confirmacion.mensaje}</p>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-cancel"
                onClick={confirmacion.onCancelar}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="confirm-delete"
                onClick={confirmacion.onConfirmar}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}