"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Handshake,
  Wrench,
  BarChart3,
  Users,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Box, Typography, Tooltip } from "@mui/material";
import IsotipoB21 from "@/components/IsotipoB21";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";
import type { ReactNode } from "react";

interface Grupo {
  label: string;
  items: ItemNav[];
}

interface ItemNav {
  label: string;
  href: string;
  icon: ReactNode;
  permiso?: string;
}

const NAV: Grupo[] = [
  {
    label: "MONITOREO",
    items: [{ label: "Centro de Control", href: "/dashboard", icon: <LayoutDashboard size={18} /> }],
  },
  {
    label: "ACTIVOS",
    items: [
      { label: "Inventario", href: "/inventario", icon: <Boxes size={18} />, permiso: "Consultar inventario" },
    ],
  },
  {
    label: "OPERACIONES",
    items: [
      { label: "Movimientos", href: "/movimientos", icon: <ArrowLeftRight size={18} />, permiso: "Consultar inventario" },
      { label: "Préstamos", href: "/prestamos", icon: <Handshake size={18} />, permiso: "Consultar inventario" },
    ],
  },
  {
    label: "MANTENIMIENTO",
    items: [
      { label: "Órdenes", href: "/mantenimiento", icon: <Wrench size={18} />, permiso: "Consultar inventario" },
    ],
  },
  {
    label: "ANÁLISIS",
    items: [
      { label: "Reportes", href: "/reportes", icon: <BarChart3 size={18} />, permiso: "Generar reportes" },
    ],
  },
  {
    label: "ADMINISTRACIÓN",
    items: [
      { label: "Usuarios", href: "/usuarios", icon: <Users size={18} /> },
    ],
  },
];

export default function B21Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, logout, tienePermiso } = useAuthStore();
  const [colapsado, setColapsado] = useState(false);

  const salir = () => {
    logout();
    api.defaults.headers.common.Authorization = "";
    router.replace("/login");
  };

  const activo = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Box
      component="aside"
      sx={{
        width: colapsado ? 68 : 252,
        minHeight: "100vh",
        backgroundColor: "#111827",
        color: "#D1D5DB",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        transition: "width 0.2s ease",
        flexShrink: 0,
        borderRight: "1px solid #1F2937",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: colapsado ? 1.5 : 2,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid #1F2937",
          minHeight: 64,
        }}
      >
        <IsotipoB21 size={colapsado ? 32 : 36} />
        {!colapsado && (
          <Box sx={{ lineHeight: 1.15 }}>
            <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.85rem", letterSpacing: "-0.01em" }}>
              RÍMAC N°21
            </Typography>
            <Typography
              sx={{
                fontSize: "0.56rem",
                letterSpacing: "0.14em",
                color: "#C8A951",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Asset Management System
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navegación */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1, px: 1 }}>
        {NAV.map((grupo) => {
          const itemsVisibles = grupo.items.filter(
            (it) => !it.permiso || tienePermiso(it.permiso),
          );
          if (itemsVisibles.length === 0) return null;

          return (
            <Box key={grupo.label} sx={{ mb: 1 }}>
              {!colapsado && (
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "#6B7280",
                    px: 1.5,
                    pt: 1.5,
                    pb: 0.5,
                  }}
                >
                  {grupo.label}
                </Typography>
              )}
              {itemsVisibles.map((it) => {
                const isActive = activo(it.href);
                const link = (
                  <Link
                    key={it.href}
                    href={it.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: colapsado ? "10px 0" : "9px 12px",
                      justifyContent: colapsado ? "center" : "flex-start",
                      marginBottom: 0,
                      borderRadius: 8,
                      fontSize: "0.8rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#FFFFFF" : "#9CA3AF",
                      backgroundColor: isActive ? "#8B0000" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {it.icon}
                    {!colapsado && <span>{it.label}</span>}
                  </Link>
                );

                return colapsado ? (
                  <Tooltip key={it.href} title={it.label} placement="right">
                    {link}
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* Usuario + botones */}
      <Box sx={{ borderTop: "1px solid #1F2937", p: 1 }}>
        {!colapsado && usuario && (
          <Box sx={{ px: 1, py: 0.5, mb: 1 }}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#FFFFFF" }}>
              {usuario.nombreCompleto}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.65rem",
                color: "#9CA3AF",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Shield size={11} />
              {usuario.rol ?? usuario.usuario}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title={colapsado ? "Expandir" : "Contraer"} placement="top">
            <Box
              onClick={() => setColapsado(!colapsado)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 2,
                cursor: "pointer",
                color: "#9CA3AF",
                transition: "all 0.15s",
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "#D1D5DB" },
              }}
            >
              {colapsado ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </Box>
          </Tooltip>
          <Tooltip title="Cerrar sesión" placement="top">
            <Box
              onClick={salir}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 2,
                cursor: "pointer",
                color: "#9CA3AF",
                transition: "all 0.15s",
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "#EF4444" },
              }}
            >
              <LogOut size={15} />
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
