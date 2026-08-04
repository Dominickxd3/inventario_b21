import type { ReactNode } from "react";

export const ESTADO_COLORS: Record<string, { bg: string; color: string }> = {
  Nuevo: { bg: "#E8F0FE", color: "#1A56DB" },
  Operativo: { bg: "#E3F5E9", color: "#1E7A43" },
  Averiado: { bg: "#FDE8E8", color: "#B42318" },
  Mantenimiento: { bg: "#FEF3C7", color: "#92400E" },
  Prestado: { bg: "#F3E8FF", color: "#6B21A8" },
  "Dado de baja": { bg: "#F3F4F6", color: "#4B5563" },
  "No localizado": { bg: "#FFF1F2", color: "#9F1239" },
  "En evaluación": { bg: "#E0F2FE", color: "#075985" },
};

export function coloresEstado(nombre: string | null | undefined): { bg: string; color: string } {
  if (!nombre) return { bg: "#F3F4F6", color: "#4B5563" };
  return ESTADO_COLORS[nombre] ?? { bg: "#F3F4F6", color: "#4B5563" };
}

export function EstadoChip({ nombre }: { nombre: string | null | undefined }) {
  const c = coloresEstado(nombre);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: "0.7rem",
        fontWeight: 600,
        backgroundColor: c.bg,
        color: c.color,
        whiteSpace: "nowrap",
      }}
    >
      {nombre ?? "—"}
    </span>
  );
}

export function EstadoTipo({ tipo }: { tipo: string | null | undefined }): ReactNode {
  if (!tipo) return null;
  const c =
    tipo === "PRESTADO"
      ? { bg: "#F3E8FF", color: "#6B21A8" }
      : tipo === "DEVUELTO"
        ? { bg: "#E3F5E9", color: "#1E7A43" }
        : tipo === "EN_PROCESO"
          ? { bg: "#FEF3C7", color: "#92400E" }
          : tipo === "FINALIZADO"
            ? { bg: "#E3F5E9", color: "#1E7A43" }
            : { bg: "#F3F4F6", color: "#4B5563" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: "0.7rem",
        fontWeight: 600,
        backgroundColor: c.bg,
        color: c.color,
        whiteSpace: "nowrap",
      }}
    >
      {tipo}
    </span>
  );
}