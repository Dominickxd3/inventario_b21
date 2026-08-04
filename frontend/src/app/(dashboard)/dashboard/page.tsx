"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, CircularProgress, Typography, Paper } from "@mui/material";
import {
  LayoutDashboard,
  CheckCircle2,
  Wrench,
  Handshake,
  AlertTriangle,
  ArrowRightLeft,
  Clock,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "@/services/api";
import B21MetricCard from "@/components/b21/B21MetricCard";
import B21EmptyState from "@/components/b21/B21EmptyState";

const PIE_COLORS = ["#1B5E20", "#E65100", "#B71C1C", "#0D47A1", "#546E7A"];

export default function DashboardPage() {
  const [datos, setDatos] = useState<{
    resumen: Record<string, number> | null;
    estados: { Estado: string; Cantidad: number }[];
    movimientosPorMes: { Anio: number; Mes: number; CantidadMovimientos: number }[];
    mantenimientosPorMes: { Anio: number; Mes: number; Cantidad: number }[];
  } | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const res = await api.get("/reportes/dashboard");
      setDatos(res.data);
    } catch {
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
        <CircularProgress size={36} sx={{ color: "#8B0000" }} />
      </Box>
    );
  }

  if (!datos || !datos.resumen) {
    return <B21EmptyState titulo="No se pudieron cargar los indicadores" descripcion="Verifique la conexión con el servidor." />;
  }

  const r = datos.resumen;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
          Centro de Control B21
        </Typography>
        <Typography sx={{ fontSize: "0.82rem", color: "#6B7280", mt: 0.3 }}>
          Visión operativa del patrimonio institucional
        </Typography>
      </Box>

      {/* Tarjetas métricas */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 2, mb: 3 }}>
        <B21MetricCard
          label="Total Activos"
          valor={r.TotalBienes ?? 0}
          icono={<LayoutDashboard size={18} />}
          tono="#8B0000"
          detalle="Bienes registrados"
        />
        <B21MetricCard
          label="Operativos"
          valor={r.Operativos ?? 0}
          icono={<CheckCircle2 size={18} />}
          tono="#1B5E20"
          detalle="Disponibles para servicio"
        />
        <B21MetricCard
          label="En Mantenimiento"
          valor={r.EnMantenimiento ?? 0}
          icono={<Wrench size={18} />}
          tono="#E65100"
          detalle="Equipos en intervención"
        />
        <B21MetricCard
          label="Prestados"
          valor={r.PrestamosActivos ?? 0}
          icono={<Handshake size={18} />}
          tono="#0D47A1"
          detalle="Asignados temporalmente"
        />
        <B21MetricCard
          label="Sin responsable"
          valor={r.SinResponsable ?? 0}
          icono={<AlertTriangle size={18} />}
          tono="#B71C1C"
          detalle="Requieren asignación"
        />
      </Box>

      {/* Gráficos */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 3 }}>
        {/* Estado de activos */}
        <Paper
          elevation={0}
          sx={{ p: 3, borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", mb: 2, color: "#111827", letterSpacing: "-0.01em" }}>
            Estado de Activos
          </Typography>
          {datos.estados.length === 0 ? (
            <B21EmptyState titulo="Sin datos de estados" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={datos.estados}
                  dataKey="Cantidad"
                  nameKey="Estado"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                >
                  {datos.estados.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Movimientos por mes */}
        <Paper
          elevation={0}
          sx={{ p: 3, borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", mb: 2, color: "#111827", letterSpacing: "-0.01em" }}>
            Movimientos Mensuales
          </Typography>
          {datos.movimientosPorMes.length === 0 ? (
            <B21EmptyState titulo="Sin movimientos registrados" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={datos.movimientosPorMes.map((m) => ({
                  mes: `${m.Mes.toString().padStart(2, "0")}/${m.Anio}`,
                  cantidad: m.CantidadMovimientos,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F5" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="cantidad" fill="#8B0000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>

      {/* Últimos indicadores */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 2 }}>
          <Clock size={22} style={{ color: "#6B7280" }} />
          <Box>
            <Typography sx={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827" }}>
              {r.DadosBaja ?? 0}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Dados de Baja
            </Typography>
          </Box>
        </Paper>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 2 }}>
          <ArrowRightLeft size={22} style={{ color: "#6B7280" }} />
          <Box>
            <Typography sx={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827" }}>
              {datos.movimientosPorMes.reduce((a, m) => a + m.CantidadMovimientos, 0)}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Movimientos Totales
            </Typography>
          </Box>
        </Paper>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 2 }}>
          <Wrench size={22} style={{ color: "#6B7280" }} />
          <Box>
            <Typography sx={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827" }}>
              {datos.mantenimientosPorMes.reduce((a, m) => a + m.Cantidad, 0)}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Mantenimientos Totales
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
