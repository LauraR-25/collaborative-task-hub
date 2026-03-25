import api from './api';
import { loadJson, nowIso, randomId, removeKey, saveJson } from '@/lib/mockStorage';

const USE_MOCK = import.meta.env.MODE === 'mock' || import.meta.env.VITE_MOCK_API === 'true';

export interface LoginPayload {
  user: string;        // IMPORTANTE: el backend usa "user" como nombre de usuario
  password: string;
}

export interface RegisterPayload {
  user: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponse {
  access_token: string;
  user_id: string;
  email: string;
  user: string;
  phone: string;
}

export interface RefreshResponse {
  access_token: string;
}

export interface ForgotPasswordPayload {
  user: string;
}

export interface ForgotPasswordResponse {
  token: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

type MockUser = {
  id: string;
  user: string;
  email: string;
  phone: string;
  bio?: string;
  password: string;
  created_at: string;
};

const MOCK_KEYS = {
  users: 'mock_users',
  currentUserId: 'mock_current_user_id',
  token: 'mock_access_token',
  resetTokens: 'mock_reset_tokens',
};

type MockResetToken = {
  token: string;
  userId: string;
  created_at: string;
};

const seedIfNeeded = () => {
  const users = loadJson<MockUser[]>(MOCK_KEYS.users, []);
  if (users.length > 0) return;

  const demo: MockUser = {
    id: 'user_1',
    user: 'demo',
    email: 'demo@taskflow.local',
    phone: '+584141112233',
    password: '12345678',
    created_at: nowIso(),
  };
  saveJson(MOCK_KEYS.users, [demo]);
  saveJson(MOCK_KEYS.currentUserId, demo.id);
  saveJson(MOCK_KEYS.token, `mock_${demo.id}_${Date.now()}`);
};

const getCurrentUser = (): MockUser | null => {
  seedIfNeeded();
  const id = loadJson<string | null>(MOCK_KEYS.currentUserId, null);
  if (!id) return null;
  const users = loadJson<MockUser[]>(MOCK_KEYS.users, []);
  return users.find((u) => u.id === id) || null;
};

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    if (USE_MOCK) {
      seedIfNeeded();
      const users = loadJson<MockUser[]>(MOCK_KEYS.users, []);
      const found = users.find((u) => u.user === payload.user);
      if (!found || found.password !== payload.password) {
        throw new Error('Credenciales incorrectas');
      }

      saveJson(MOCK_KEYS.currentUserId, found.id);
      const token = `mock_${found.id}_${Date.now()}`;
      saveJson(MOCK_KEYS.token, token);
      return { access_token: token, user_id: found.id, email: found.email, user: found.user, phone: found.phone };
    }
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    if (USE_MOCK) {
      seedIfNeeded();
      const users = loadJson<MockUser[]>(MOCK_KEYS.users, []);
      const exists = users.some((u) => u.user === payload.user || u.email === payload.email || u.phone === payload.phone);
      if (exists) throw new Error('El usuario, email o teléfono ya existe');

      const created: MockUser = {
        id: randomId('user'),
        user: payload.user,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        created_at: nowIso(),
      };
      saveJson(MOCK_KEYS.users, [created, ...users]);
      saveJson(MOCK_KEYS.currentUserId, created.id);
      const token = `mock_${created.id}_${Date.now()}`;
      saveJson(MOCK_KEYS.token, token);
      return { access_token: token, user_id: created.id, email: created.email, user: created.user, phone: created.phone };
    }
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  refresh: async (): Promise<RefreshResponse> => {
    if (USE_MOCK) {
      seedIfNeeded();
      const token = loadJson<string | null>(MOCK_KEYS.token, null);
      const current = getCurrentUser();
      if (!token || !current) throw new Error('No hay sesión');
      return { access_token: token };
    }
    const { data } = await api.post<RefreshResponse>('/auth/refresh');
    return data;
  },

  logout: async (): Promise<void> => {
    if (USE_MOCK) {
      removeKey(MOCK_KEYS.currentUserId);
      removeKey(MOCK_KEYS.token);
      return;
    }
    await api.post('/auth/logout');
  },

  getMe: async (): Promise<{ user: { sub: string; user: string; name: string; email: string; phone?: string; bio?: string } }> => {
    if (USE_MOCK) {
      const current = getCurrentUser();
      if (!current) throw new Error('No hay sesión');
      return {
        user: {
          sub: current.id,
          user: current.user,
          name: current.user,
          email: current.email,
          phone: current.phone,
          bio: current.bio,
        },
      };
    }

    try {
      const { data } = await api.get('/users/me');
      const u = data?.user;
      if (u)
        return {
          user: {
            sub: u.id,
            user: u.user ?? u.name,
            name: u.user ?? u.name,
            email: u.email,
            phone: u.phone,
            bio: u.bio,
          },
        };
    } catch {
      // fallback
    }

    const { data } = await api.get('/auth/me');
    return data;
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> => {
    if (USE_MOCK) {
      seedIfNeeded();
      const users = loadJson<MockUser[]>(MOCK_KEYS.users, []);
      const found = users.find((u) => u.user === payload.user);

      const token = randomId('reset');
      if (found) {
        const tokens = loadJson<MockResetToken[]>(MOCK_KEYS.resetTokens, []);
        const next = [{ token, userId: found.id, created_at: nowIso() }, ...tokens].slice(0, 20);
        saveJson(MOCK_KEYS.resetTokens, next);
      }

      return { token };
    }

    const { data } = await api.post<ForgotPasswordResponse>('/auth/forgot-password', payload);
    return data;
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<ResetPasswordResponse> => {
    if (USE_MOCK) {
      seedIfNeeded();
      if (payload.password.length < 8 || payload.password.length > 15) {
        throw new Error('La nueva contraseña debe tener entre 8 y 15 caracteres');
      }

      const tokens = loadJson<MockResetToken[]>(MOCK_KEYS.resetTokens, []);
      const reset = tokens.find((t) => t.token === payload.token);
      if (!reset) {
        const err: any = new Error('Token inválido o expirado');
        err.response = { status: 400, data: { message: 'Token invalido o expirado' } };
        throw err;
      }

      const users = loadJson<MockUser[]>(MOCK_KEYS.users, []);
      const nextUsers = users.map((u) => (u.id === reset.userId ? { ...u, password: payload.password } : u));
      saveJson(MOCK_KEYS.users, nextUsers);
      saveJson(
        MOCK_KEYS.resetTokens,
        tokens.filter((t) => t.token !== payload.token)
      );

      return { message: 'Password updated' };
    }

    const { data } = await api.post<ResetPasswordResponse>('/auth/reset-password', payload);
    return data;
  },
};