import api from './api';

export interface LoginPayload {
  user: string;        // IMPORTANTE: el backend usa "user" como nombre de usuario
  password: string;
}

export interface RegisterPayload {
  user: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user_id: string;
  email: string;
  user: string;
}

export interface RefreshResponse {
  access_token: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  refresh: async (): Promise<RefreshResponse> => {
    const { data } = await api.post<RefreshResponse>('/auth/refresh');
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getMe: async (): Promise<{ user: any }> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};