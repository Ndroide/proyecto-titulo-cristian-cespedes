import { useEffect, useState } from "react";
import {
  obtenerMetricasDashboard,
  obtenerMetricasDashboardPorEvento,
} from "../services/dashboardService";

import { obtenerEventos } from "../services/eventosService";
import {
  obtenerDashboardCliente,
  actualizarRsvpCliente,
} from "../services/clienteService";
import { useToast } from "../context/ToastContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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

  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");

  useEffect(() => {
    //cargarMetricas();
    cargarDatosIniciales();
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

  const cargarDatosIniciales = async () => {
    try {
      const dataEventos = await obtenerEventos();
      setEventos(dataEventos);

      const dataMetricas = await obtenerMetricasDashboard();
      setMetricas(dataMetricas);
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
      mostrarToast("Ocurrió un error al cargar el dashboard", "error");
    }
  };

  const manejarCambioEvento = async (e) => {
    const eventoId = e.target.value;
    setEventoSeleccionado(eventoId);

    try {
      if (eventoId === "") {
        const data = await obtenerMetricasDashboard();
        setMetricas(data);
      } else {
        const data = await obtenerMetricasDashboardPorEvento(eventoId);
        setMetricas(data);
      }
    } catch (error) {
      console.error("Error al cargar métricas del evento:", error);
      mostrarToast("Ocurrió un error al cargar las métricas del evento", "error");
    }
  };

  if (!metricas) {
    return <p>Cargando métricas...</p>;
  }

  const datosRsvp = [
    { name: "Confirmados", value: metricas.confirmados },
    { name: "Rechazados", value: metricas.rechazados },
    { name: "Pendientes", value: metricas.pendientes },
  ];

  const datosRiesgo = [
    { name: "Alto", cantidad: metricas.riesgo_alto },
    { name: "Medio", cantidad: metricas.riesgo_medio },
    { name: "Bajo", cantidad: metricas.riesgo_bajo },
  ];

  const coloresRsvp = ["#22c55e", "#ef4444", "#f59e0b"];

  return (
    <div>
      <h2>Dashboard Administrador</h2>

      <section className="dashboard-section dashboard-selected-event">
        <h3>Filtro de análisis</h3>

        <label htmlFor="eventoSeleccionado">
          Seleccionar evento
        </label>

        <select id="eventoSeleccionado" value={eventoSeleccionado} onChange={manejarCambioEvento}>
          <option value="">Todos los eventos</option>

          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.titulo}
            </option>
          ))}
        </select>

        {/* {metricas.evento && (
          <p className="event-select-name">Analizando evento: <strong>{metricas.evento}</strong></p>
        )} */}
      </section>

      <section className="dashboard-grid">
        <div className={`card ${metricas.evento ? "card-evento" : ""}`}>
          {metricas.evento ? (
            <>
              <h3>Evento analizado</h3>
              <div className="event-summary">
                <h4>{metricas.evento}</h4>
                <p>
                  <strong>Fecha:</strong>{" "}
                  {metricas.fecha_evento
                    ? new Date(metricas.fecha_evento).toLocaleDateString("es-CL")
                    : "No definida"}
                </p>
                <p>
                  <strong>Hora:</strong>{" "}
                  {metricas.hora_evento || "No definida"}
                </p>
                <p>
                  <strong>Ubicación:</strong>{" "}
                  {metricas.ubicacion || "No definida"}
                </p>
                <p>
                  <strong>Riesgo general:</strong>
                </p>

                <div className={`risk-badge ${metricas.riesgo_general.toLowerCase()}`}>
                  {metricas.riesgo_general}
                </div>
              </div>
            </>
          ) : (
            <>
              <h3>Resumen global</h3>
              <div className="event-summary">
                <p>
                  <strong>Eventos registrados:</strong>{" "}
                  {metricas.total_eventos}
                </p>
              </div>
            </>
          )}
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
          <strong>{metricas.confirmados} ({metricas.tasa_confirmacion}%)</strong>
        </div>

        <div className="metric-row">
          <span>Rechazados</span>
          <strong>{metricas.rechazados} ({metricas.tasa_rechazo}%)</strong>
        </div>

        <div className="metric-row">
          <span>Pendientes</span>
          <strong>{metricas.pendientes}</strong>
        </div>
      </section>

      <section className="dashboard-section">
        <h3>Gráfico RSVP</h3>

        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={datosRsvp}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {datosRsvp.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={coloresRsvp[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
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
        <h3>Gráfico de segmentación de riesgo</h3>

        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={datosRiesgo}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="cantidad" />
            </BarChart>
          </ResponsiveContainer>
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
  const [invitacionActiva, setInvitacionActiva] = useState(null);
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
      setInvitacionActiva(data[0] || null);
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

    if (name === "estado_respuesta" && value === "rechazado") {
      setFormularioRsvp({
        ...formularioRsvp,
        estado_respuesta: value,
        cantidad_acompanantes: 0,
      });

      return;
    }

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
          <h3>Evento seleccionado</h3>
          <p>{invitacionActiva?.evento || "Sin invitación"}</p>
        </div>

        <div className="card">
          <h3>Estado RSVP</h3>
          <p>{invitacionActiva?.estado_respuesta || "pendiente"}</p>
        </div>

        <div className="card">
          <h3>Acompañantes</h3>
          <p>{invitacionActiva?.cantidad_acompanantes || 0}</p>
        </div>

        <div className="card">
          <h3>Asistencia estimada</h3>
          <p>
            {invitacionActiva?.estado_respuesta === "confirmado"
              ? 1 + Number(invitacionActiva?.cantidad_acompanantes || 0)
              : 0}
          </p>
        </div>
      </section>

      <section className="dashboard-section">
        <h3>Mis invitaciones</h3>

        {invitaciones.length === 0 ? (
          <p>No tienes invitaciones asociadas.</p>
        ) : (
          <div className="invitaciones-lista">
            {invitaciones.map((item) => (
              <div
                key={item.invitacion_id}
                className={`invitacion-item ${
                  invitacionActiva?.invitacion_id === item.invitacion_id
                    ? "active"
                    : ""
                }`}
                onClick={() => setInvitacionActiva(item)}
              >
                <div className="invitacion-main">
                  <h4>{item.evento}</h4>

                  <div className="invitacion-meta">
                    <span>
                      Fecha:{" "}
                      {new Date(item.fecha_evento).toLocaleDateString("es-CL")}
                    </span>

                    <span>
                      Hora: {item.hora_evento || "Por confirmar"}
                    </span>

                    <span>
                      Ubicación: {item.ubicacion}
                    </span>
                  </div>
                </div>

                <div className="invitacion-status">
                  <span
                    className={`estado-badge ${
                      item.estado_respuesta || "pendiente"
                    }`}
                  >
                    {item.estado_respuesta || "pendiente"}
                  </span>

                  {puedeEditarRsvp(item.fecha_evento) ? (
                    <button
                      type="button"
                      className="client-action-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirModalRsvp(item);
                      }}
                    >
                      Responder RSVP
                    </button>
                  ) : (
                    <span className="client-closed-rsvp">
                      RSVP cerrado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
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

              <div className="form-group">
                <label>Cantidad acompañantes</label>
                <input
                type="number"
                name="cantidad_acompanantes"
                placeholder="Cantidad acompañantes"
                value={formularioRsvp.cantidad_acompanantes}
                onChange={manejarCambioRsvp}
                min="0"
              />
              </div>

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