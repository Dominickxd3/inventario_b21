import axios from 'axios';

const TOKEN_KEY = 'b21_token';
const USER_KEY = 'b21_user';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url ?? '';
      if (!url.includes('/auth/login')) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export function guardarSesion(data: {
  token: string;
  idUsuario: number;
  idSesion: number;
  usuario: string;
  nombreCompleto: string;
  codigoBombero: string | null;
  rol: string | null;
  roles: string[];
  permisos: string[];
  esAdmin: boolean;
}) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
}

export function obtenerSesion() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function obtenerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (Array.isArray(data?.message)) {
      return data!.message![0];
    }
    if (typeof data?.message === 'string') {
      return data.message;
    }
    return data?.message ?? error.message;
  }
  return 'Error inesperado.';
}
