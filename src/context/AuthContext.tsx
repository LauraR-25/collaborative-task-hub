import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService, LoginPayload, RegisterPayload } from '@/services/authService';
import { setToken as setGlobalToken } from '@/lib/tokenStore';

interface DecodedToken {
  sub: string;
  name: string;
  email: string;
  exp: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeAndValidateToken(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
  });

  // Intento de refresh al montar la app (por si hay cookie válida)
  useEffect(() => {
    const attemptRefresh = async () => {
      try {
        const { access_token } = await authService.refresh();
        setAuth(access_token);
      } catch {
        // No hay sesión activa
      }
    };
    attemptRefresh();
  }, []);

  const setAuth = useCallback((token: string) => {
    const decoded = decodeAndValidateToken(token);
    if (!decoded) throw new Error('Token inválido');
    setGlobalToken(token);
    setState({
      token,
      user: { id: decoded.sub, name: decoded.name, email: decoded.email },
      isAuthenticated: true,
    });
  }, []);

  const clearAuth = useCallback(() => {
    setGlobalToken(null);
    setState({ token: null, user: null, isAuthenticated: false });
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    setAuth(response.access_token);
  }, [setAuth]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    setAuth(response.access_token);
  }, [setAuth]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}