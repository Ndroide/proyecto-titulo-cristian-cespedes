import api from "../api/axiosConfig";

export const obtenerInvitacionPublica = async (codigo) => {
  const response = await api.get(`/invitacion-publica/${codigo}`);
  return response.data.data;
};

export const responderRsvpPublico = async (datos) => {
  const response = await api.post("/rsvp-publico", datos);
  return response.data;
};