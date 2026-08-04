import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, cerrarSesion, obtenerSesion, guardarSesion } from '../services/api';
import type { UsuarioAutenticado } from '../types';

interface AuthContextValue {
  usuario: UsuarioAutenticado | null;
  login: (usuario: string, password: string) => Promise<UsuarioAutenticado>;
  logout: () => void;
  tienePermiso: (permiso: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(() =>
    obtenerSesion(),
  );

  const login = useCallback(async (usuarioNombre: string, password: string) => {
    const { data } = await api.post<UsuarioAutenticado>('/auth/login', {
      usuario: usuarioNombre,
      password,
    });
    guardarSesion(data);
    setUsuario(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    cerrarSesion();
    setUsuario(null);
  }, []);

  const tienePermiso = useCallback(
    (permiso: string) => {
      if (!usuario) return false;
      if (usuario.esAdmin) return true;
      return usuario.permisos.includes(permiso);
    },
    [usuario],
  );

  const value = useMemo(
    () => ({ usuario, login, logout, tienePermiso }),
    [usuario, login, logout, tienePermiso],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
