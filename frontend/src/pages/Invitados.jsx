import { useEffect, useState } from "react";
import {
  obtenerInvitados,
  crearInvitado,
  actualizarInvitado,
  eliminarInvitado,
} from "../services/invitadosService";
import { obtenerSegmentos } from "../services/segmentosService";
import { obtenerGrupos } from "../services/gruposService";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";

const formularioInicial = {
  segmento_riesgo_id: "",
  grupo_invitado_id: "",
  nombres: "",
  apellidos: "",
  correo: "",
  telefono: "",
  ciudad: "",
  rango_edad: "",
  puntaje_asistencia: "",
};

function Invitados() {
  const { mostrarToast } = useToast();
  const { confirmar } = useConfirm();

  const [invitados, setInvitados] = useState([]);
  const [segmentos, setSegmentos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [invitadoEditando, setInvitadoEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState(formularioInicial);

  useEffect(() => {
    cargarInvitados();
  }, []);

  const cargarInvitados = async () => {
    try {
      const dataInvitados = await obtenerInvitados();
      const dataSegmentos = await obtenerSegmentos();
      const dataGrupos = await obtenerGrupos();

      setInvitados(dataInvitados);
      setSegmentos(dataSegmentos);
      setGrupos(dataGrupos);
    } catch (error) {
      console.error("Error al cargar invitados:", error);
      mostrarToast("Ocurrió un error al cargar los invitados", "error");
    }
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setInvitadoEditando(null);
    setMostrarFormulario(false);
  };

  const abrirNuevoInvitado = () => {
    setFormulario(formularioInicial);
    setInvitadoEditando(null);
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
      const datosInvitado = {
        ...formulario,
        segmento_riesgo_id: formulario.segmento_riesgo_id || null,
        grupo_invitado_id: formulario.grupo_invitado_id || null,
        puntaje_asistencia: formulario.puntaje_asistencia || null,
      };

      if (invitadoEditando) {
        await actualizarInvitado(invitadoEditando, datosInvitado);
        mostrarToast("Invitado actualizado correctamente");
      } else {
        await crearInvitado(datosInvitado);
        mostrarToast("Invitado creado correctamente");
      }

      await cargarInvitados();
      limpiarFormulario();
    } catch (error) {
      console.error("Error al guardar invitado:", error);
      mostrarToast("Ocurrió un error al guardar el invitado", "error");
    }
  };

  const manejarEditar = (invitado) => {
    setInvitadoEditando(invitado.id);

    setFormulario({
      segmento_riesgo_id: invitado.segmento_riesgo_id || "",
      grupo_invitado_id: invitado.grupo_invitado_id || "",
      nombres: invitado.nombres || "",
      apellidos: invitado.apellidos || "",
      correo: invitado.correo || "",
      telefono: invitado.telefono || "",
      ciudad: invitado.ciudad || "",
      rango_edad: invitado.rango_edad || "",
      puntaje_asistencia: invitado.puntaje_asistencia || "",
    });

    setMostrarFormulario(true);
  };

  const manejarEliminar = async (id) => {
    const confirmarEliminar = await confirmar({
      titulo: "Eliminar invitado",
      mensaje: "¿Seguro que deseas eliminar este invitado?",
    });

    if (!confirmarEliminar) return;

    try {
      await eliminarInvitado(id);
      await cargarInvitados();
      mostrarToast("Invitado eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar invitado:", error);
      mostrarToast("Ocurrió un error al eliminar el invitado", "error");
    }
  };

  const obtenerNombreCompleto = (invitado) => {
    return `${invitado.nombres || ""} ${invitado.apellidos || ""}`.trim();
  };

  return (
    <div className={`page-with-form ${mostrarFormulario ? "form-open" : "form-closed"}`}>
      {mostrarFormulario && (
        <div className="form-overlay" onClick={limpiarFormulario} />
      )}

      <section className="page-content">
        <h2>Gestión de Invitados</h2>

        <button
          type="button"
          className="toggle-form-button"
          onClick={abrirNuevoInvitado}
        >
          Nuevo invitado
        </button>

        <div className="desktop-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre completo</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Ciudad</th>
                <th>Grupo</th>
                {/* <th>Puntaje</th> */}
                <th>Segmento</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {invitados.map((invitado) => (
                <tr key={invitado.id}>
                  <td>{invitado.id}</td>
                  <td>{obtenerNombreCompleto(invitado)}</td>
                  <td>{invitado.correo || "Sin correo"}</td>
                  <td>{invitado.telefono || "Sin teléfono"}</td>
                  <td>{invitado.ciudad || "Sin ciudad"}</td>
                  <td>{invitado.nombre_grupo || "Sin grupo"}</td>
                  {/* <td>{invitado.puntaje_asistencia || "Sin puntaje"}</td> */}
                  <td>{invitado.segmento_riesgo || "Sin segmento"}</td>
                  <td>
                    <button onClick={() => manejarEditar(invitado)}>
                      Editar
                    </button>

                    <button onClick={() => manejarEliminar(invitado.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards">
          {invitados.map((invitado) => (
            <article key={invitado.id} className="mobile-card">
              <div className="mobile-card-row">
                <strong>ID</strong>
                <span>{invitado.id}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Nombre</strong>
                <span>{obtenerNombreCompleto(invitado)}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Correo</strong>
                <span>{invitado.correo || "Sin correo"}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Teléfono</strong>
                <span>{invitado.telefono || "Sin teléfono"}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Ciudad</strong>
                <span>{invitado.ciudad || "Sin ciudad"}</span>
              </div>

              <div className="mobile-card-row">
                <strong>Grupo</strong>
                <span>{invitado.nombre_grupo || "Sin grupo"}</span>
              </div>

              {/* <div className="mobile-card-row">
                <strong>Puntaje</strong>
                <span>{invitado.puntaje_asistencia || "Sin puntaje"}</span>
              </div> */}

              <div className="mobile-card-row">
                <strong>Segmento</strong>
                <span>{invitado.segmento_riesgo || "Sin segmento"}</span>
              </div>

              <div className="mobile-card-actions">
                <button onClick={() => manejarEditar(invitado)}>
                  Editar
                </button>

                <button onClick={() => manejarEliminar(invitado.id)}>
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

        <h3>{invitadoEditando ? "Editar invitado" : "Nuevo invitado"}</h3>

        <form onSubmit={manejarEnvio}>
          <input
            type="text"
            name="nombres"
            placeholder="Nombres"
            value={formulario.nombres}
            onChange={manejarCambio}
            required
          />

          <input
            type="text"
            name="apellidos"
            placeholder="Apellidos"
            value={formulario.apellidos}
            onChange={manejarCambio}
            required
          />

          <input
            type="email"
            name="correo"
            placeholder="Correo"
            value={formulario.correo}
            onChange={manejarCambio}
          />

          <input
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value={formulario.telefono}
            onChange={manejarCambio}
          />

          <input
            type="text"
            name="ciudad"
            placeholder="Ciudad"
            value={formulario.ciudad}
            onChange={manejarCambio}
          />

          {/* <input
            type="text"
            name="rango_edad"
            placeholder="Rango de edad"
            value={formulario.rango_edad}
            onChange={manejarCambio}
          /> */}

          {/* <input
            type="number"
            name="puntaje_asistencia"
            placeholder="Puntaje asistencia"
            value={formulario.puntaje_asistencia}
            onChange={manejarCambio}
          /> */}

          <select
            name="grupo_invitado_id"
            value={formulario.grupo_invitado_id}
            onChange={manejarCambio}
          >
            <option value="">Seleccionar grupo</option>

            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nombre_grupo}
              </option>
            ))}
          </select>

          <select
            name="segmento_riesgo_id"
            value={formulario.segmento_riesgo_id}
            onChange={manejarCambio}
          >
            <option value="">Seleccionar segmento</option>

            {segmentos.map((segmento) => (
              <option key={segmento.id} value={segmento.id}>
                {segmento.nombre}
              </option>
            ))}
          </select>

          <button type="submit">
            {invitadoEditando ? "Actualizar invitado" : "Crear invitado"}
          </button>

          {invitadoEditando && (
            <button type="button" onClick={limpiarFormulario}>
              Cancelar edición
            </button>
          )}
        </form>
      </aside>
    </div>
  );
}

export default Invitados;