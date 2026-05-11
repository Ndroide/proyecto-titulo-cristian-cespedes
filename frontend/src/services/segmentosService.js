import api from "../api/axiosConfig";

export const obtenerSegmentos = async () => {
  const response = await api.get("/segmentos-riesgo");
  return response.data.data;
};