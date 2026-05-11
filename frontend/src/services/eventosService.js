import api from "../api/axiosConfig";

export const obtenerEventos = async () => {
  const response = await api.get("/eventos");
  return response.data.data;
};

export const crearEvento = async (evento) => {
  const response = await api.post("/eventos", evento);
  return response.data;
};

export const eliminarEvento = async (id) => {
  const response = await api.delete(`/eventos/${id}`);
  return response.data;
};

export const actualizarEvento = async (id, evento) => {
  const response = await api.put(`/eventos/${id}`, evento);
  return response.data;
};