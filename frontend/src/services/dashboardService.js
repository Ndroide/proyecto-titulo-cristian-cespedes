import api from "../api/axiosConfig";

export const obtenerMetricasDashboard = async () => {
  const response = await api.get("/dashboard/metricas");
  return response.data.data;
};