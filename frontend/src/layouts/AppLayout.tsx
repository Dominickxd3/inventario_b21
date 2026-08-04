"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { ShieldCheck, Clock } from "lucide-react";
import B21Sidebar from "@/components/b21/B21Sidebar";
import { useAuthStore } from "@/store/auth";

function formatearFechaAcceso(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario, ultimoAcceso } = useAuthStore();
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F5F5F3" }}>
      <B21Sidebar />

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Header institucional */}
        <Box
          component="header"
          sx={{
            height: 56,
            bgcolor: "#FFFFFF",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.76rem",
              color: "#6B7280",
              fontWeight: 500,
              letterSpacing: "0.02em",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 3,
                height: 16,
                borderRadius: 2,
                bgcolor: "#8B0000",
              }}
            />
            RÍMAC N°21 — Centro de Control Patrimonial — Gestión de Activos y Trazabilidad Operativa
          </Typography>
          {montado && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#9CA3AF", fontSize: "0.7rem" }}>
                <Clock size={13} />
                <span>Último acceso: {formatearFechaAcceso(ultimoAcceso)}</span>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <ShieldCheck size={14} style={{ color: "#C8A951" }} />
                <Box>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", lineHeight: 1.2 }}>
                    {usuario?.nombreCompleto}
                  </Typography>
                  <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, color: "#8B0000", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {usuario?.rol ?? "Sesión activa"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Box component="main" sx={{ px: 3, py: 3, flex: 1 }}>
          {children}
        </Box>

        <Box
          component="footer"
          sx={{
            borderTop: "1px solid rgba(0,0,0,0.04)",
            py: 1.5,
            px: 3,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: "0.68rem", color: "#9CA3AF", letterSpacing: "0.03em" }}>
            Compañía de Bomberos Rímac N°21 — Gestión Patrimonial B21 — v1.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
