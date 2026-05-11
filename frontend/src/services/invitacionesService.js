import api from "../api/axiosConfig";

export const obtenerInvitaciones = async () => {
  const response = await api.get("/invitaciones");
  return response.data.data;
};

export const crearInvitacion = async (invitacion) => {
  const response = await api.post("/invitaciones", invitacion);
  return response.data;
};

export const actualizarInvitacion = async (id, invitacion) => {
  const response = await api.put(`/invitaciones/${id}`, invitacion);
  return response.data;
};

export const eliminarInvitacion = async (id) => {
  const response = await api.delete(`/invitaciones/${id}`);
  return response.data;
};