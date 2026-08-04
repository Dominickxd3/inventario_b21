"use client";

import { useAuthStore } from "@/store/auth";

export function usePermiso(permiso: string): boolean {
  return useAuthStore((s) => s.tienePermiso(permiso));
}

export function useEsAdmin(): boolean {
  return useAuthStore((s) => s.usuario?.esAdmin ?? false);
}