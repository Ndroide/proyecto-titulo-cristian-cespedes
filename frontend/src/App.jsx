import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Eventos from "./pages/Eventos";
import Invitados from "./pages/Invitados";
import Invitaciones from "./pages/Invitaciones";
import RespuestasRSVP from "./pages/RespuestasRSVP";
import Recordatorios from "./pages/Recordatorios";
import InvitadoRSVP from "./pages/InvitadoRSVP";
import Grupos from "./pages/Grupos";
import EventoGrupos from "./pages/EventoGrupos";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/rsvp/:codigo" element={<InvitadoRSVP />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="eventos" element={<Eventos />} />
          <Route path="invitados" element={<Invitados />} />
          <Route path="grupos" element={<Grupos />} />
          <Route path="evento-grupos" element={<EventoGrupos />} />
          <Route path="invitaciones" element={<Invitaciones />} />
          <Route path="respuestas-rsvp" element={<RespuestasRSVP />} />
          <Route path="recordatorios" element={<Recordatorios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;