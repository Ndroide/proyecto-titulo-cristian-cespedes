import api from "../api/axiosConfig";

export const obtenerInvitados = async () => {
  const response = await api.get("/invitados");
  return response.data.data;
};

export const crearInvitado = async (invitado) => {
  const response = await api.post("/invitados", invitado);
  return response.data;
};

export const actualizarInvitado = async (id, invitado) => {
  const response = await api.put(`/invitados/${id}`, invitado);
  return response.data;
};

export const eliminarInvitado = async (id) => {
  const response = await api.delete(`/invitados/${id}`);
  return response.data;
};