"use client";

import { Box, Typography } from "@mui/material";

const COLORS: Record<string, string> = {
  Operativo: "#1B5E20",
  Mantenimiento: "#E65100",
  "En Mantenimiento": "#E65100",
  Averiado: "#B71C1C",
  Prestado: "#0D47A1",
  Baja: "#546E7A",
};

export default function AssetStatusWidget({
  estados,
  total,
}: {
  estados: { Estado: string; Cantidad: number }[];
  total: number;
}) {
  if (!estados || estados.length === 0 || total === 0) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {estados.map((e) => {
        const pct = Math.round((e.Cantidad / total) * 100);
        const color = COLORS[e.Estado] ?? "#9CA3AF";
        return (
          <Box key={e.Estado}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#374151" }}>
                {e.Estado}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#111827" }}>
                {e.Cantidad} ({pct}%)
              </Typography>
            </Box>
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: "#F1F2F5",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${pct}%`,
                  borderRadius: 3,
                  bgcolor: color,
                  transition: "width 0.6s ease",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
