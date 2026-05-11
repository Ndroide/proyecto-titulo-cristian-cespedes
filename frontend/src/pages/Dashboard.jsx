import { useEffect, useState } from "react";
import { obtenerMetricasDashboard } from "../services/dashboardService";
import {
  obtenerDashboardCliente,
  actualizarRsvpCliente,
} from "../services/clienteService";
import { useToast } from "../context/ToastContext";

function Dashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (usuario?.rol === "Cliente") {
    return <DashboardCliente />;
  }

  return <DashboardAdmin />;
}

function DashboardAdmin() {
  const { mostrarToast } = useToast();
  const [metricas, setMetricas] = useState(null);

  useEffect(() => {
    cargarMetricas();
  }, []);

  const cargarMetricas = async () => {
    try {
      const data = await obtenerMetricasDashboard();
      setMetricas(data);
    } catch (error) {
      console.error("Error al cargar métricas:", error);
      mostrarToast("Ocurrió un error al cargar las métricas", "error");
    }
  };

  if (!metricas) {
    return <p>Cargando métricas...</p>;
  }

  return (
    <div>
      <h2>Dashboard Administrador</h2>

      <section className="dashboard-grid">
        <div className="card">
          <h3>Eventos registrados</h3>
          <p>{metricas.total_eventos}</p>
        </div>

        <div className="card">
          <h3>Invitados registrados</h3>
          <p>{metricas.total_invitados}</p>
        </div>

        <div className="card">
          <h3>Confirmados</h3>
          <p>{metricas.confirmados}</p>
        </div>

        <div className="card">
          <h3>Asistencia proyectada</h3>
          <p>{metricas.asistencia_proyectada}</p>
        </div>

        <div className="card">
          <h3>Recordatorios enviados</h3>
          <p>{metricas.recordatorios_enviados}</p>
        </div>
      </section>

      <section className="dashboard-section">
        <h3>Respuestas RSVP</h3>

        <div className="metric-row">
          <span>Confirmados</span>
          <strong>{metricas.confirmados}</strong>
        </div>

        <div className="metric-row">
          <span>Rechazados</span>
          <strong>{metricas.rechazados}</strong>
        </div>

        <div className="metric-row">
          <span>Pendientes</span>
          <strong>{metricas.pendientes}</strong>
        </div>
      </section>

      <section className="dashboard-section">
        <h3>Segmentación de riesgo</h3>

        <div className="metric-row">
          <span>Riesgo alto</span>
          <strong>{metricas.riesgo_alto}</strong>
        </div>

        <div className="metric-row">
          <span>Riesgo medio</span>
          <strong>{metricas.riesgo_medio}</strong>
        </div>

        <div className="metric-row">
          <span>Riesgo bajo</span>
          <strong>{metricas.riesgo_bajo}</strong>
        </div>
      </section>

      <section className="dashboard-section">
        <h3>Recordatorios</h3>

        <div className="metric-row">
          <span>Total</span>
          <strong>{metricas.total_recordatorios}</strong>
        </div>

        <div className="metric-row">
          <span>Programados</span>
          <strong>{metricas.recordatorios_programados}</strong>
        </div>

        <div className="metric-row">
          <span>Enviados</span>
          <strong>{metricas.recordatorios_enviados}</strong>
        </div>

        <div className="metric-row">
          <span>Fallidos</span>
          <strong>{metricas.recordatorios_fallidos}</strong>
        </div>
      </section>
    </div>
  );
}

