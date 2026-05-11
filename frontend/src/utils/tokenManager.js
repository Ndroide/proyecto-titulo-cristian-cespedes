// Utilidad para manejar tokens en desarrollo/testing

export const guardarTokenCliente = (token, usuario = null) => {
  localStorage.setItem("token", token);
  
  if (usuario) {
    localStorage.setItem("usuario", JSON.stringify(usuario));
  }
  
  console.log("Token guardado en localStorage");
};

export const decodificarToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decodificando token:", error);
    return null;
  }
};

export const mostrarInfoToken = () => {
  const token = localStorage.getItem("token");
  const usuario = localStorage.getItem("usuario");
  
  if (!token) {
    console.log("No hay token guardado");
    return;
  }
  
  console.log("Token actual:", token);
  console.log("Información del token:", decodificarToken(token));
  console.log("Usuario:", usuario);
};
