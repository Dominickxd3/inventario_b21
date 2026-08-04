"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  Boxes,
  ShieldCheck,
  Wrench,
  HandPlatter,
  TriangleAlert,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { api, obtenerMensajeError } from "@/services/api";
import type { DashboardData } from "@/types";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import { mesNombre, formatearMoneda } from "@/utils/formato";

const PIE_COLORS = ["#1E7A43", "#C0392B", "#92400E", "#6B21A8", "#4B5563", "#9F1239", "#075985", "#1A56DB"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await api.get<DashboardData>("/reportes/dashboard");
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(obtenerMensajeError(e));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error) {
    return (
      <Box sx={{ p: 4, color: "error.main" }}>
        No se pudo cargar el centro de control: {error}
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  const r = data.resumen;
  const alertas =
    (r.Averiados ?? 0) + (r.NoLocalizados ?? 0) + (r.EnEvaluacion ?? 0);

  const barrasMov = data.movimientosPorMes.map((m) => ({
    mes: `${m.Mes.toString().padStart(2, "0")}`,
    Movimientos: m.CantidadMovimientos,
  }));

  const barrasCosto = data.mantenimientosPorMes.map((m) => ({
    mes: mesNombre(m.Mes),
    Mantenimientos: m.CantidadMantenimientos,
    Costo: m.CostoTotal,
  }));

  return (
    <Box>
      <PageHeader
        titulo="Centro de control"
        subtitulo="Visión operativa del patrimonio B21"
      />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 2, mb: 3 }}>
        <StatCard
          label="Total de activos"
          valor={r.TotalBienes}
          icono={<Boxes size={20} />}
          tono="#111827"
        />
        <StatCard
          label="Operativos"
          valor={r.Operativos}
          icono={<ShieldCheck size={20} />}
          tono="#1E7A43"
          tendencia={{ texto: `${r.Operativos ?? 0} listos para servicio`, tipo: false }}
        />
        <StatCard
          label="En mantenimiento"
          valor={r.EnMantenimiento}
          icono={<Wrench size={20} />}
          tono="#92400E"
        />
        <StatCard
          label="Prestados"
          valor={r.Prestados}
          icono={<HandPlatter size={20} />}
          tono="#6B21A8"
        />
        <StatCard
          label="Alertas de gestión"
          valor={alertas}
          icono={<TriangleAlert size={20} />}
          tono={alertas > 0 ? "#B42318" : "#1E7A43"}
          tendencia={
            alertas > 0
              ? { texto: `${r.Averiados} averiados · ${r.NoLocalizados} no localizados`, tipo: true }
              : { texto: "Sin alertas activas", tipo: false }
          }
        />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
        <Paper
          elevation={0}
          sx={{ gridColumn: { xs: "span 12", md: "span 4" }, border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2 }}>
            Estados de activos
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.estados}
                dataKey="Cantidad"
                nameKey="NombreEstado"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.estados.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "0.72rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>

        <Paper
          elevation={0}
          sx={{ gridColumn: { xs: "span 12", md: "span 8" }, border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2 }}>
            Movimientos del año
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barrasMov}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} width={34} />
              <Tooltip />
              <Bar dataKey="Movimientos" fill="#8B0000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper
          elevation={0}
          sx={{ gridColumn: "span 12", border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2 }}>
            Costos de mantenimiento por mes
          </Typography>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barrasCosto}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis
                yAxisId="costo"
                tickFormatter={(v) => `S/ ${v}`}
                fontSize={11}
                width={80}
              />
              <YAxis yAxisId="n" orientation="right" allowDecimals={false} fontSize={12} width={40} />
              <Tooltip formatter={(value, name) => (name === "Costo" ? formatearMoneda(Number(value ?? 0)) : value)} />
              <Legend wrapperStyle={{ fontSize: "0.72rem" }} />
              <Bar yAxisId="costo" dataKey="Costo" fill="#C8A951" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="n" dataKey="Mantenimientos" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
}