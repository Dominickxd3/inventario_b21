"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from "react";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import {
  CheckCircle2,
  Wrench,
  Handshake,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { api } from "@/services/api";
import B21EmptyState from "@/components/b21/B21EmptyState";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import AssetHealthChart from "@/components/dashboard/AssetHealthChart";
import OperationalAlerts from "@/components/dashboard/OperationalAlerts";
import RecentActivityTimeline from "@/components/dashboard/RecentActivityTimeline";
import AssetStatusWidget from "@/components/dashboard/AssetStatusWidget";
import MovementSummaryChart from "@/components/dashboard/MovementSummaryChart";

export default function DashboardPage() {
  const [datos, setDatos] = useState<any>(null);
  const [movs, setMovs] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const [dash, mov] = await Promise.all([
        api.get("/reportes/dashboard"),
        api.get("/movimientos?pagina=1&filas=5"),
      ]);
      setDatos(dash.data);
      setMovs(mov.data.data ?? []);
    } catch {
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}><CircularProgress size={36} sx={{ color: "#8B0000" }} /></Box>;
  }
  if (!datos?.resumen) {
    return <B21EmptyState titulo="No se pudieron cargar los indicadores" descripcion="Verifique la conexión con el servidor." />;
  }

  const r = datos.resumen;
  const total = r.TotalBienes ?? 0;
  const alertas = (r.SinResponsable ?? 0) + (r.EnMantenimiento ?? 0) + (r.PrestamosActivos ?? 0);

  const tiposMov = (datos.movimientosPorMes ?? []).reduce((acc: any, m: any) => {
    const tipo = m.Tipo ?? "Movimiento";
    acc[tipo] = (acc[tipo] || 0) + m.CantidadMovimientos;
    return acc;
  }, {});
  const datosTipos = Object.entries(tiposMov).map(([tipo, cantidad]: any) => ({ tipo, cantidad }));

  return (
    <Box>
      <DashboardHeader />

      {/* SECCIÓN 2: KPIs */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 2, mb: 3 }}>
        <MetricCard label="Activos Totales" valor={total} icono={<Shield size={20} />} tono="#8B0000" detalle="Bienes registrados" />
        <MetricCard label="Activos Operativos" valor={r.Operativos ?? 0} icono={<CheckCircle2 size={20} />} tono="#1B5E20" detalle="Disponibles para servicio" />
        <MetricCard label="En Mantenimiento" valor={r.EnMantenimiento ?? 0} icono={<Wrench size={20} />} tono="#E65100" detalle="Equipos intervenidos" />
        <MetricCard label="Prestados" valor={r.PrestamosActivos ?? 0} icono={<Handshake size={20} />} tono="#0D47A1" detalle="Asignación temporal" />
        <MetricCard label="Alertas" valor={alertas} icono={<AlertTriangle size={20} />} tono="#B71C1C" detalle="Requieren atención" />
      </Box>

      {/* SECCIÓN 3: Salud del Patrimonio */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 320px" }, gap: 2, mb: 3 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", mb: 1, color: "#111827", letterSpacing: "-0.01em" }}>
            Estado del Patrimonio
          </Typography>
          {datos.estados?.length > 0 ? (
            <AssetHealthChart data={datos.estados} />
          ) : (
            <B21EmptyState titulo="Sin datos" />
          )}
        </Paper>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", bgcolor: "#FFFBF5" }}>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#E65100", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <AlertTriangle size={15} />
            Alertas Operativas
          </Typography>
          <OperationalAlerts
            sinResponsable={r.SinResponsable ?? 0}
            enMantenimiento={r.EnMantenimiento ?? 0}
            prestamosActivos={r.PrestamosActivos ?? 0}
            dadosBaja={r.DadosBaja ?? 0}
          />
        </Paper>
      </Box>

      {/* SECCIÓN 4: Actividad Reciente */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", mb: 3 }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", mb: 2 }}>
          Actividad Reciente
        </Typography>
        <RecentActivityTimeline movimientos={movs} />
      </Paper>

      {/* SECCIÓN 5: Análisis Operativo */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", mb: 2 }}>
            Estado de Activos
          </Typography>
          <AssetStatusWidget estados={datos.estados ?? []} total={total} />
        </Paper>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", mb: 1 }}>
            Movimientos del Período
          </Typography>
          {datosTipos.length > 0 ? (
            <MovementSummaryChart data={datosTipos} />
          ) : (
            <B21EmptyState titulo="Sin datos" />
          )}
        </Paper>
      </Box>
    </Box>
  );
}
