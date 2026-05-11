import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../services/authService";

function Login() {

  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    correo: "",
    contrasena: "",
  });

  const [error, setError] = useState("");

  const manejarCambio = (e) => {

    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  };

  const manejarLogin = async (e) => {

    e.preventDefault();

    setError("");

    try {

      const response = await loginUsuario(
        formulario
      );

      localStorage.setItem(
        "token",
        response.token
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(response.usuario)
      );

      /* if (response.usuario.rol === "Cliente") {
        navigate("/");
      } else {
        navigate("/");
      } */

      navigate("/");

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Error al iniciar sesión"
      );
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <h1>Iniciar sesión</h1>

        <p>
          Plataforma de Gestión de Eventos
        </p>

        <form onSubmit={manejarLogin}>

          <input
            type="email"
            name="correo"
            placeholder="Correo"
            value={formulario.correo}
            onChange={manejarCambio}
            required
          />

          <input
            type="password"
            name="contrasena"
            placeholder="Contraseña"
            value={formulario.contrasena}
            onChange={manejarCambio}
            required
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button type="submit">
            Ingresar
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;