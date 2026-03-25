import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import './Login.css';

const Login = () => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [flow, setFlow] = useState<'login' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));

  const getErrorData = (err: unknown) => {
    const maybeErr = err as {
      response?: { status?: number; data?: { message?: string } };
      code?: string;
      message?: string;
    };
    return {
      status: maybeErr?.response?.status,
      apiMessage: maybeErr?.response?.data?.message,
      isNetwork: !maybeErr?.response && (maybeErr?.code === 'ERR_NETWORK' || maybeErr?.message === 'Network Error'),
      fallback: maybeErr?.message || 'Ocurrió un error',
    };
  };

  const mapAuthErrorMessage = (err: unknown) => {
    const info = getErrorData(err);
    if (info.isNetwork) return 'No se pudo conectar al servidor. Si quieres probar sin backend, usa `pnpm run dev:mock`.';
    if (info.status === 400) return info.apiMessage || 'Datos inválidos. Revisa la información e intenta de nuevo.';
    if (info.status === 401) return info.apiMessage || 'Credenciales incorrectas';
    if (info.status === 403) return 'No autorizado para realizar esta acción.';
    if (info.status === 404) return 'Ruta no encontrada en el servidor.';
    if (info.status === 409) return info.apiMessage || 'Conflicto de datos.';
    if (info.status === 429)
      return info.apiMessage || 'Demasiadas solicitudes de autenticacion. Intenta de nuevo en 1 minuto.';
    if (info.status === 503 || info.status === 504) return 'Servicio no disponible temporalmente. Intenta más tarde.';
    return info.apiMessage || info.fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await login({ user, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(mapAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (cooldownSeconds > 0) return;

    const cleanedUser = user.trim();
    if (!cleanedUser) {
      setError('Ingresa tu nombre de usuario en el campo Usuario para recuperar la contraseña.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await authService.forgotPassword({ user: cleanedUser });
      if (!response.token) {
        setError('No se pudo iniciar la recuperación. Intenta nuevamente.');
        return;
      }
      setResetToken(response.token);
      setFlow('reset');
      setSuccess('Verificación iniciada. Ahora puedes cambiar tu contraseña.');
    } catch (err: unknown) {
      const info = getErrorData(err);
      if (info.status === 429) {
        setCooldownUntil(Date.now() + 60_000);
      }
      setError(mapAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    const token = resetToken.trim();
    if (!token) {
      setError('No hay una verificación activa. Presiona "Olvidé mi contraseña" nuevamente.');
      return;
    }

    if (resetPassword.length < 8 || resetPassword.length > 15) {
      setError('La nueva contraseña debe tener entre 8 y 15 caracteres');
      return;
    }

    if (resetPassword !== resetConfirm) {
      setError('La nueva contraseña y la confirmación no coinciden');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await authService.resetPassword({ token, password: resetPassword });
      setFlow('login');
      setResetPassword('');
      setResetConfirm('');
      setResetToken('');
      setSuccess('Password updated. Inicia sesión con tu nueva contraseña.');
    } catch (err: unknown) {
      const info = getErrorData(err);
      if (info.status === 429) {
        setCooldownUntil(Date.now() + 60_000);
      }
      setError(mapAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-14">
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-6 py-4">
        <div className="auth-lannister-layout">
          <div className="lannister-logo-panel" aria-hidden="true">
            <img src="/houses/lannister.png" alt="Casa Lannister" className="lannister-logo-left" />
          </div>

          <div className="login-container lannister-panel">
          <div className="house-wordmark">TASKFLOW</div>
          <h1 className="login-title">Iniciar Sesión</h1>
          <p className="login-subtitle">
            {flow === 'login' && 'Ingresa tus datos para continuar.'}
            {flow === 'reset' && 'Define una nueva contraseña para tu usuario.'}
          </p>
          {error && <div className="login-error">{error}</div>}
          {success && <div className="text-center text-sm text-emerald-600 mb-3">{success}</div>}

          {flow === 'login' && <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="user">Nombre de usuario</label>
              <input
                type="text"
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
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
            <button type="submit" className="form-button" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>}

          {flow === 'reset' && <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="reset-user">Usuario</label>
              <input
                type="text"
                id="reset-user"
                value={user}
                className="form-input"
                readOnly
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="reset-password">Nueva contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="reset-password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="form-input"
                minLength={8}
                maxLength={15}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reset-confirm">Confirmar contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="reset-confirm"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                className="form-input"
                minLength={8}
                maxLength={15}
                required
              />
            </div>
            <div className="form-group">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <button type="submit" className="form-button" disabled={loading || cooldownSeconds > 0}>
              {loading ? 'Actualizando...' : cooldownSeconds > 0 ? `Reintentar en ${cooldownSeconds}s` : 'Actualizar contraseña'}
            </button>
          </form>}

          <div className="text-center mt-3">
            {flow === 'login' && (
              <button onClick={handleForgotPassword} className="text-sm text-primary hover:underline" disabled={loading || cooldownSeconds > 0}>
                Olvidé mi contraseña
              </button>
            )}
            {flow === 'reset' && (
              <button onClick={() => { setFlow('login'); setResetToken(''); setError(''); }} className="text-sm text-primary hover:underline">
                Volver al login
              </button>
            )}
          </div>

          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">¿No tienes cuenta? </span>
            <button onClick={() => navigate('/register')} className="text-sm text-blue-600 hover:underline">
              Regístrate
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;