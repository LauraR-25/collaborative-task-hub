import api from './api';
import { loadJson, nowIso, randomId, removeKey, saveJson } from '@/lib/mockStorage';
import { MOCK_KEYS as CORE_KEYS, USE_MOCK, mockRequireUserId, mockSeedIfNeeded } from '@/lib/mockData';

export interface Profile {
  id: string;
  user: string;
  email: string;
  bio?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceSession {
  id: string;
  device: string;
  ip: string;
  last_active: string;
  current: boolean;
}

type StoredMockUser = {
  id: string;
  user?: string; // username
  name?: string; // nombre real
  email: string;
  bio?: string;
  phone?: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
};

const SESSION_KEYS = {
  currentSessionId: 'mock_current_session_id',
  sessionsByUserId: 'mock_sessions_by_user_id',
};

const mockGetCurrentUser = (): StoredMockUser => {
  mockSeedIfNeeded();
  const userId = mockRequireUserId();
  const users = loadJson<StoredMockUser[]>(CORE_KEYS.users, []);
  const found = users.find((u) => u.id === userId);
  if (!found) throw new Error('No hay sesión activa');
  return found;
};

const mockEnsureSessionsSeeded = (userId: string) => {
  const sessionsByUserId = loadJson<Record<string, DeviceSession[]>>(SESSION_KEYS.sessionsByUserId, {});
  if (Array.isArray(sessionsByUserId[userId]) && sessionsByUserId[userId].length > 0) return;

  const sessionId = randomId('sess');
  saveJson(SESSION_KEYS.currentSessionId, sessionId);

  sessionsByUserId[userId] = [
    {
      id: sessionId,
      device: 'Windows - Chrome',
      ip: 'Caracas, Venezuela',
      last_active: nowIso(),
      current: true,
    },
    {
      id: randomId('sess'),
      device: 'Android - App',
      ip: 'Caracas, Venezuela',
      last_active: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      current: false,
    },
  ];
  saveJson(SESSION_KEYS.sessionsByUserId, sessionsByUserId);
};

const featureUnavailable = () => {
  const err: any = new Error('Próximamente');
  err.code = 'FEATURE_UNAVAILABLE';
  throw err;
};

export const profileService = {
  getProfile: async (): Promise<Profile> => {
    if (!USE_MOCK) {
      const { data } = await api.get('/users/me');
      const u = data.user;
      return {
        id: u.id,
        user: u.user ?? u.name,
        email: u.email,
        phone: u.phone,
        bio: u.bio ?? '',
        created_at: u.created_at,
        updated_at: u.updated_at,
      };
    }

    const user = mockGetCurrentUser();
    const created_at = user.created_at || nowIso();
    const updated_at = user.updated_at || created_at;
    return {
      id: user.id,
      user: user.user || user.name || 'demo',
      email: user.email,
      bio: user.bio,
      phone: user.phone,
      created_at,
      updated_at,
    };
  },

  updateProfile: async (updates: Partial<Pick<Profile, 'bio' | 'phone'>>): Promise<Profile> => {
    const payload: Record<string, unknown> = {};
    if (typeof updates.bio === 'string') payload.bio = updates.bio;
    if (typeof updates.phone === 'string') payload.phone = updates.phone;
    if (Object.keys(payload).length === 0) throw new Error('Debes modificar al menos un campo');

    if (!USE_MOCK) {
      const { data } = await api.patch('/users/me', payload);
      return data.user;
    }

    const current = mockGetCurrentUser();
    const users = loadJson<StoredMockUser[]>(CORE_KEYS.users, []);
    const nextUsers = users.map((u) =>
      u.id === current.id
        ? {
            ...u,
            ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
            ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
            updated_at: nowIso(),
          }
        : u
    );
    saveJson(CORE_KEYS.users, nextUsers);

    const updated = nextUsers.find((u) => u.id === current.id)!;
    const created_at = updated.created_at || nowIso();
    const updated_at = updated.updated_at || created_at;
    return {
      id: updated.id,
      user: updated.user || updated.name || 'demo',
      email: updated.email,
      bio: updated.bio,
      phone: updated.phone,
      created_at,
      updated_at,
    };
  },

  changePassword: async (input: { current_password: string; new_password: string }): Promise<void> => {
    if (!USE_MOCK) featureUnavailable();

    const current = mockGetCurrentUser();
    if (current.password !== input.current_password) throw new Error('La contraseña actual no es correcta');
    if (input.new_password.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres');

    const users = loadJson<StoredMockUser[]>(CORE_KEYS.users, []);
    const nextUsers = users.map((u) => (u.id === current.id ? { ...u, password: input.new_password } : u));
    saveJson(CORE_KEYS.users, nextUsers);
  },

  listSessions: async (): Promise<DeviceSession[]> => {
    if (!USE_MOCK) featureUnavailable();

    const current = mockGetCurrentUser();
    mockEnsureSessionsSeeded(current.id);
    const sessionsByUserId = loadJson<Record<string, DeviceSession[]>>(SESSION_KEYS.sessionsByUserId, {});
    return sessionsByUserId[current.id] || [];
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    if (!USE_MOCK) featureUnavailable();

    const current = mockGetCurrentUser();
    mockEnsureSessionsSeeded(current.id);

    const sessionsByUserId = loadJson<Record<string, DeviceSession[]>>(SESSION_KEYS.sessionsByUserId, {});
    const sessions = sessionsByUserId[current.id] || [];

    const currentSessionId = loadJson<string | null>(SESSION_KEYS.currentSessionId, null);
    if (sessionId === currentSessionId) throw new Error('No puedes cerrar la sesión actual desde aquí');

    sessionsByUserId[current.id] = sessions.filter((s) => s.id !== sessionId);
    saveJson(SESSION_KEYS.sessionsByUserId, sessionsByUserId);
  },

  revokeRemoteSessions: async (): Promise<void> => {
    if (!USE_MOCK) featureUnavailable();

    const current = mockGetCurrentUser();
    mockEnsureSessionsSeeded(current.id);

    const sessionsByUserId = loadJson<Record<string, DeviceSession[]>>(SESSION_KEYS.sessionsByUserId, {});
    const sessions = sessionsByUserId[current.id] || [];
    sessionsByUserId[current.id] = sessions.filter((s) => s.current);
    saveJson(SESSION_KEYS.sessionsByUserId, sessionsByUserId);
  },

  deleteAccount: async (): Promise<void> => {
    if (!USE_MOCK) featureUnavailable();

    const current = mockGetCurrentUser();
    const users = loadJson<StoredMockUser[]>(CORE_KEYS.users, []);
    saveJson(
      CORE_KEYS.users,
      users.filter((u) => u.id !== current.id)
    );

    const sessionsByUserId = loadJson<Record<string, DeviceSession[]>>(SESSION_KEYS.sessionsByUserId, {});
    delete sessionsByUserId[current.id];
    saveJson(SESSION_KEYS.sessionsByUserId, sessionsByUserId);

    removeKey(CORE_KEYS.currentUserId);
    removeKey(SESSION_KEYS.currentSessionId);
    removeKey(CORE_KEYS.token);
  },
};
