import { useEffect, useState } from "react";

import {
  obtenerGrupos,
  crearGrupo,
  actualizarGrupo,
  eliminarGrupo,
} from "../services/gruposService";

import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";

function Grupos() {
  const { mostrarToast } = useToast();
  const { confirmar } = useConfirm();

  const [grupos, setGrupos] = useState([]);
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre_grupo: "",
    descripcion: "",
  });

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      const data = await obtenerGrupos();
      setGrupos(data);
    } catch (error) {
      console.error("Error al cargar grupos:", error);

      mostrarToast(
        "Ocurrió un error al cargar los grupos",
        "error"
      );
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
      nombre_grupo: "",
      descripcion: "",
    });

    setGrupoEditando(null);
    setMostrarFormulario(false);
  };

  const abrirNuevoGrupo = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    try {
      if (grupoEditando) {
        await actualizarGrupo(
          grupoEditando,
          formulario
        );

        mostrarToast(
          "Grupo actualizado correctamente"
        );
      } else {
        await crearGrupo(formulario);

        mostrarToast(
          "Grupo creado correctamente"
        );
      }

      limpiarFormulario();
      cargarGrupos();

    } catch (error) {
      console.error("Error al guardar grupo:", error);

      mostrarToast(
        "Ocurrió un error al guardar el grupo",
        "error"
      );
    }
  };

  const manejarEditar = (grupo) => {
    setGrupoEditando(grupo.id);

    setFormulario({
      nombre_grupo: grupo.nombre_grupo || "",
      descripcion: grupo.descripcion || "",
    });

    setMostrarFormulario(true);
  };

  const manejarEliminar = async (id) => {
    const confirmarEliminar = await confirmar({
      titulo: "Eliminar grupo",
      mensaje:
        "¿Seguro que deseas eliminar este grupo?",
    });

    if (!confirmarEliminar) return;

    try {
      await eliminarGrupo(id);

      cargarGrupos();

      mostrarToast(
        "Grupo eliminado correctamente"
      );

    } catch (error) {
      console.error("Error al eliminar grupo:", error);

      mostrarToast(
        "Ocurrió un error al eliminar el grupo",
        "error"
      );
    }
  };

  return (
    <div
      className={`page-with-form ${
        mostrarFormulario
          ? "form-open"
          : "form-closed"
      }`}
    >
      {mostrarFormulario && (
        <div
          className="form-overlay"
          onClick={limpiarFormulario}
        />
      )}

      <section className="page-content">
        <h2>Gestión de Grupos</h2>

        <button
          type="button"
          className="toggle-form-button"
          onClick={abrirNuevoGrupo}
        >
          Nuevo grupo
        </button>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {grupos.map((grupo) => (
              <tr key={grupo.id}>
                <td>{grupo.id}</td>

                <td>{grupo.nombre_grupo}</td>

                <td>{grupo.descripcion}</td>

                <td>
                  <button
                    onClick={() =>
                      manejarEditar(grupo)
                    }
                  >
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      manejarEliminar(grupo.id)
                    }
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <aside
        className={`form-panel ${
          mostrarFormulario
            ? "is-open"
            : "is-hidden"
        }`}
      >
        <button
          type="button"
          className="form-close-button"
          onClick={limpiarFormulario}
        >
          ×
        </button>

        <h3>
          {grupoEditando
            ? "Editar grupo"
            : "Nuevo grupo"}
        </h3>

        <form onSubmit={manejarEnvio}>
          <input
            type="text"
            name="nombre_grupo"
            placeholder="Nombre grupo"
            value={formulario.nombre_grupo}
            onChange={manejarCambio}
            required
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={formulario.descripcion}
            onChange={manejarCambio}
          />

          <button type="submit">
            {grupoEditando
              ? "Actualizar grupo"
              : "Crear grupo"}
          </button>

          {grupoEditando && (
            <button
              type="button"
              onClick={limpiarFormulario}
            >
              Cancelar edición
            </button>
          )}
        </form>
      </aside>
    </div>
  );
}

export default Grupos;