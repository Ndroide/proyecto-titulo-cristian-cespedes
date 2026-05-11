import { useEffect, useState } from "react";

import { obtenerEventos } from "../services/eventosService";
import { obtenerGrupos } from "../services/gruposService";

import {
  obtenerRelacionesEventoGrupo,
  crearRelacionEventoGrupo,
  eliminarRelacionEventoGrupo,
} from "../services/eventoGrupoService";

import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";

function EventoGrupos() {
  const { mostrarToast } = useToast();
  const { confirmar } = useConfirm();

  const [eventos, setEventos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [relaciones, setRelaciones] = useState([]);

  const [formulario, setFormulario] = useState({
    evento_id: "",
    grupo_invitado_id: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const dataEventos = await obtenerEventos();
      const dataGrupos = await obtenerGrupos();
      const dataRelaciones = await obtenerRelacionesEventoGrupo();

      setEventos(dataEventos);
      setGrupos(dataGrupos);
      setRelaciones(dataRelaciones);
    } catch (error) {
      console.error("Error al cargar relaciones evento-grupo:", error);
      mostrarToast("Ocurrió un error al cargar los datos", "error");
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  };

  const limpiarFormulario = () => {
    setFormulario({
      evento_id: "",
      grupo_invitado_id: "",
    });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    try {
      await crearRelacionEventoGrupo(formulario);

      mostrarToast("Grupo asociado al evento correctamente");

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      console.error("Error al asociar grupo:", error);
      mostrarToast("Ocurrió un error al asociar el grupo", "error");
    }
  };

  const manejarEliminar = async (id) => {
    const confirmarEliminar = await confirmar({
      titulo: "Eliminar asociación",
      mensaje: "¿Seguro que deseas eliminar esta asociación evento-grupo?",
    });

    if (!confirmarEliminar) return;

    try {
      await eliminarRelacionEventoGrupo(id);

      mostrarToast("Asociación eliminada correctamente");

      await cargarDatos();
    } catch (error) {
      console.error("Error al eliminar asociación:", error);
      mostrarToast("Ocurrió un error al eliminar la asociación", "error");
    }
  };

  return (
    <div>
      <h2>Asignación Evento - Grupo</h2>

      <section className="dashboard-section">
        <h3>Asociar grupo a evento</h3>

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
            name="grupo_invitado_id"
            value={formulario.grupo_invitado_id}
            onChange={manejarCambio}
            required
          >
            <option value="">Seleccionar grupo</option>

            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nombre_grupo}
              </option>
            ))}
          </select>

          <button type="submit">Asociar grupo</button>
        </form>
      </section>

      <section className="dashboard-section">
        <h3>Relaciones existentes</h3>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Evento</th>
              <th>Grupo</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {relaciones.map((relacion) => (
              <tr key={relacion.id}>
                <td>{relacion.id}</td>
                <td>{relacion.evento}</td>
                <td>{relacion.nombre_grupo}</td>
                <td>{relacion.descripcion || "Sin descripción"}</td>
                <td>
                  <button onClick={() => manejarEliminar(relacion.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default EventoGrupos;