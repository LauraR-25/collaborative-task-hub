import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [name, setName] = useState(''); // Cambiado de email a name
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await login({ name, password }); // Envía name, no email
      navigate('/dashboard');
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || 'Credenciales incorrectas');
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Iniciar Sesión</h1>
      <p className="login-subtitle">Ingresa tus datos para continuar.</p>
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nombre de usuario</label>
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
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input form-input--with-toggle"
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
        <button type="submit" className="form-button">Iniciar Sesión</button>
      </form>
      <div className="text-center mt-4">
        <span className="text-sm text-gray-600">¿No tienes cuenta? </span>
        <button
          onClick={() => navigate('/register')}
          className="text-sm text-blue-600 hover:underline"
        >
          Regístrate
        </button>
      </div>
    </div>
  );
};

export default Login;