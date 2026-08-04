import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Search } from 'lucide-react';
import { api } from '../../services/api';
import { obtenerMensajeError } from '../../services/api';
import type { Catalogos, Movimiento } from '../../types';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { formatearFecha } from '../../utils/formato';

export default function Movimientos() {
  const [datos, setDatos] = useState<Movimiento[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [idTipo, setIdTipo] = useState('');
  const [detalle, setDetalle] = useState<{ cabecera: any; detalle: any[] } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params: Record<string, string> = {};
      if (filtro) params.filtro = filtro;
      if (idTipo) params.idTipoMovimiento = idTipo;
      const res = await api.get<{ data: Movimiento[] }>('/movimientos', { params });
      setDatos(res.data.data);
      setError(null);
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [filtro, idTipo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    api
      .get<Catalogos>('/inventario/catalogos')
      .then((res) => setCatalogos(res.data))
      .catch(() => undefined);
  }, []);

  const abrirDetalle = async (id: number) => {
    try {
      const res = await api.get(`/movimientos/${id}`);
      setDetalle(res.data);
    } catch {
      setDetalle(null);
    }
  };

  return (
    <Box>
      <PageHeader
        titulo="Movimientos"
        subtitulo="Trazabilidad de entradas, salidas, préstamos y transferencias"
        breadcrumb={[{ label: 'Movimientos' }]}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Buscar movimiento…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          sx={{ minWidth: 280, flex: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={17} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Tipo de movimiento"
          value={idTipo}
          onChange={(e) => setIdTipo(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {catalogos?.tiposMovimiento.map((t) => (
            <MenuItem key={t.IdTipoMovimiento} value={t.IdTipoMovimiento}>
              {t.NombreMovimiento}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {error && (
        <Box sx={{ mb: 2, color: 'error.main', fontSize: '0.85rem' }}>{error}</Box>
      )}

      <DataTable<Movimiento>
        columnas={[
          { key: 'CodigoMovimiento', label: 'Código', minWidth: 130, render: (m) => <span style={{ fontFamily: 'Consolas, monospace' }}>{m.CodigoMovimiento}</span> },
          {
            key: 'NombreMovimiento',
            label: 'Tipo',
            minWidth: 130,
            render: (m) => (
              <Chip
                size="small"
                label={m.NombreMovimiento}
                variant="outlined"
                sx={{ fontSize: '0.68rem', height: 20 }}
              />
            ),
          },
          { key: 'Fecha', label: 'Fecha', minWidth: 140 },
          { key: 'CodigoInterno', label: 'Bien', render: (m) => m.CodigoInterno ?? '—' },
          { key: 'NombreArticulo', label: 'Artículo', minWidth: 160, render: (m) => m.NombreArticulo ?? '—' },
          { key: 'Usuario', label: 'Usuario', render: (m) => m.Usuario ?? '—' },
          {
            key: 'Estado',
            label: 'Registro',
            minWidth: 100,
            render: (m) => (
              <Chip
                size="small"
                label={m.Estado ?? '—'}
                sx={{
                  fontSize: '0.66rem',
                  height: 18,
                  backgroundColor: m.Estado === 'CERRADO' ? '#e8f5e9' : '#f1f2f4',
                  color: m.Estado === 'CERRADO' ? '#1b5e20' : '#5c6470',
                }}
              />
            ),
          },
          {
            key: 'acciones',
            label: '',
            render: (m) => (
              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  abrirDetalle(m.IdMovimiento);
                }}
                className="text-xs text-b21-red hover:underline"
              >
                Ver detalle
              </Link>
            ),
          },
        ]}
        filas={datos}
        cargando={cargando}
        emptyMessage="No hay movimientos registrados."
        getRowId={(m) => m.IdMovimiento}
      />

      <Dialog open={!!detalle} onClose={() => setDetalle(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Movimiento {detalle?.cabecera?.CodigoMovimiento}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableBody>
                {[
                  ['Tipo', detalle?.cabecera?.NombreMovimiento],
                  ['Fecha', detalle?.cabecera?.FechaMovimiento && formatearFecha(detalle.cabecera.FechaMovimiento)],
                  ['Observación', detalle?.cabecera?.Observacion],
                ].map(([k, v]) => (
                  <TableRow key={k as string}>
                    <TableCell sx={{ color: '#5c6470', fontWeight: 500, width: 140 }}>{k}</TableCell>
                    <TableCell>{v ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 1 }}>
            Bienes del movimiento
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Bien</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado anterior</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado nuevo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(detalle?.detalle ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ color: '#5c6470' }}>
                      Sin detalle.
                    </TableCell>
                  </TableRow>
                )}
                {(detalle?.detalle ?? []).map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>{d.CodigoInterno ?? d.IdBien}</TableCell>
                    <TableCell>{d.EstadoAntes ?? '—'}</TableCell>
                    <TableCell>{d.EstadoDespues ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
}