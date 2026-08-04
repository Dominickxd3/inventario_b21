"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  HandPlatter,
  Wrench,
  FileText,
  Users,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button, Divider } from "@mui/material";
import IsotipoB21 from "@/components/IsotipoB21";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";

const NAV = [
  { label: "Centro de control", href: "/dashboard", icon: LayoutDashboard, permiso: null },
  { label: "Inventario", href: "/inventario", icon: Boxes, permiso: "Consultar inventario" },
  { label: "Movimientos", href: "/movimientos", icon: ArrowLeftRight, permiso: "Consultar inventario" },
  { label: "Préstamos", href: "/prestamos", icon: HandPlatter, permiso: "Consultar inventario" },
  { label: "Mantenimiento", href: "/mantenimiento", icon: Wrench, permiso: "Consultar inventario" },
  { label: "Reportes", href: "/reportes", icon: FileText, permiso: "Generar reportes" },
  { label: "Usuarios", href: "/usuarios", icon: Users, permiso: null },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, logout, tienePermiso } = useAuthStore();
  const [colapsado, setColapsado] = useState(false);

  const salir = () => {
    logout();
    api.defaults.headers.common.Authorization = "";
    router.replace("/login");
  };

  const itemsVisibles = NAV.filter(
    (it) => it.permiso === null || tienePermiso(it.permiso),
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F6F8" }}>
      <aside
        style={{
          width: colapsado ? 76 : 248,
          backgroundColor: "#111827",
          color: "#D1D5DB",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          transition: "width 0.2s ease",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "16px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid #1F2937",
            minHeight: 64,
          }}
        >
          <IsotipoB21 size={34} />
          {!colapsado && (
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.95rem" }}>
                RIMAC N°21
              </div>
              <div
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.12em",
                  color: "#C8A951",
                  fontWeight: 600,
                }}
              >
                GESTIÓN PATRIMONIAL
              </div>
            </div>
          )}
        </div>

        <nav style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
          {itemsVisibles.map((it) => {
            const activo =
              pathname === it.href ||
              (it.href !== "/dashboard" && pathname.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 10px",
                  marginBottom: 4,
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  color: activo ? "#FFFFFF" : "#9CA3AF",
                  backgroundColor: activo ? "#8B0000" : "transparent",
                  textDecoration: "none",
                  justifyContent: colapsado ? "center" : "flex-start",
                }}
                title={it.label}
              >
                <it.icon size={17} style={{ flexShrink: 0 }} />
                {!colapsado && <span>{it.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "10px 12px", borderTop: "1px solid #1F2937" }}>
          {!colapsado && usuario && (
            <div style={{ marginBottom: 10, padding: "0 4px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#FFFFFF" }}>
                {usuario.nombreCompleto}
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "#9CA3AF",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <ShieldCheck size={12} />
                {usuario.rol ?? usuario.usuario}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            {!colapsado && (
              <Button
                size="small"
                onClick={() => setColapsado(true)}
                color="inherit"
                sx={{ color: "#9CA3AF", flex: 1, justifyContent: "flex-start", textTransform: "none" }}
                startIcon={<ChevronRight size={15} />}
              >
                Contraer
              </Button>
            )}
            {colapsado && (
              <Button
                size="small"
                onClick={() => setColapsado(false)}
                color="inherit"
                sx={{ color: "#9CA3AF", flex: 1, minWidth: 0 }}
              >
                »
              </Button>
            )}
            <Button
              size="small"
              onClick={salir}
              color="inherit"
              sx={{ color: "#9CA3AF", flex: 1, textTransform: "none", justifyContent: colapsado ? "center" : "flex-start" }}
              startIcon={colapsado ? undefined : <LogOut size={15} />}
            >
              {colapsado ? <LogOut size={15} /> : "Salir"}
            </Button>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: 60,
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: "0.78rem", color: "#6B7280", fontWeight: 500 }}>
            Compañía de Bomberos Rímac N°21
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "#374151" }}>
            <span style={{ fontWeight: 600 }}>{usuario?.nombreCompleto}</span>
            <Divider orientation="vertical" flexItem />
            <span style={{ color: "#8B0000" }}>Sesión activa</span>
          </div>
        </header>

        <main style={{ padding: "20px 24px", maxWidth: 1680, width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}