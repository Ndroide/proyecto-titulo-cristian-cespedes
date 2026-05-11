import { useEffect, useState } from "react";
import {
  obtenerRecordatorios,
  crearRecordatorio,
  actualizarRecordatorio,
  eliminarRecordatorio,
} from "../services/recordatoriosService";
import { obtenerInvitaciones } from "../services/invitacionesService";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";

const formularioInicial = {
  invitacion_id: "",
  tipo_recordatorio: "",
  fecha_envio: "",
  estado_recordatorio: "programado",
};

function Recordatorios() {
  const { mostrarToast } = useToast();
  const { confirmar } = useConfirm();
  const [recordatorios, setRecordatorios] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [recordatorioEditando, setRecordatorioEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState(formularioInicial);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const dataRecordatorios = await obtenerRecordatorios();
      const dataInvitaciones = await obtenerInvitaciones();

      setRecordatorios(dataRecordatorios);
      setInvitaciones(dataInvitaciones);
    } catch (error) {
      console.error("Error al cargar recordatorios:", error);
      mostrarToast("Ocurrió un error al cargar los recordatorios", "error");
    }
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setRecordatorioEditando(null);
    setMostrarFormulario(false);
  };

  const abrirNuevoRecordatorio = () => {
    setFormulario(formularioInicial);
    setRecordatorioEditando(null);
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
      const datosRecordatorio = {
        ...formulario,
        fecha_envio: formulario.fecha_envio || null,
      };

      if (recordatorioEditando) {
        await actualizarRecordatorio(recordatorioEditando, datosRecordatorio);
        mostrarToast("Recordatorio actualizado correctamente");
      } else {
        await crearRecordatorio(datosRecordatorio);
        mostrarToast("Recordatorio creado correctamente");
      }

      await cargarDatos();
      limpiarFormulario();
    } catch (error) {
      console.error("Error al guardar recordatorio:", error);
      mostrarToast("Ocurrió un error al guardar el recordatorio", "error");
    }
  };

  const manejarEditar = (recordatorio) => {
    setRecordatorioEditando(recordatorio.id);

    setFormulario({
      invitacion_id: recordatorio.invitacion_id || "",
      tipo_recordatorio: recordatorio.tipo_recordatorio || "",
      fecha_envio: recordatorio.fecha_envio
        ? recordatorio.fecha_envio.split("T")[0]
        : "",
      estado_recordatorio: recordatorio.estado_recordatorio || "programado",
    });

    setMostrarFormulario(true);
  };

  const manejarEliminar = async (id) => {
    const confirmarEliminar = await confirmar({
      titulo: "Eliminar recordatorio",
      mensaje: "¿Seguro que deseas eliminar este recordatorio?",
    });

    if (!confirmarEliminar) return;

    try {
      await eliminarRecordatorio(id);
      await cargarDatos();
      mostrarToast("Recordatorio eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar recordatorio:", error);
      mostrarToast("Ocurrió un error al eliminar el recordatorio", "error");
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
        <h2>Gestión de Recordatorios</h2>

        <button
          type="button"
          className="toggle-form-button"
          onClick={abrirNuevoRecordatorio}
        >
          Nuevo recordatorio
        </button>

        <div className="desktop-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Invitación</th>
                <th>Evento</th>
                <th>Invitado</th>
                <th>Tipo</th>
                <th>Fecha envío</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {recordatorios.map((recordatorio) => (
                <tr key={recordatorio.id}>
                  <td>{recordatorio.id}</td>
                  <td>{recordatorio.codigo_invitacion}</td>
                  <td>{recordatorio.evento}</td>
                  <td>{recordatorio.invitado}</td>
                  <td>{recordatorio.tipo_recordatorio}</td>
                  <td>{formatearFecha(recordatorio.fecha_envio)}</td>
                  <td>{recordatorio.estado_recordatorio}</td>
                  <td>
                    <button onClick={() => manejarEditar(recordatorio)}>
                      Editar
                    </button>

                    <button onClick={() => manejarEliminar(recordatorio.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards">
          {recordatorios.map((recordatorio) => (
            <article key={recordatorio.id} className="mobile-card">
              <div className="mobile-card-row">
                <strong>ID</strong>
                <span>{recordatorio.id}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Invitación</strong>
                <span>{recordatorio.codigo_invitacion}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Evento</strong>
                <span>{recordatorio.evento}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Invitado</strong>
                <span>{recordatorio.invitado}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Tipo</strong>
                <span>{recordatorio.tipo_recordatorio}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Fecha</strong>
                <span>{formatearFecha(recordatorio.fecha_envio)}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Estado</strong>
                <span>{recordatorio.estado_recordatorio}</span>
              </div>

              <div className="mobile-card-actions">
                <button onClick={() => manejarEditar(recordatorio)}>
                  Editar
                </button>

                <button onClick={() => manejarEliminar(recordatorio.id)}>
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

        <h3>{recordatorioEditando ? "Editar recordatorio" : "Nuevo recordatorio"}</h3>

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
            name="tipo_recordatorio"
            value={formulario.tipo_recordatorio}
            onChange={manejarCambio}
            required
          >
            <option value="">Seleccionar tipo</option>
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
            name="estado_recordatorio"
            value={formulario.estado_recordatorio}
            onChange={manejarCambio}
          >
            <option value="programado">Programado</option>
            <option value="enviado">Enviado</option>
            <option value="fallido">Fallido</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <button type="submit">
            {recordatorioEditando
              ? "Actualizar recordatorio"
              : "Crear recordatorio"}
          </button>

          {recordatorioEditando && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar edición
            </button>
          )}
        </form>
      </aside>
    </div>
  );
}

export default Recordatorios;