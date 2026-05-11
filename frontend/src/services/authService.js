import api from "../api/axiosConfig";

export const loginUsuario = async (credenciales) => {

  const response = await api.post(
    "/login",
    credenciales
  );

  return response.data;
};

export const guardarToken = (token, usuario = null) => {
  localStorage.setItem("token", token);
  
  if (usuario) {
    localStorage.setItem("usuario", JSON.stringify(usuario));
  }
};

export const obtenerToken = () => {
  return localStorage.getItem("token");
};

export const cerrarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
};