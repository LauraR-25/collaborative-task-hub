import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (showForgotPassword) {
      if (email) {
        alert(`Se ha enviado un enlace de recuperación a ${email}`);
        setShowForgotPassword(false);
      } else {
        setError("Por favor, ingresa tu correo electrónico.");
      }
    } else {
      if (name === "Laura" && password === "123456") {
        alert("Inicio de sesión exitoso");
        navigate('/dashboard');
      } else {
        setError("Nombre o contraseña incorrectos");
      }
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Iniciar Sesión</h1>
      <p className="login-subtitle">Ingresa tus datos para continuar.</p>
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        {showForgotPassword ? (
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="name">Nombre</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </>
        )}
        <button type="submit" className="form-button">
          {showForgotPassword ? "Recuperar Contraseña" : "Iniciar Sesión"}
        </button>
      </form>
      <div className="form-footer">
        {showForgotPassword ? (
          <button
            onClick={() => {
              setShowForgotPassword(false);
              setError("");
            }}
            className="form-link"
          >
            Volver a Iniciar Sesión
          </button>
        ) : (
          <button
            onClick={() => {
              setShowForgotPassword(true);
              setError("");
            }}
            className="form-link"
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;
