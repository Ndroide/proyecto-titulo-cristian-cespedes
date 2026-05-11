import api from "../api/axiosConfig";

export const obtenerGrupos = async () => {
  const response = await api.get("/grupos-invitados");
  return response.data.data;
};

export const crearGrupo = async (datos) => {
  const response = await api.post("/grupos-invitados", datos);
  return response.data;
};

export const actualizarGrupo = async (id, datos) => {
  const response = await api.put(`/grupos-invitados/${id}`, datos);
  return response.data;
};

export const eliminarGrupo = async (id) => {
  const response = await api.delete(`/grupos-invitados/${id}`);
  return response.data;
};