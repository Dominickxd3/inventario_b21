"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { ShieldCheck } from "lucide-react";
import B21Sidebar from "@/components/b21/B21Sidebar";
import { useAuthStore } from "@/store/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuthStore();
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F5F5F3" }}>
      <B21Sidebar />

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Header superior */}
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
          <Typography sx={{ fontSize: "0.76rem", color: "#6B7280", fontWeight: 500, letterSpacing: "0.02em" }}>
            Compañía de Bomberos Rímac N°21 — Sistema de Gestión Patrimonial
          </Typography>
          {montado && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ShieldCheck size={14} style={{ color: "#8B0000" }} />
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>
                {usuario?.nombreCompleto}
              </Typography>
              <Box
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: "#8B0000",
                  bgcolor: "#FEF2F2",
                  px: 1.2,
                  py: 0.3,
                  borderRadius: 1,
                  letterSpacing: "0.03em",
                }}
              >
                {usuario?.rol ?? "Sesión activa"}
              </Box>
            </Box>
          )}
        </Box>

        {/* Contenido */}
        <Box component="main" sx={{ px: 3, py: 3, flex: 1 }}>
          {children}
        </Box>

        {/* Footer */}
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
