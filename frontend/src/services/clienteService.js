import api from "../api/axiosConfig";

export const obtenerDashboardCliente = async () => {
  const response = await api.get("/cliente/dashboard");
  return response.data.data;
};

export const actualizarRsvpCliente = async (invitacionId, datos) => {
  const response = await api.put(`/cliente/rsvp/${invitacionId}`, datos);
  return response.data;
};