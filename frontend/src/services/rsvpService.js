import api from "../api/axiosConfig";

export const obtenerRespuestas = async () => {
  const response = await api.get("/respuestas-rsvp");
  return response.data.data;
};

export const crearRespuesta = async (respuesta) => {
  const response = await api.post("/respuestas-rsvp", respuesta);
  return response.data;
};

export const actualizarRespuesta = async (id, respuesta) => {
  const response = await api.put(`/respuestas-rsvp/${id}`, respuesta);
  return response.data;
};

export const eliminarRespuesta = async (id) => {
  const response = await api.delete(`/respuestas-rsvp/${id}`);
  return response.data;
};