"use client";

import { Box, Typography } from "@mui/material";

interface Hito {
  fecha: string;
  evento: string;
  icono?: string;
  activo?: boolean;
}

export default function B21Timeline({ hitos }: { hitos: Hito[] }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {hitos.map((h, i) => {
        const isLast = i === hitos.length - 1;
        const isActive = h.activo ?? false;
        return (
          <Box key={i} sx={{ display: "flex", gap: 2, position: "relative", pb: isLast ? 0 : 0 }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14, flexShrink: 0 }}>
              <Box
                sx={{
                  width: isActive ? 14 : 10,
                  height: isActive ? 14 : 10,
                  borderRadius: "50%",
                  backgroundColor: isActive ? "#8B0000" : "#D1D5DB",
                  border: isActive ? "3px solid #FECACA" : "2px solid #E5E7EB",
                  flexShrink: 0,
                  mt: "3px",
                }}
              />
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    minHeight: 20,
                    backgroundColor: isActive ? "#8B0000" : "#E5E7EB",
                    my: "3px",
                  }}
                />
              )}
            </Box>
            <Box sx={{ pb: 1.5 }}>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {h.fecha}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#8B0000" : "#111827",
                }}
              >
                {h.evento}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