function DashboardCliente() {
  const { mostrarToast } = useToast();

  const [invitaciones, setInvitaciones] = useState(null);
  const [invitacionSeleccionada, setInvitacionSeleccionada] = useState(null);

  const [formularioRsvp, setFormularioRsvp] = useState({
    estado_respuesta: "",
    cantidad_acompanantes: 0,
    observaciones: "",
  });

  useEffect(() => {
    cargarDashboardCliente();
  }, []);

  const cargarDashboardCliente = async () => {
    try {
      const data = await obtenerDashboardCliente();
      setInvitaciones(data);
    } catch (error) {
      console.error("Error al cargar dashboard cliente:", error);
      mostrarToast("Ocurrió un error al cargar tu información", "error");
    }
  };

  const abrirModalRsvp = (item) => {
    setInvitacionSeleccionada(item);

    setFormularioRsvp({
      estado_respuesta: item.estado_respuesta || "",
      cantidad_acompanantes: item.cantidad_acompanantes || 0,
      observaciones: item.observaciones || "",
    });
  };

  const cerrarModalRsvp = () => {
    setInvitacionSeleccionada(null);

    setFormularioRsvp({
      estado_respuesta: "",
      cantidad_acompanantes: 0,
      observaciones: "",
    });
  };

  const manejarCambioRsvp = (e) => {
    const { name, value } = e.target;

    setFormularioRsvp({
      ...formularioRsvp,
      [name]: value,
    });
  };

  const guardarRsvp = async (e) => {
    e.preventDefault();

    try {
      await actualizarRsvpCliente(
        invitacionSeleccionada.invitacion_id,
        formularioRsvp
      );

      mostrarToast("Respuesta RSVP actualizada correctamente");

      cerrarModalRsvp();
      await cargarDashboardCliente();
    } catch (error) {
      console.error("Error al actualizar RSVP:", error);

      mostrarToast(
        error.response?.data?.message ||
          "Ocurrió un error al actualizar la RSVP",
        "error"
      );
    }
  };

  if (!invitaciones) {
    return <p>Cargando tu dashboard...</p>;
  }

  const puedeEditarRsvp = (fechaEvento) => {
    const fecha = new Date(fechaEvento);
    const hoy = new Date();

    const diferenciaDias = Math.ceil(
      (fecha - hoy) / (1000 * 60 * 60 * 24)
    );

    return diferenciaDias >= 5;
  };

  const confirmados = invitaciones.filter(
    (item) => item.estado_respuesta === "confirmado"
  ).length;

  const rechazados = invitaciones.filter(
    (item) => item.estado_respuesta === "rechazado"
  ).length;

  const pendientes = invitaciones.filter(
    (item) => !item.estado_respuesta || item.estado_respuesta === "pendiente"
  ).length;

  const asistenciaProyectada = invitaciones.reduce((total, item) => {
    if (item.estado_respuesta !== "confirmado") return total;

    return total + 1 + Number(item.cantidad_acompanantes || 0);
  }, 0);

  return (
    <div>
      <h2>Mi Dashboard</h2>

      <section className="dashboard-grid">
        <div className="card">
          <h3>Eventos invitados</h3>
          <p>{invitaciones.length}</p>
        </div>

        <div className="card">
          <h3>Confirmados</h3>
          <p>{confirmados}</p>
        </div>

        <div className="card">
          <h3>Pendientes</h3>
          <p>{pendientes}</p>
        </div>

        <div className="card">
          <h3>Asistencia proyectada</h3>
          <p>{asistenciaProyectada}</p>
        </div>
      </section>

      <section className="dashboard-section">
        <h3>Mis invitaciones</h3>

        {invitaciones.length === 0 ? (
          <p>No tienes invitaciones asociadas.</p>
        ) : (
          invitaciones.map((item) => (
            <div key={item.invitacion_id} className="client-event-card">
              <h4>{item.evento}</h4>

              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(item.fecha_evento).toLocaleDateString("es-CL")}
              </p>

              <p>
                <strong>Hora:</strong> {item.hora_evento || "Por confirmar"}
              </p>

              <p>
                <strong>Ubicación:</strong> {item.ubicacion}
              </p>

              <p>
                <strong>Estado invitación:</strong>{" "}
                {item.estado_invitacion || "pendiente"}
              </p>

              <p>
                <strong>Respuesta RSVP:</strong>{" "}
                {item.estado_respuesta || "pendiente"}
              </p>

              <p>
                <strong>Acompañantes:</strong>{" "}
                {item.cantidad_acompanantes || 0}
              </p>

              {item.observaciones && (
                <p>
                  <strong>Observaciones:</strong> {item.observaciones}
                </p>
              )}

              {puedeEditarRsvp(item.fecha_evento) ? (
                <button
                  type="button"
                  className="client-action-link"
                  onClick={() => abrirModalRsvp(item)}
                >
                  Responder o editar RSVP
                </button>
              ) : (
                <p className="client-closed-rsvp">
                  RSVP cerrado: ya no es posible modificar esta respuesta.
                </p>
              )}
            </div>
          ))
        )}
      </section>

      {invitacionSeleccionada && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Responder RSVP</h3>

            <p>
              <strong>{invitacionSeleccionada.evento}</strong>
            </p>

            <form onSubmit={guardarRsvp}>
              <select
                name="estado_respuesta"
                value={formularioRsvp.estado_respuesta}
                onChange={manejarCambioRsvp}
                required
              >
                <option value="">Seleccionar respuesta</option>
                <option value="confirmado">Confirmar asistencia</option>
                <option value="rechazado">No asistiré</option>
                <option value="pendiente">Pendiente</option>
              </select>

              <input
                type="number"
                name="cantidad_acompanantes"
                placeholder="Cantidad acompañantes"
                value={formularioRsvp.cantidad_acompanantes}
                onChange={manejarCambioRsvp}
                min="0"
              />

              <textarea
                name="observaciones"
                placeholder="Observaciones"
                value={formularioRsvp.observaciones}
                onChange={manejarCambioRsvp}
              />

              <div className="confirm-actions">
                <button
                  type="button"
                  className="confirm-cancel"
                  onClick={cerrarModalRsvp}
                >
                  Cancelar
                </button>

                <button type="submit" className="confirm-save">
                  Guardar respuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;