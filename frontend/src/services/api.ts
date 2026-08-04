import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

const TOKEN_KEY = "b21_token";
const SESION_KEY = "b21_sesion";

export function guardarToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function obtenerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function guardarSesion(sesion: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
}

export function obtenerSesion() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function cerrarSesion() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESION_KEY);
  document.cookie = "b21-auth=; path=/; max-age=0; SameSite=Lax";
}

api.interceptors.request.use((config) => {
  const token = obtenerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.startsWith("/login")) {
        cerrarSesion();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function obtenerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string") return msg;
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}