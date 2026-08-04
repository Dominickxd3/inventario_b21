import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Boxes,
  CheckCircle2,
  Wrench,
  Handshake,
  PackageX,
  CircleAlert,
} from 'lucide-react';
import { api } from '../../services/api';
import { obtenerMensajeError } from '../../services/api';
import type { DashboardData } from '../../types';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

const COLORES_ESTADOS: Record<string, string> = {
  Operativo: '#2e7d32',
  Averiado: '#b26a00',
  Mantenimiento: '#1565c0',
  Prestado: '#6a1b9a',
  'Dado de baja': '#c62828',
  'No localizado': '#4e342e',
  'En evaluación': '#546e7a',
  Nuevo: '#455a64',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardData>('/reportes/dashboard')
      .then((res) => setData(res.data))
      .catch((e) => setError(obtenerMensajeError(e)));
  }, []);

  if (error) {
    return (
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  const r = data.resumen;
  const estados = data.estados.map((e) => ({
    name: e.NombreEstado,
    value: e.Cantidad,
  }));
  const movMes = data.movimientosPorMes.map((m) => ({
    name: `${String(m.Mes).padStart(2, '0')}/${m.Anio}`,
    Movimientos: m.CantidadMovimientos,
  }));
  const mantMes = data.mantenimientosPorMes.map((m) => ({
    name: `${String(m.Mes).padStart(2, '0')}/${m.Anio}`,
    Mantenimientos: m.CantidadMantenimientos,
    'Costo (S/)': Number((m.CostoTotal + m.CostoRepuestos).toFixed(2)),
  }));

  return (
    <Box>
      <PageHeader
        titulo="Panel institucional"
        subtitulo="Indicadores patrimoniales del inventario B21"
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard titulo="Total de bienes" valor={r.TotalBienes} icono={<Boxes size={22} />} color="#1a1d21" />
        <StatCard titulo="Operativos" valor={r.Operativos} icono={<CheckCircle2 size={22} />} color="#2e7d32" />
        <StatCard titulo="En mantenimiento" valor={r.EnMantenimiento} icono={<Wrench size={22} />} color="#1565c0" />
        <StatCard titulo="Prestados" valor={r.Prestados} icono={<Handshake size={22} />} color="#6a1b9a" />
        <StatCard titulo="Averiados" valor={r.Averiados} icono={<CircleAlert size={22} />} color="#b26a00" />
        <StatCard titulo="Dados de baja" valor={r.DadosBaja} icono={<PackageX size={22} />} color="#c62828" />
        <StatCard titulo="No localizados" valor={r.NoLocalizados} icono={<CircleAlert size={22} />} color="#4e342e" />
        <StatCard titulo="En evaluación" valor={r.EnEvaluacion} icono={<CircleAlert size={22} />} color="#546e7a" />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' },
          gap: 2.5,
        }}
      >
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 2 }}>
            Bienes por estado
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estados}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {estados.map((e) => (
                    <Cell
                      key={e.name}
                      fill={COLORES_ESTADOS[e.name] ?? '#607d8b'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconSize={10} wrapperStyle={{ fontSize: '0.72rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 2 }}>
            Movimientos por mes
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Movimientos" fill="#8c1f28" radius={[4, 4, 0, 0]} maxBarSize={46} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5, gridColumn: { xs: '1', lg: '1 / -1' } }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 2 }}>
            Mantenimientos y costos por periodo
          </Typography>
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mantMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="izq" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis yAxisId="der" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
                <Bar yAxisId="izq" dataKey="Mantenimientos" fill="#1565c0" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="der" dataKey="Costo (S/)" fill="#b26a00" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
