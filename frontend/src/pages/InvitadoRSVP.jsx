import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  obtenerInvitacionPublica,
  responderRsvpPublico,
} from "../services/publicService";

function InvitadoRSVP() {
  const { codigo } = useParams();

  const [invitacion, setInvitacion] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    estado_respuesta: "",
    cantidad_acompanantes: 0,
    observaciones: "",
  });

  const yaRespondio = invitacion?.estado_respuesta;

  useEffect(() => {
    cargarInvitacion();
  }, [codigo]);

  const cargarInvitacion = async () => {
    try {
      const data = await obtenerInvitacionPublica(codigo);

      setInvitacion(data);

      if (data.estado_respuesta) {
        setFormulario({
          estado_respuesta: data.estado_respuesta || "",
          cantidad_acompanantes:
            data.cantidad_acompanantes || 0,
          observaciones:
            data.observaciones || "",
        });
      }

    } catch (error) {

      console.error(
        "Error al cargar invitación:",
        error
      );

      setError(
        "No se encontró la invitación."
      );

    } finally {

      setCargando(false);

    }
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

      await responderRsvpPublico({
        invitacion_id:
          invitacion.invitacion_id,
        ...formulario,
      });

      setMensaje(
        "Tu respuesta fue registrada correctamente."
      );

      setError("");

      await cargarInvitacion();

    } catch (error) {

      console.error(
        "Error al responder RSVP:",
        error
      );

      setError(
        "No fue posible registrar tu respuesta."
      );
    }
  };

  if (cargando) {

    return (
      <div className="public-page">
        <div className="public-card">
          <p>Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (error && !invitacion) {

    return (
      <div className="public-page">
        <div className="public-card">

          <h1>
            Invitación no encontrada
          </h1>

          <p>{error}</p>

        </div>
      </div>
    );
  }

  return (
    <div className="public-page">

      <div className="public-card">

        <h1>
          {invitacion.evento}
        </h1>

        <p>
          Hola,{" "}

          <strong>
            {invitacion.invitado}
          </strong>

        </p>

        <div className="public-info">

          <p>
            <strong>Tipo:</strong>{" "}
            {invitacion.tipo_evento}
          </p>

          <p>
            <strong>Fecha:</strong>{" "}

            {new Date(
              invitacion.fecha_evento
            ).toLocaleDateString("es-CL")}

          </p>

          <p>
            <strong>Hora:</strong>{" "}
            {invitacion.hora_evento ||
              "Por confirmar"}
          </p>

          <p>
            <strong>Ubicación:</strong>{" "}
            {invitacion.ubicacion}
          </p>

          <p>
            <strong>Descripción:</strong>{" "}
            {invitacion.descripcion ||
              "Sin descripción"}
          </p>

        </div>

        {yaRespondio ? (

          <div className="public-success">

            <h3>
              Ya registraste tu respuesta
            </h3>

            <p>
              Estado:
              <strong>
                {" "}
                {invitacion.estado_respuesta}
              </strong>
            </p>

            <p>
              Acompañantes:
              <strong>
                {" "}
                {invitacion.cantidad_acompanantes || 0}
              </strong>
            </p>

            {invitacion.observaciones && (
              <p>
                Observaciones:
                <strong>
                  {" "}
                  {invitacion.observaciones}
                </strong>
              </p>
            )}

          </div>

        ) : (

          <form onSubmit={manejarEnvio}>

            <select
              name="estado_respuesta"
              value={
                formulario.estado_respuesta
              }
              onChange={manejarCambio}
              required
            >

              <option value="">
                Seleccionar respuesta
              </option>

              <option value="confirmado">
                Confirmar asistencia
              </option>

              <option value="rechazado">
                No asistiré
              </option>

            </select>

            <label> Acompañantes
            <input
              type="number"
              name="cantidad_acompanantes"
              placeholder="Cantidad de acompañantes"
              value={
                formulario.cantidad_acompanantes
              }
              onChange={manejarCambio}
              min="0"
            />
            </label>

            <textarea
              name="observaciones"
              placeholder="Observaciones"
              value={
                formulario.observaciones
              }
              onChange={manejarCambio}
            />

            <button type="submit">
              Enviar respuesta
            </button>

          </form>

        )}

        {mensaje && (
          <div className="public-success">
            {mensaje}
          </div>
        )}

        {error && invitacion && (
          <div className="public-error">
            {error}
          </div>
        )}

      </div>

    </div>
  );
}

export default InvitadoRSVP;