import api from "../api/axiosConfig";

export const obtenerRelacionesEventoGrupo = async () => {
  const response = await api.get("/evento-grupo-invitado");
  return response.data.data;
};

export const crearRelacionEventoGrupo = async (datos) => {
  const response = await api.post("/evento-grupo-invitado", datos);
  return response.data;
};

export const eliminarRelacionEventoGrupo = async (id) => {
  const response = await api.delete(`/evento-grupo-invitado/${id}`);
  return response.data;
};