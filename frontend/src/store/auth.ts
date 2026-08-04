"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UsuarioAutenticado } from "@/types";

interface AuthState {
  usuario: UsuarioAutenticado | null;
  login: (usuario: UsuarioAutenticado) => void;
  logout: () => void;
  tienePermiso: (permiso: string) => boolean;
  ultimoAcceso: string | null;
}

const COOKIE = "b21-auth";

function sincronizarCookie(activa: boolean) {
  if (typeof document === "undefined") return;
  if (activa) {
    document.cookie = `${COOKIE}=1; path=/; max-age=28800; SameSite=Lax`;
  } else {
    document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      ultimoAcceso: null,
      login: (usuario) => {
        sincronizarCookie(true);
        set({ usuario, ultimoAcceso: new Date().toISOString() });
      },
      logout: () => {
        sincronizarCookie(false);
        set({ usuario: null, ultimoAcceso: null });
      },
      tienePermiso: (permiso) => {
        const u = get().usuario;
        if (!u) return false;
        if (u.esAdmin) return true;
        return u.permisos.includes(permiso);
      },
    }),
    {
      name: "b21-auth",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return window.localStorage;
        const nada = () => {};
        return { getItem: () => null, setItem: nada, removeItem: nada } as unknown as Storage;
      }),
    },
  ),
);