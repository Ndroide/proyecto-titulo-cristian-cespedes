import { useEffect, useState } from "react";
import {
  obtenerInvitaciones,
  crearInvitacion,
  actualizarInvitacion,
  eliminarInvitacion,
} from "../services/invitacionesService";
import { obtenerEventos } from "../services/eventosService";
import { obtenerInvitados } from "../services/invitadosService";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";

const formularioInicial = {
  evento_id: "",
  invitado_id: "",
  codigo_invitacion: "",
  canal_envio: "",
  fecha_envio: "",
  estado_invitacion: "pendiente",
  vista_previa_mensaje: "",
};

function Invitaciones() {
  const { mostrarToast } = useToast();
  const { confirmar } = useConfirm();
  const [invitaciones, setInvitaciones] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [invitados, setInvitados] = useState([]);
  const [invitacionEditando, setInvitacionEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState(formularioInicial);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const dataInvitaciones = await obtenerInvitaciones();
      const dataEventos = await obtenerEventos();
      const dataInvitados = await obtenerInvitados();

      setInvitaciones(dataInvitaciones);
      setEventos(dataEventos);
      setInvitados(dataInvitados);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      mostrarToast("Ocurrió un error al cargar las invitaciones", "error");
    }
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setInvitacionEditando(null);
    setMostrarFormulario(false);
  };

  const abrirNuevaInvitacion = () => {
    setFormulario(formularioInicial);
    setInvitacionEditando(null);
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
      const datosInvitacion = {
        ...formulario,
        fecha_envio: formulario.fecha_envio || null,
      };

      if (invitacionEditando) {
        await actualizarInvitacion(invitacionEditando, datosInvitacion);
        mostrarToast("Invitación actualizada correctamente");
      } else {
        await crearInvitacion(datosInvitacion);
        mostrarToast("Invitación creada correctamente");
      }

      await cargarDatos();
      limpiarFormulario();
    } catch (error) {
      console.error("Error al guardar invitación:", error);
      mostrarToast("Ocurrió un error al guardar la invitación", "error");
    }
  };

  const manejarEditar = (invitacion) => {
    setInvitacionEditando(invitacion.id);

    setFormulario({
      evento_id: invitacion.evento_id || "",
      invitado_id: invitacion.invitado_id || "",
      codigo_invitacion: invitacion.codigo_invitacion || "",
      canal_envio: invitacion.canal_envio || "",
      fecha_envio: invitacion.fecha_envio
        ? invitacion.fecha_envio.split("T")[0]
        : "",
      estado_invitacion: invitacion.estado_invitacion || "pendiente",
      vista_previa_mensaje: invitacion.vista_previa_mensaje || "",
    });

    setMostrarFormulario(true);
  };

  const manejarEliminar = async (id) => {
    const confirmarEliminar = await confirmar({
      titulo: "Eliminar invitación",
      mensaje: "¿Seguro que deseas eliminar esta invitación?",
    });

    if (!confirmarEliminar) return;

    try {
      await eliminarInvitacion(id);
      await cargarDatos();
      mostrarToast("Invitación eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar invitación:", error);
      mostrarToast("Ocurrió un error al eliminar la invitación", "error");
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
        <h2>Gestión de Invitaciones</h2>

        <button
          type="button"
          className="toggle-form-button"
          onClick={abrirNuevaInvitacion}
        >
          Nueva invitación
        </button>

        <div className="desktop-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Evento</th>
                <th>Invitado</th>
                <th>Código</th>
                <th>Canal</th>
                <th>Fecha envío</th>
                <th>Estado</th>
                <th>Mensaje</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {invitaciones.map((invitacion) => (
                <tr key={invitacion.id}>
                  <td>{invitacion.id}</td>
                  <td>{invitacion.evento || "Sin evento"}</td>
                  <td>{invitacion.invitado || "Sin invitado"}</td>
                  <td>{invitacion.codigo_invitacion}</td>
                  <td>{invitacion.canal_envio}</td>
                  <td>{formatearFecha(invitacion.fecha_envio)}</td>
                  <td>{invitacion.estado_invitacion}</td>
                  <td>{invitacion.vista_previa_mensaje || "Sin mensaje"}</td>
                  <td>
                    <button onClick={() => manejarEditar(invitacion)}>
                      Editar
                    </button>

                    <button onClick={() => manejarEliminar(invitacion.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards">
          {invitaciones.map((invitacion) => (
            <article key={invitacion.id} className="mobile-card">
              <div className="mobile-card-row">
                <strong>ID</strong>
                <span>{invitacion.id}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Evento</strong>
                <span>{invitacion.evento || "Sin evento"}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Invitado</strong>
                <span>{invitacion.invitado || "Sin invitado"}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Código</strong>
                <span>{invitacion.codigo_invitacion}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Canal</strong>
                <span>{invitacion.canal_envio}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Fecha</strong>
                <span>{formatearFecha(invitacion.fecha_envio)}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Estado</strong>
                <span>{invitacion.estado_invitacion}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Mensaje</strong>
                <span>{invitacion.vista_previa_mensaje || "Sin mensaje"}</span>
              </div>

              <div className="mobile-card-actions">
                <button onClick={() => manejarEditar(invitacion)}>
                  Editar
                </button>

                <button onClick={() => manejarEliminar(invitacion.id)}>
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

        <h3>{invitacionEditando ? "Editar invitación" : "Nueva invitación"}</h3>

        <form onSubmit={manejarEnvio}>
          <select
            name="evento_id"
            value={formulario.evento_id}
            onChange={manejarCambio}
            required
          >
            <option value="">Seleccionar evento</option>

            {eventos.map((evento) => (
              <option key={evento.id} value={evento.id}>
                {evento.titulo}
              </option>
            ))}
          </select>

          <select
            name="invitado_id"
            value={formulario.invitado_id}
            onChange={manejarCambio}
            required
          >
            <option value="">Seleccionar invitado</option>

            {invitados.map((invitado) => (
              <option key={invitado.id} value={invitado.id}>
                {invitado.nombres} {invitado.apellidos}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="codigo_invitacion"
            placeholder="Código de invitación"
            value={formulario.codigo_invitacion}
            onChange={manejarCambio}
            required
          />

          <select
            name="canal_envio"
            value={formulario.canal_envio}
            onChange={manejarCambio}
            required
          >
            <option value="">Seleccionar canal</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </select>

          <input
            type="date"
            name="fecha_envio"
            value={formulario.fecha_envio}
            onChange={manejarCambio}
          />

          <select
            name="estado_invitacion"
            value={formulario.estado_invitacion}
            onChange={manejarCambio}
          >
            <option value="pendiente">Pendiente</option>
            <option value="enviada">Enviada</option>
            <option value="vista">Vista</option>
            <option value="respondida">Respondida</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <textarea
            name="vista_previa_mensaje"
            placeholder="Vista previa del mensaje"
            value={formulario.vista_previa_mensaje}
            onChange={manejarCambio}
          />

          <button type="submit">
            {invitacionEditando ? "Actualizar invitación" : "Crear invitación"}
          </button>

          {invitacionEditando && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar edición
            </button>
          )}
        </form>
      </aside>
    </div>
  );
}

export default Invitaciones;