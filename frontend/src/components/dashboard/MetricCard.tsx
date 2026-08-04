"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

export default function MetricCard({
  label,
  valor,
  icono,
  tono = "#8B0000",
  detalle,
}: {
  label: string;
  valor: number;
  icono: ReactNode;
  tono?: string;
  detalle?: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 3,
        p: "18px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.06)" },
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2.5,
          bgcolor: `${tono}14`,
          color: tono,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icono}
      </Box>
      <Box>
        <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", lineHeight: 1 }}>
          {valor}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#374151", lineHeight: 1.3 }}>
          {label}
        </Typography>
        {detalle && (
          <Typography sx={{ fontSize: "0.65rem", color: "#9CA3AF", mt: 0.2 }}>
            {detalle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
