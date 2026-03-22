import axios from 'axios';
import { getToken, setToken } from '@/lib/tokenStore';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.tasksflowcenter.online';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // necesario para enviar/recibir cookies HttpOnly (refresh token)
});

// Interceptor para añadir el token a cada petición
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar 401 (token expirado) y refrescar
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const url: string = String(originalRequest?.url || '');
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        // Llamada directa a refresh sin usar el interceptor (nueva instancia)
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { access_token } = refreshResponse.data;
        setToken(access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        setToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;