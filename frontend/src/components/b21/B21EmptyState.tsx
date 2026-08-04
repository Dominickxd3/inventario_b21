"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { PackageOpen } from "lucide-react";

export default function B21EmptyState({
  icono,
  titulo = "Sin información disponible",
  descripcion,
  accion,
}: {
  icono?: ReactNode;
  titulo?: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 3,
        color: "#9CA3AF",
      }}
    >
      <Box sx={{ mb: 2, opacity: 0.5 }}>
        {icono ?? <PackageOpen size={44} />}
      </Box>
      <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#6B7280", mb: 0.5 }}>
        {titulo}
      </Typography>
      {descripcion && (
        <Typography sx={{ fontSize: "0.8rem", color: "#9CA3AF", mb: 2, textAlign: "center", maxWidth: 320 }}>
          {descripcion}
        </Typography>
      )}
      {accion}
    </Box>
  );
}
