import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { mapRegisterConflictMessageEs } from '@/lib/apiErrorMessages';

const Register = () => {
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return;
      }

      const normalizedPhone = phone.replace(/[\s().-]/g, '');
      if (!/^\+?[0-9]{7,20}$/.test(normalizedPhone)) {
        setError('El teléfono debe tener un formato válido (ej: +584141112233)');
        return;
      }

      await register({ user, email, password, phone: normalizedPhone });
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('Register error:', err);
      const maybeErr = err as { response?: { data?: { message?: string }; status?: number }; code?: string; message?: string };
      const apiMessage = maybeErr?.response?.data?.message;
      const status = maybeErr?.response?.status;
      const isNetwork = !maybeErr?.response && (maybeErr?.code === 'ERR_NETWORK' || maybeErr?.message === 'Network Error');

      if (isNetwork) {
        setError('No se pudo conectar al servidor. Si quieres probar sin backend, usa `pnpm run dev:mock`.' );
        return;
      }

      if (status === 409) {
        setError(mapRegisterConflictMessageEs(apiMessage));
        return;
      }

      setError(apiMessage || maybeErr?.message || 'Error al registrarse');
    }
  };

  return (
    <div className="pt-14">
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-6">
        <div className="lannister-panel max-w-md w-full mx-auto p-6 bg-surface rounded shadow-[var(--shadow-slab-lg)] border border-border">
          <img src="/houses/lannister.png" alt="Casa Lannister" className="house-logo" />
          <div className="house-wordmark">TASKFLOW</div>
          <h1 className="text-2xl font-bold text-center mb-4 text-foreground">Crear cuenta</h1>
          <p className="text-center text-muted-foreground mb-6">Regístrate para comenzar a gestionar tus tareas.</p>
          {error && (
            <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="user" className="block text-sm font-medium text-foreground">
                Nombre de usuario
              </label>
              <input
                type="text"
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="mt-1 block w-full border border-input rounded-md bg-background text-foreground p-2"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-input rounded-md bg-background text-foreground p-2"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full border border-input rounded-md bg-background text-foreground p-2"
                placeholder="+584141112233"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full border border-input rounded-md bg-background text-foreground p-2 pr-24"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:underline"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md transition-colors hover:bg-primary/90"
            >
              Crear cuenta
            </button>
          </form>
          <div className="text-center mt-4">
            <span className="text-sm text-muted-foreground">¿Ya tienes cuenta? </span>
            <button onClick={() => navigate('/login')} className="text-sm text-primary hover:underline">
              Inicia Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;