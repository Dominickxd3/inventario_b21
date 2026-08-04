"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import {
  ArrowLeft,
  Boxes,
  MapPin,
  User,
  Barcode,
  Hash,
  Calendar,
  DollarSign,
  QrCode,
  Camera,
  FileText,
  Wrench,
  History,
} from "lucide-react";
import { api, obtenerMensajeError } from "@/services/api";
import type { FichaBien } from "@/types";
import B21StatusBadge from "@/components/b21/B21StatusBadge";
import B21EmptyState from "@/components/b21/B21EmptyState";
import B21Timeline from "@/components/b21/B21Timeline";
import { formatearFecha, formatearMoneda } from "@/utils/formato";

const TAB_PANELS = [
  { key: "resumen", label: "Resumen", icon: <FileText size={15} /> },
  { key: "kardex", label: "Kardex", icon: <History size={15} /> },
  { key: "movimientos", label: "Movimientos", icon: <History size={15} /> },
  { key: "fotos", label: "Fotos", icon: <Camera size={15} /> },
  { key: "qr", label: "QR", icon: <QrCode size={15} /> },
];

export default function FichaBienPage() {
  const params = useParams<{ codigo: string }>();
  const router = useRouter();
  const [ficha, setFicha] = useState<FichaBien | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const res = await api.get<FichaBien>(`/inventario/bienes/${params.codigo}`);
      setFicha(res.data);
      setError(null);
    } catch (e) {
      setError(obtenerMensajeError(e));
    }
  }, [params.codigo]);

  useEffect(() => { cargar(); }, [cargar]);

  if (error) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography sx={{ color: "#B71C1C", fontWeight: 600, mb: 2 }}>{error}</Typography>
        <Button onClick={() => router.push("/inventario")} sx={{ textTransform: "none" }}>
          ← Volver al inventario
        </Button>
      </Box>
    );
  }

  if (!ficha) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
        <CircularProgress size={36} sx={{ color: "#8B0000" }} />
      </Box>
    );
  }

  const b = ficha.bien;

  const movs = ficha.historialAsignacion ?? [];

  const itemsTecnicos = [
    { icon: <Barcode size={15} />, label: "Serie", valor: b.NumeroSerie },
    { icon: <Hash size={15} />, label: "Patrimonial", valor: b.CodigoPatrimonial },
    { icon: <Boxes size={15} />, label: "Marca", valor: b.NombreMarca },
    { icon: <Boxes size={15} />, label: "Modelo", valor: b.NombreModelo },
    { icon: <MapPin size={15} />, label: "Ubicación", valor: b.NombreUbicacion },
    { icon: <User size={15} />, label: "Responsable", valor: b.Responsable },
    { icon: <DollarSign size={15} />, label: "Valor Adq.", valor: (b as any).ValorAdquisicion ? formatearMoneda(Number((b as any).ValorAdquisicion)) : null },
    { icon: <Calendar size={15} />, label: "Ingreso", valor: b.FechaIngreso ? formatearFecha(b.FechaIngreso) : null },
  ].filter((i) => i.valor);

  const hitosVida = [
    ...movs.slice(0, 8).reverse().map((m: any) => ({
      fecha: formatearFecha(m.FechaMovimiento) ?? "",
      evento: m.TipoMovimiento ?? "Movimiento",
      activo: false,
    })),
    { fecha: "Actualidad", evento: b.NombreEstado ?? "—", activo: true },
  ];

  const renderTab = () => {
    switch (tabActiva) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {itemsTecnicos.length === 0 ? (
              <B21EmptyState titulo="Sin información técnica" />
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 1.5 }}>
                {itemsTecnicos.map((it) => (
                  <Box
                    key={it.label}
                    sx={{
                      bgcolor: "#F9FAFB",
                      border: "1px solid rgba(0,0,0,0.04)",
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ color: "#9CA3AF", flexShrink: 0 }}>{it.icon}</Box>
                    <Box>
                      <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF" }}>
                        {it.label}
                      </Typography>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#111827" }}>
                        {it.valor}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );
      case 1:
        return ficha.kardex.length === 0 ? (
          <B21EmptyState titulo="Sin registros de kardex" />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Movimiento</TableCell>
                  <TableCell>Detalle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ficha.kardex.map((k: any, i: number) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                      {formatearFecha(k.Fecha)}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Consolas, monospace", fontSize: "0.78rem" }}>
                      {k.CodigoMovimiento ?? "—"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", color: "#6B7280" }}>
                      {k.Detalle ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 2:
        return movs.length === 0 ? (
          <B21EmptyState titulo="Sin movimientos registrados" />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado Anterior</TableCell>
                  <TableCell>Estado Nuevo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movs.map((m: any, i: number) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: "Consolas, monospace", fontSize: "0.78rem" }}>
                      {m.CodigoMovimiento ?? "—"}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>{m.TipoMovimiento ?? "—"}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                      {formatearFecha(m.FechaMovimiento)}
                    </TableCell>
                    <TableCell><B21StatusBadge estado={m.EstadoAntesNombre} size="sm" /></TableCell>
                    <TableCell><B21StatusBadge estado={m.EstadoDespuesNombre} size="sm" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 3:
        return ficha.fotos.length === 0 ? (
          <B21EmptyState titulo="Sin fotografías" />
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 2 }}>
            {ficha.fotos.map((f: any, i: number) => (
              <Paper key={i} elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <Box sx={{ height: 120, bgcolor: "#F1F2F5", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
                  <Camera size={32} />
                </Box>
                <Box sx={{ p: 1.5 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{f.NombreArchivo ?? "Foto"}</Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{f.TipoFoto ?? f.Descripcion}</Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        );
      case 4:
        return ficha.qr.length === 0 ? (
          <B21EmptyState titulo="Sin código QR registrado" />
        ) : (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <QrCode size={120} style={{ color: "#111827" }} />
            <Typography sx={{ mt: 1, fontFamily: "Consolas, monospace", fontWeight: 700, color: "#111827" }}>
              {(ficha.qr[0] as any)?.CodigoQR ?? "B21-QR"}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#9CA3AF", mt: 0.5 }}>
              Generado el {(ficha.qr[0] as any)?.FechaGeneracion ? formatearFecha((ficha.qr[0] as any).FechaGeneracion) : "—"}
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Breadcrumb + código + estado */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0 }}>
        <Button
          size="small"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => router.push("/inventario")}
          sx={{ textTransform: "none", color: "#6B7280", fontWeight: 500 }}
        >
          Inventario
        </Button>
        <Box
          sx={{
            bgcolor: "#111827",
            color: "#FFFFFF",
            px: 1.5,
            py: 0.4,
            borderRadius: 1.5,
            fontFamily: "Consolas, monospace",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {b.CodigoInterno}
        </Box>
        <B21StatusBadge estado={b.NombreEstado} />
      </Box>

      {/* Cabecera principal */}
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", mt: 1.5, mb: 0.5 }}>
        {b.NombreArticulo}
      </Typography>
      {b.Descripcion && (
        <Typography sx={{ fontSize: "0.85rem", color: "#6B7280", mb: 2.5 }}>
          {b.Descripcion}
        </Typography>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 340px" }, gap: 2.5, mb: 3 }}>
        {/* Columna izquierda: asset + info rápida */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <Box
              sx={{
                height: 200,
                bgcolor: "#F1F2F5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9CA3AF",
                borderBottom: "1px solid rgba(0,0,0,0.04)",
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Boxes size={56} />
                <Typography sx={{ mt: 1, fontSize: "0.8rem", fontWeight: 600, color: "#9CA3AF" }}>
                  Sin foto registrada
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Tabs con contenido */}
          <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <Tabs
              value={tabActiva}
              onChange={(_, v) => setTabActiva(v)}
              sx={{
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                px: 1,
                "& .MuiTab-root": {
                  textTransform: "none",
                  minHeight: 44,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#6B7280",
                  "&.Mui-selected": { color: "#8B0000" },
                },
                "& .MuiTabs-indicator": { backgroundColor: "#8B0000", height: 3 },
              }}
            >
              {TAB_PANELS.map((panel) => (
                <Tab key={panel.key} label={panel.label} />
              ))}
            </Tabs>
            <Box sx={{ p: 2.5 }}>{renderTab()}</Box>
          </Paper>
        </Box>

        {/* Columna derecha: timeline + datos rápidos */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Timeline */}
          <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", mb: 2 }}>
              Ciclo de Vida del Activo
            </Typography>
            <B21Timeline hitos={hitosVida} />
          </Paper>

          {/* Info rápida */}
          <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", mb: 2 }}>
              Información Rápida
            </Typography>
            {itemsTecnicos.filter((_, i) => i < 5).map((it) => (
              <Box key={it.label} sx={{ display: "flex", justifyContent: "space-between", py: 0.6, borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <Typography sx={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 500 }}>
                  {it.label}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#111827" }}>
                  {it.valor}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
