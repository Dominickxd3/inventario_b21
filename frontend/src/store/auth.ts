"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UsuarioAutenticado } from "@/types";

interface AuthState {
  usuario: UsuarioAutenticado | null;
  login: (usuario: UsuarioAutenticado) => void;
  logout: () => void;
  tienePermiso: (permiso: string) => boolean;
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
      login: (usuario) => {
        sincronizarCookie(true);
        set({ usuario });
      },
      logout: () => {
        sincronizarCookie(false);
        set({ usuario: null });
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
    },
  ),
);