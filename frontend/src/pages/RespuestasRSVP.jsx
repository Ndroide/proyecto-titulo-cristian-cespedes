import { useEffect, useState } from "react";
import {
  obtenerRespuestas,
  crearRespuesta,
  actualizarRespuesta,
  eliminarRespuesta,
} from "../services/rsvpService";
import { obtenerInvitaciones } from "../services/invitacionesService";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";

const formularioInicial = {
  invitacion_id: "",
  estado_respuesta: "",
  fecha_respuesta: "",
  cantidad_acompanantes: 0,
  observaciones: "",
};

function RespuestasRSVP() {
  const { mostrarToast } = useToast();
  const { confirmar } = useConfirm();
  const [respuestas, setRespuestas] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [respuestaEditando, setRespuestaEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState(formularioInicial);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const dataRespuestas = await obtenerRespuestas();
      const dataInvitaciones = await obtenerInvitaciones();

      setRespuestas(dataRespuestas);
      setInvitaciones(dataInvitaciones);
    } catch (error) {
      console.error("Error al cargar RSVP:", error);
      mostrarToast("Ocurrió un error al cargar las respuestas RSVP", "error");
    }
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setRespuestaEditando(null);
    setMostrarFormulario(false);
  };

  const abrirNuevaRespuesta = () => {
    setFormulario(formularioInicial);
    setRespuestaEditando(null);
    setMostrarFormulario(true);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    try {
      const datosRespuesta = {
        ...formulario,
        fecha_respuesta: formulario.fecha_respuesta || null,
      };

      if (respuestaEditando) {
        await actualizarRespuesta(respuestaEditando, datosRespuesta);
        mostrarToast("Respuesta RSVP actualizada correctamente");
      } else {
        await crearRespuesta(datosRespuesta);
        mostrarToast("Respuesta RSVP creada correctamente");
      }

      await cargarDatos();
      limpiarFormulario();
    } catch (error) {
      console.error("Error al guardar RSVP:", error);
      mostrarToast("Ocurrió un error al guardar la respuesta RSVP", "error");
    }
  };

  const manejarEditar = (respuesta) => {
    setRespuestaEditando(respuesta.id);

    setFormulario({
      invitacion_id: respuesta.invitacion_id || "",
      estado_respuesta: respuesta.estado_respuesta || "",
      fecha_respuesta: respuesta.fecha_respuesta
        ? respuesta.fecha_respuesta.split("T")[0]
        : "",
      cantidad_acompanantes: respuesta.cantidad_acompanantes || 0,
      observaciones: respuesta.observaciones || "",
    });

    setMostrarFormulario(true);
  };

  const manejarEliminar = async (id) => {
    const confirmarEliminar = await confirmar({
      titulo: "Eliminar respuesta RSVP",
      mensaje: "¿Seguro que deseas eliminar esta respuesta RSVP?",
    });

    if (!confirmarEliminar) return;

    try {
      await eliminarRespuesta(id);
      await cargarDatos();
      mostrarToast("Respuesta RSVP eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar RSVP:", error);
      mostrarToast("Ocurrió un error al eliminar la respuesta RSVP", "error");
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleDateString("es-CL");
  };

  return (
    <div className={`page-with-form ${mostrarFormulario ? "form-open" : "form-closed"}`}>
      {mostrarFormulario && (
        <div className="form-overlay" onClick={limpiarFormulario} />
      )}

      <section className="page-content">
        <h2>Gestión de Respuestas RSVP</h2>

        <button
          type="button"
          className="toggle-form-button"
          onClick={abrirNuevaRespuesta}
        >
          Nueva respuesta RSVP
        </button>

        <div className="desktop-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Invitación</th>
                <th>Evento</th>
                <th>Invitado</th>
                <th>Estado</th>
                <th>Fecha respuesta</th>
                <th>Acompañantes</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {respuestas.map((respuesta) => (
                <tr key={respuesta.id}>
                  <td>{respuesta.id}</td>
                  <td>{respuesta.codigo_invitacion}</td>
                  <td>{respuesta.evento}</td>
                  <td>{respuesta.invitado}</td>
                  <td>{respuesta.estado_respuesta}</td>
                  <td>{formatearFecha(respuesta.fecha_respuesta)}</td>
                  <td>{respuesta.cantidad_acompanantes}</td>
                  <td>{respuesta.observaciones || "Sin observaciones"}</td>
                  <td>
                    <button onClick={() => manejarEditar(respuesta)}>
                      Editar
                    </button>

                    <button onClick={() => manejarEliminar(respuesta.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards">
          {respuestas.map((respuesta) => (
            <article key={respuesta.id} className="mobile-card">
              <div className="mobile-card-row">
                <strong>ID</strong>
                <span>{respuesta.id}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Invitación</strong>
                <span>{respuesta.codigo_invitacion}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Evento</strong>
                <span>{respuesta.evento}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Invitado</strong>
                <span>{respuesta.invitado}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Estado</strong>
                <span>{respuesta.estado_respuesta}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Fecha</strong>
                <span>{formatearFecha(respuesta.fecha_respuesta)}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Acompañantes</strong>
                <span>{respuesta.cantidad_acompanantes}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Observaciones</strong>
                <span>{respuesta.observaciones || "Sin observaciones"}</span>
              </div>

              <div className="mobile-card-actions">
                <button onClick={() => manejarEditar(respuesta)}>
                  Editar
                </button>

                <button onClick={() => manejarEliminar(respuesta.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className={`form-panel ${mostrarFormulario ? "is-open" : "is-hidden"}`}>
        <button
          type="button"
          className="form-close-button"
          onClick={limpiarFormulario}
        >
          ×
        </button>

        <h3>
          {respuestaEditando ? "Editar respuesta RSVP" : "Nueva respuesta RSVP"}
        </h3>

        <form onSubmit={manejarEnvio}>
          <select
            name="invitacion_id"
            value={formulario.invitacion_id}
            onChange={manejarCambio}
            required
          >
            <option value="">Seleccionar invitación</option>

            {invitaciones.map((invitacion) => (
              <option key={invitacion.id} value={invitacion.id}>
                {invitacion.codigo_invitacion} | {invitacion.evento} |{" "}
                {invitacion.invitado}
              </option>
            ))}
          </select>

          <select
            name="estado_respuesta"
            value={formulario.estado_respuesta}
            onChange={manejarCambio}
            required
          >
            <option value="">Seleccionar estado</option>
            <option value="confirmado">Confirmado</option>
            <option value="rechazado">Rechazado</option>
            <option value="pendiente">Pendiente</option>
          </select>

          <input
            type="date"
            name="fecha_respuesta"
            value={formulario.fecha_respuesta}
            onChange={manejarCambio}
          />

          <input
            type="number"
            name="cantidad_acompanantes"
            placeholder="Cantidad acompañantes"
            value={formulario.cantidad_acompanantes}
            onChange={manejarCambio}
          />

          <textarea
            name="observaciones"
            placeholder="Observaciones"
            value={formulario.observaciones}
            onChange={manejarCambio}
          />

          <button type="submit">
            {respuestaEditando ? "Actualizar RSVP" : "Crear RSVP"}
          </button>

          {respuestaEditando && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar edición
            </button>
          )}
        </form>
      </aside>
    </div>
  );
}

export default RespuestasRSVP;