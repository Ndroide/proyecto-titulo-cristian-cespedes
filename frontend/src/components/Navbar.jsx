import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const enlacesAdmin = [
  { to: "/", label: "Dashboard" },
  { to: "/eventos", label: "Eventos" },
  { to: "/invitados", label: "Invitados" },
  { to: "/grupos", label: "Grupos" },
  { to: "/evento-grupos", label: "Evento Grupos" },
  { to: "/invitaciones", label: "Invitaciones" },
  { to: "/respuestas-rsvp", label: "RSVP" },
  { to: "/recordatorios", label: "Recordatorios" },
];

const enlacesCliente = [
  { to: "/", label: "Mi Dashboard" },
];

function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const esCliente = usuario?.rol === "Cliente";

  const enlacesMenu = esCliente ? enlacesCliente : enlacesAdmin;

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  const alternarMenu = () => {
    setMenuAbierto((estadoActual) => !estadoActual);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    cerrarMenu();
    navigate("/login");
  };

  return (
    <>
      <button
        type="button"
        className="mobile-menu-button"
        onClick={alternarMenu}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
      >
        {menuAbierto ? "×" : "☰"}
      </button>

      {menuAbierto && (
        <div className="sidebar-overlay" onClick={cerrarMenu} />
      )}

      <aside className={`sidebar ${menuAbierto ? "is-open" : ""}`}>
        <div className="sidebar-header">
          <h1>{ usuario?.nombre_completo }</h1>
          <p>{esCliente ? usuario?.rol : "Panel administrativo"}</p>
        </div>

        <nav className="sidebar-nav">
          {enlacesMenu.map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to} onClick={cerrarMenu}>
              {enlace.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <button type="button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;