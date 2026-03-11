import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { authService, type LoginPayload, type RegisterPayload } from "@/services/authService";

interface DecodedToken {
  sub: string;
  name: string;
  email: string;
  exp: number;
}

interface AuthState {
  token: string | null;
  user: { name: string; email: string } | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
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
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeAndValidateToken(token);
      if (decoded) {
        return {
          token,
          user: { name: decoded.name, email: decoded.email },
          isAuthenticated: true,
        };
      }
      localStorage.removeItem("token");
    }
    return { token: null, user: null, isAuthenticated: false };
  });

  const setAuth = useCallback((token: string) => {
    const decoded = decodeAndValidateToken(token);
    if (!decoded) throw new Error("Invalid token");
    localStorage.setItem("token", token);
    setState({
      token,
      user: { name: decoded.name, email: decoded.email },
      isAuthenticated: true,
    });
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { token } = await authService.login(payload);
    setAuth(token);
  }, [setAuth]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { token } = await authService.register(payload);
    setAuth(token);
  }, [setAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setState({ token: null, user: null, isAuthenticated: false });
  }, []);

  // Check token expiry periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = decodeAndValidateToken(token);
        if (!decoded) logout();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
