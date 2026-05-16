import api from "../api/axiosConfig";

export const obtenerMetricasDashboard = async () => {
  const response = await api.get("/dashboard/metricas");
  return response.data.data;
};

export const obtenerMetricasDashboardPorEvento = async (eventoId) => {
  const response = await api.get(`/dashboard/metricas/evento/${eventoId}`);
  return response.data.data;
};