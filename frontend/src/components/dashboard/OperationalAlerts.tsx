"use client";

import { Box, Typography } from "@mui/material";
import { AlertTriangle, Wrench } from "lucide-react";

interface AlertaItem {
  icono: React.ReactNode;
  label: string;
  valor: number;
  color: string;
}

interface Props {
  sinResponsable: number;
  enMantenimiento: number;
  prestamosActivos: number;
  dadosBaja: number;
}

export default function OperationalAlerts({ sinResponsable, enMantenimiento, prestamosActivos, dadosBaja }: Props) {
  const items: AlertaItem[] = [
    { icono: <AlertTriangle size={15} />, label: "Sin responsable", valor: sinResponsable, color: "#B71C1C" },
    { icono: <Wrench size={15} />, label: "Mantenimientos activos", valor: enMantenimiento, color: "#E65100" },
    { icono: <AlertTriangle size={15} />, label: "Préstamos activos", valor: prestamosActivos, color: "#0D47A1" },
    { icono: <AlertTriangle size={15} />, label: "Dados de baja", valor: dadosBaja, color: "#546E7A" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: "12px 14px",
            borderRadius: 2.5,
            bgcolor: "#FAFAFA",
            border: "1px solid rgba(0,0,0,0.04)",
            transition: "all 0.15s",
            "&:hover": { bgcolor: "#FFF", borderColor: "rgba(0,0,0,0.1)" },
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${item.color}14`,
              color: item.color,
              flexShrink: 0,
            }}
          >
            {item.icono}
          </Box>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", flex: 1 }}>
            {item.label}
          </Typography>
          <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, color: item.color }}>
            {item.valor}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
