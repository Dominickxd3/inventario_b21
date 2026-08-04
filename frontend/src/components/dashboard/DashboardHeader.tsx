"use client";

import { Box, Typography } from "@mui/material";
import { ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth";

function fechaHoy() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function DashboardHeader() {
  const { usuario } = useAuthStore();

  return (
    <Box>
      <Box
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.06)",
          bgcolor: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box sx={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", bgcolor: "#8B0000" }} />
        <Box sx={{ position: "absolute", top: 0, left: 4, width: 2, height: "100%", bgcolor: "#C8A951" }} />

        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8B0000", mb: 0.5 }}>
              {saludo()}, {usuario?.nombreCompleto ?? "Usuario"}
            </Typography>
            <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
              Centro Operativo de Activos B21
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "#6B7280", mt: 0.3 }}>
              Monitoreo del ciclo de vida del patrimonio institucional
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, bgcolor: "#F9FAFB", borderRadius: 2, px: 2, py: 1, border: "1px solid rgba(0,0,0,0.04)" }}>
            <ShieldCheck size={18} style={{ color: "#C8A951" }} />
            <Box>
              <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Última actualización
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#111827" }}>
                {fechaHoy()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
