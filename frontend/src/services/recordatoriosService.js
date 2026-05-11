import api from "../api/axiosConfig";

export const obtenerRecordatorios = async () => {
  const response = await api.get("/recordatorios");
  return response.data.data;
};

export const crearRecordatorio = async (recordatorio) => {
  const response = await api.post("/recordatorios", recordatorio);
  return response.data;
};

export const actualizarRecordatorio = async (
  id,
  recordatorio
) => {
  const response = await api.put(
    `/recordatorios/${id}`,
    recordatorio
  );

  return response.data;
};

export const eliminarRecordatorio = async (id) => {
  const response = await api.delete(
    `/recordatorios/${id}`
  );

  return response.data;
};