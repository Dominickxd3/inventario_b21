"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

export default function B21MetricCard({
  label,
  valor,
  icono,
  tono = "#8B0000",
  detalle,
}: {
  label: string;
  valor: ReactNode;
  icono: ReactNode;
  tono?: string;
  detalle?: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: "#fff",
        border: "1px solid",
        borderColor: "rgba(0,0,0,0.06)",
        borderRadius: 3,
        p: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        transition: "box-shadow 0.2s, transform 0.15s",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#6B7280",
          }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: `${tono}14`,
            color: tono,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icono}
        </Box>
      </Box>
      <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color: "#111827", lineHeight: 1 }}>
        {valor}
      </Typography>
      {detalle && (
        <Typography sx={{ fontSize: "0.72rem", color: "#9CA3AF" }}>
          {detalle}
        </Typography>
      )}
    </Box>
  );
}
