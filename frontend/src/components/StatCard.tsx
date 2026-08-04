import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  label,
  valor,
  icono,
  tono = "#8B0000",
  tendencia,
}: {
  label: string;
  valor: ReactNode;
  icono: ReactNode;
  tono?: string;
  tendencia?: { texto: string; tipo: boolean };
}) {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: "16px 18px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#374151",
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#111827", lineHeight: 1 }}>
          {valor}
        </div>
        {tendencia && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "0.74rem",
              marginTop: 8,
              color: tendencia.tipo ? "#1E7A43" : "#B42318",
            }}
          >
            {tendencia.tipo ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            <span>{tendencia.texto}</span>
          </div>
        )}
      </div>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          backgroundColor: `${tono}14`,
          color: tono,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icono}
      </div>
    </div>
  );
}