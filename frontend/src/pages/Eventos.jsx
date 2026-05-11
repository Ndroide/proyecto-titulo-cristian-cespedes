import { useEffect, useState } from "react";
import {
  obtenerEventos,
  crearEvento,
  eliminarEvento,
  actualizarEvento,
} from "../services/eventosService";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";

const estadoInicialFormulario = (usuarioId) => ({
  usuario_id: usuarioId || "",
  titulo: "",
  descripcion: "",
  tipo_evento: "",
  fecha_evento: "",
  hora_evento: "",
  ubicacion: "",
  capacidad: "",
  estado: "borrador",
});

function Eventos() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const { mostrarToast } = useToast();
  const { confirmar } = useConfirm();
  const [eventos, setEventos] = useState([]);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState(
    estadoInicialFormulario(usuario?.id)
  );

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      const data = await obtenerEventos();
      setEventos(data);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      mostrarToast("Ocurrió un error al cargar los eventos", "error");
    }
  };

  const limpiarFormulario = () => {
    setFormulario(estadoInicialFormulario(usuario?.id));
    setEventoEditando(null);
    setMostrarFormulario(false);
  };

  const abrirNuevoEvento = () => {
    setFormulario(estadoInicialFormulario(usuario?.id));
    setEventoEditando(null);
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
      if (eventoEditando) {
        await actualizarEvento(eventoEditando, formulario);
        mostrarToast("Evento actualizado correctamente");
      } else {
        await crearEvento(formulario);
        mostrarToast("Evento creado correctamente");
      }

      await cargarEventos();
      limpiarFormulario();
    } catch (error) {
      console.error("Error al guardar evento:", error);
      mostrarToast("Ocurrió un error al guardar el evento", "error");
    }
  };

  const manejarEditar = (evento) => {
    setEventoEditando(evento.id);

    setFormulario({
      usuario_id: evento.usuario_id || usuario?.id || "",
      titulo: evento.titulo || "",
      descripcion: evento.descripcion || "",
      tipo_evento: evento.tipo_evento || "",
      fecha_evento: evento.fecha_evento ? evento.fecha_evento.split("T")[0] : "",
      hora_evento: evento.hora_evento || "",
      ubicacion: evento.ubicacion || "",
      capacidad: evento.capacidad || "",
      estado: evento.estado || "borrador",
    });

    setMostrarFormulario(true);
  };

  const manejarEliminar = async (id) => {
    const confirmarEliminar = await confirmar({
      titulo: "Eliminar evento",
      mensaje: "¿Seguro que deseas eliminar este evento?",
    });

    if (!confirmarEliminar) return;

    try {
      await eliminarEvento(id);
      await cargarEventos();
      mostrarToast("Evento eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      mostrarToast("Ocurrió un error al eliminar el evento", "error");
    }
  };

  return (
    <div className={`page-with-form ${mostrarFormulario ? "form-open" : "form-closed"}`}>
      {mostrarFormulario && (
        <div className="form-overlay" onClick={limpiarFormulario} />
      )}

      <section className="page-content">
        <h2>Gestión de Eventos</h2>

        <button
          type="button"
          className="toggle-form-button"
          onClick={abrirNuevoEvento}
        >
          Nuevo evento
        </button>

        <div className="desktop-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id}>
                  <td>{evento.id}</td>
                  <td>{evento.titulo}</td>
                  <td>{evento.tipo_evento}</td>
                  <td>
                    {new Date(evento.fecha_evento).toLocaleDateString("es-CL")}
                  </td>
                  <td>{evento.ubicacion}</td>
                  <td>{evento.estado}</td>
                  <td>
                    <button onClick={() => manejarEditar(evento)}>
                      Editar
                    </button>

                    <button onClick={() => manejarEliminar(evento.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards">
          {eventos.map((evento) => (
            <article key={evento.id} className="mobile-card">
              <div className="mobile-card-row">
                <strong>ID</strong>
                <span>{evento.id}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Título</strong>
                <span>{evento.titulo}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Tipo</strong>
                <span>{evento.tipo_evento}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Fecha</strong>
                <span>
                  {new Date(evento.fecha_evento).toLocaleDateString("es-CL")}
                </span>
              </div>

              <div className="mobile-card-row">
                <strong>Ubicación</strong>
                <span>{evento.ubicacion}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Estado</strong>
                <span>{evento.estado}</span>
              </div>

              <div className="mobile-card-actions">
                <button onClick={() => manejarEditar(evento)}>
                  Editar
                </button>

                <button onClick={() => manejarEliminar(evento.id)}>
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

        <h3>{eventoEditando ? "Editar evento" : "Nuevo evento"}</h3>

        <form onSubmit={manejarEnvio}>
          <input
            type="text"
            name="titulo"
            placeholder="Título del evento"
            value={formulario.titulo}
            onChange={manejarCambio}
            required
          />

          <input
            type="text"
            name="tipo_evento"
            placeholder="Tipo de evento"
            value={formulario.tipo_evento}
            onChange={manejarCambio}
            required
          />

          <input
            type="date"
            name="fecha_evento"
            value={formulario.fecha_evento}
            onChange={manejarCambio}
            required
          />

          <input
            type="time"
            name="hora_evento"
            value={formulario.hora_evento}
            onChange={manejarCambio}
          />

          <input
            type="text"
            name="ubicacion"
            placeholder="Ubicación"
            value={formulario.ubicacion}
            onChange={manejarCambio}
            required
          />

          <input
            type="number"
            name="capacidad"
            placeholder="Capacidad"
            value={formulario.capacidad}
            onChange={manejarCambio}
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={formulario.descripcion}
            onChange={manejarCambio}
          />

          <select
            name="estado"
            value={formulario.estado}
            onChange={manejarCambio}
          >
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
            <option value="cancelado">Cancelado</option>
            <option value="finalizado">Finalizado</option>
          </select>

          <button type="submit">
            {eventoEditando ? "Actualizar evento" : "Crear evento"}
          </button>

          {eventoEditando && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar edición
            </button>
          )}
        </form>
      </aside>
    </div>
  );
}

export default Eventos;