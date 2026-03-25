import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authService, LoginPayload, RegisterPayload } from '@/services/authService';
import { setToken as setGlobalToken } from '@/lib/tokenStore';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Intento de refresh al montar la app (por si hay cookie válida)
  useEffect(() => {
    const attemptRefresh = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const refresh = await authService.refresh();
        setGlobalToken(refresh.access_token);

        setState({ token: refresh.access_token, user: null, isAuthenticated: true, isLoading: true });

        try {
          const me = await authService.getMe();
          const user = me?.user;
          if (user) {
            setState({
              token: refresh.access_token,
              user: { id: user.sub, name: user.name ?? user.user, email: user.email, phone: user.phone },
              isAuthenticated: true,
              isLoading: true,
            });
          }
        } catch {
          // Si /auth/me falla, igual dejamos la sesión rehidratada con token.
        }
      } catch {
        // No hay sesión activa
        setGlobalToken(null);
        setState({ token: null, user: null, isAuthenticated: false, isLoading: true });
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    attemptRefresh();
  }, []);

  const setAuth = useCallback((response: { access_token: string; user_id: string; email: string; user: string; phone?: string }) => {
    setGlobalToken(response.access_token);
    setState({
      token: response.access_token,
      user: { id: response.user_id, name: response.user, email: response.email, phone: response.phone },
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const clearAuth = useCallback(() => {
    setGlobalToken(null);
    setState({ token: null, user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      return { ...prev, user: { ...prev.user, ...updates } };
    });
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    setAuth(response);
  }, [setAuth]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    setAuth(response);
  }, [setAuth]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}