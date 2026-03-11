import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ name, email, password });
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface p-8 shadow-[var(--shadow-slab)]">
        <h1 className="mb-2 font-heading text-2xl font-semibold text-foreground">
          Crear cuenta
        </h1>
        <p className="mb-8 font-body text-muted-foreground">
          Regístrate para comenzar a gestionar tus tareas.
        </p>

        {error && (
          <div className="mb-4 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-1 block font-heading text-sm font-medium text-foreground">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-input bg-surface px-3 py-2 font-body text-foreground outline-none transition-colors focus:border-primary"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block font-heading text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-input bg-surface px-3 py-2 font-body text-foreground outline-none transition-colors focus:border-primary"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block font-heading text-sm font-medium text-foreground">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-input bg-surface px-3 py-2 font-body text-foreground outline-none transition-colors focus:border-primary"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center bg-primary px-4 py-2.5 font-heading text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-2 w-2 rounded-full bg-primary-foreground animate-heartbeat" />
            ) : (
              "Crear cuenta"
            )}
          </button>
        </form>

        <p className="mt-6 text-center font-body text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-primary font-heading font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
