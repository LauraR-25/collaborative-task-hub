import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');
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
      await register({ user, email, password });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Register error:', err);
      const apiMessage = err?.response?.data?.message;
      const status = err?.response?.status;
      const isNetwork = !err?.response && (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error');

      if (isNetwork) {
        setError('No se pudo conectar al servidor. Si quieres probar sin backend, usa `pnpm run dev:mock`.' );
        return;
      }

      if (status === 409) {
        setError(apiMessage || 'El correo ya está registrado');
        return;
      }

      setError(apiMessage || err?.message || 'Error al registrarse');
    }
  };

  return (
    <div className="pt-14">
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-6">
        <div className="max-w-md w-full mx-auto p-6 bg-white rounded shadow">
          <h1 className="text-2xl font-bold text-center mb-4">Crear cuenta</h1>
          <p className="text-center text-gray-600 mb-6">Regístrate para comenzar a gestionar tus tareas.</p>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                Nombre de usuario
              </label>
              <input
                type="text"
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-24"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:underline"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
              Crear cuenta
            </button>
          </form>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">¿Ya tienes cuenta? </span>
            <button onClick={() => navigate('/login')} className="text-sm text-blue-600 hover:underline">
              Inicia Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;