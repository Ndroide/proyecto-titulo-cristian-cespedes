import { Navigate, useLocation } from "react-router-dom";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  const usuario = JSON.parse(
    localStorage.getItem("usuario")
  );

  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const rutasSoloAdmin = [
    "/eventos",
    "/invitados",
    "/grupos",
    "/evento-grupos",
    "/invitaciones",
    "/respuestas-rsvp",
    "/recordatorios",
  ];

  const esCliente = usuario?.rol === "Cliente";

  const intentandoRutaAdmin =
    rutasSoloAdmin.includes(location.pathname);

  if (esCliente && intentandoRutaAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;