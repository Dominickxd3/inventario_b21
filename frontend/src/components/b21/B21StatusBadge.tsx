"use client";

const PALETA: Record<string, { bg: string; color: string }> = {
  "operativo": { bg: "#E8F5E9", color: "#1B5E20" },
  "en mantenimiento": { bg: "#FFF3E0", color: "#E65100" },
  "mantenimiento": { bg: "#FFF3E0", color: "#E65100" },
  "averiado": { bg: "#FFEBEE", color: "#B71C1C" },
  "prestado": { bg: "#E3F2FD", color: "#0D47A1" },
  "baja": { bg: "#ECEFF1", color: "#546E7A" },
  "activo": { bg: "#E8F5E9", color: "#1B5E20" },
  "en proceso": { bg: "#FFF3E0", color: "#E65100" },
  "en_proceso": { bg: "#FFF3E0", color: "#E65100" },
  "finalizado": { bg: "#E8F5E9", color: "#1B5E20" },
  "registrado": { bg: "#F3E5F5", color: "#6A1B9A" },
  "devuelto": { bg: "#E8F5E9", color: "#1B5E20" },
  "eliminado": { bg: "#ECEFF1", color: "#546E7A" },
};

export default function B21StatusBadge({
  estado,
  size = "md",
}: {
  estado?: string;
  size?: "sm" | "md";
}) {
  const normalizado = (estado ?? "").toLowerCase().trim();
  const paleta = PALETA[normalizado] ?? PALETA[normalizado.replace(/_/g, " ")] ?? { bg: "#F1F2F5", color: "#546E7A" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: size === "sm" ? "2px 8px" : "3px 10px",
        borderRadius: 6,
        fontSize: size === "sm" ? "0.68rem" : "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        backgroundColor: paleta.bg,
        color: paleta.color,
        whiteSpace: "nowrap",
        lineHeight: 1.5,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: paleta.color,
          flexShrink: 0,
        }}
      />
      {estado ?? "—"}
    </span>
  );
}
