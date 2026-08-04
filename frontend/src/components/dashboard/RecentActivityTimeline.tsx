"use client";

import { Box, Typography } from "@mui/material";
import { ArrowRightLeft, Wrench, Handshake, PackageOpen } from "lucide-react";
import { formatearFecha } from "@/utils/formato";

const ICONOS: Record<string, React.ReactNode> = {
  Ingreso: <PackageOpen size={15} />,
  Mantenimiento: <Wrench size={15} />,
  Préstamo: <Handshake size={15} />,
  Transferencia: <ArrowRightLeft size={15} />,
  Baja: <PackageOpen size={15} />,
};

const COLORES: Record<string, string> = {
  Ingreso: "#1B5E20",
  Mantenimiento: "#E65100",
  Préstamo: "#0D47A1",
  Transferencia: "#C8A951",
  Baja: "#546E7A",
};

interface Movimiento {
  CodigoMovimiento: string;
  NombreMovimiento?: string;
  TipoMovimiento?: string;
  CodigoInterno?: string;
  FechaMovimiento: string;
}

export default function RecentActivityTimeline({ movimientos }: { movimientos: Movimiento[] }) {
  if (!movimientos || movimientos.length === 0) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {movimientos.map((m, i) => {
        const tipo = m.NombreMovimiento ?? m.TipoMovimiento ?? "Movimiento";
        const color = COLORES[tipo] ?? "#8B0000";
        return (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
              py: 1.5,
              borderBottom: i < movimientos.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                bgcolor: `${color}14`,
                color: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {ICONOS[tipo] ?? ICONOS.Ingreso}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, fontFamily: "Consolas, monospace", color: color }}>
                  {m.CodigoMovimiento}
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: "#374151" }}>
                  {tipo}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.7rem", color: "#6B7280", mt: 0.2 }}>
                {m.CodigoInterno ?? "—"}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.65rem", color: "#9CA3AF", whiteSpace: "nowrap" }}>
              {formatearFecha(m.FechaMovimiento)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
