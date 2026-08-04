import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
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
import { FileSpreadsheet, Search } from 'lucide-react';
import { api } from '../../services/api';
import { obtenerMensajeError } from '../../services/api';
import type { Catalogos, ReporteResponsable } from '../../types';
import PageHeader from '../../components/PageHeader';
import EstadoBienChip from '../../components/EstadoBien';
import { formatearFecha, formatearFechaCorta, formatearMoneda } from '../../utils/formato';

type Tab = 'inventario' | 'kardex' | 'movimientos' | 'mantenimiento' | 'responsables';

interface FilaInventario {
  CodigoInterno: string;
  NombreArticulo: string;
  NombreMarca: string | null;
  NombreModelo: string | null;
  NumeroSerie: string | null;
  NombreEstado: string;
  NombreUbicacion: string | null;
  Responsable: string | null;
  FechaIngreso: string | null;
  TipoControl: string | null;
  ValorAdquisicion: number | null;
}

interface FilaKardex {
  Fecha: string;
  CodigoMovimiento: string;
  TipoMovimiento: string;
  Usuario: string | null;
  EstadoAnterior: string | null;
  EstadoNuevo: string | null;
  UbicacionAnterior: string | null;
  UbicacionNueva: string | null;
  ResponsableAnterior: string | null;
  ResponsableNuevo: string | null;
  Detalle: string | null;
}

interface FilaMovimiento {
  CodigoMovimiento: string;
  TipoMovimiento: string;
  Fecha: string;
  CodigoInterno: string | null;
  NombreArticulo: string | null;
  Usuario: string | null;
  Observacion: string | null;
  Estado: string | null;
}

interface FilaMantenimiento {
  CodigoInterno: string;
  NombreArticulo: string;
  TipoMantenimiento: string;
  FechaInicio: string | null;
  FechaFin: string | null;
  Diagnostico: string | null;
  Costo: number;
  CostoRepuestos: number;
  CostoTotal: number;
  ResponsableTecnico: string | null;
  Estado: string;
}

export default function Reportes() {
  const [tab, setTab] = useState<Tab>('inventario');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [codigoB21, setCodigoB21] = useState('');
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [idTipoMovimiento, setIdTipoMovimiento] = useState('');

  const [inventario, setInventario] = useState<FilaInventario[]>([]);
  const [kardex, setKardex] = useState<FilaKardex[]>([]);
  const [movimientos, setMovimientos] = useState<FilaMovimiento[]>([]);
  const [mantenimiento, setMantenimiento] = useState<FilaMantenimiento[]>([]);
  const [responsables, setResponsables] = useState<ReporteResponsable[]>([]);
  const [responsablesDetalle, setResponsablesDetalle] = useState<any[]>([]);

  useEffect(() => {
    api
      .get<Catalogos>('/inventario/catalogos')
      .then((res) => setCatalogos(res.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setCargando(true);
    setError(null);
    const cargar = async () => {
      try {
        if (tab === 'inventario') {
          const res = await api.get<FilaInventario[]>('/reportes/inventario');
          setInventario(res.data);
        } else if (tab === 'responsables') {
          const res = await api.get<{ resumen: ReporteResponsable[]; detalle: any[] }>('/reportes/responsables');
          setResponsables(res.data.resumen ?? []);
          setResponsablesDetalle(res.data.detalle ?? []);
        } else if (tab === 'mantenimiento') {
          const res = await api.get<FilaMantenimiento[]>('/reportes/mantenimiento');
          setMantenimiento(res.data);
        }
      } catch (e) {
        setError(obtenerMensajeError(e));
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [tab]);

  const buscarKardex = useCallback(async () => {
    if (!codigoB21.trim()) return;
    setCargando(true);
    setError(null);
    try {
      const res = await api.get<FilaKardex[]>(`/reportes/kardex/${codigoB21.trim()}`);
      setKardex(res.data);
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [codigoB21]);

  const buscarMovimientos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params: Record<string, string> = { fechaInicio, fechaFin };
      if (idTipoMovimiento) params.idTipoMovimiento = idTipoMovimiento;
      const res = await api.get<{ detalle: FilaMovimiento[]; mensual: any[] }>('/reportes/movimientos', {
        params,
      });
      setMovimientos(res.data.detalle ?? []);
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin, idTipoMovimiento]);

  useEffect(() => {
    if (tab === 'movimientos') buscarMovimientos();
  }, [tab, buscarMovimientos]);

  const exportarCsv = (nombre: string, filas: object[]) => {
    if (filas.length === 0) return;
    const encabezados = Object.keys(filas[0]);
    const csv = [
      encabezados.join(','),
      ...filas.map((f) =>
        encabezados
          .map((h) => `"${String((f as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'inventario', label: 'Inventario general' },
    { key: 'kardex', label: 'Kardex por bien' },
    { key: 'movimientos', label: 'Movimientos por periodo' },
    { key: 'mantenimiento', label: 'Mantenimiento' },
    { key: 'responsables', label: 'Responsables' },
  ];

  return (
    <Box>
      <PageHeader
        titulo="Reportes"
        subtitulo="Reportes institucionales de lectura"
        breadcrumb={[{ label: 'Reportes' }]}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
        {tabs.map((t) => (
          <Button
            key={t.key}
            size="small"
            variant={tab === t.key ? 'contained' : 'outlined'}
            onClick={() => setTab(t.key)}
            sx={{
              textTransform: 'none',
              ...(tab === t.key
                ? { backgroundColor: '#8c1f28', '&:hover': { backgroundColor: '#6d171e' } }
                : { color: '#5c6470', borderColor: '#dfe3e8' }),
            }}
          >
            {t.label}
          </Button>
        ))}
      </Box>

      {error && (
        <Box sx={{ mb: 2, color: 'error.main', fontSize: '0.85rem' }}>{error}</Box>
      )}

      {/* KARDEX: filtros */}
      {tab === 'kardex' && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Código B21"
            placeholder="B21-000001"
            value={codigoB21}
            onChange={(e) => setCodigoB21(e.target.value.toUpperCase())}
            sx={{ width: 220 }}
            slotProps={{
              input: {
                startAdornment: <Search size={16} style={{ marginRight: 8, color: '#9aa3ad' }} />,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={buscarKardex}
            disabled={!codigoB21.trim() || cargando}
            sx={{ backgroundColor: '#8c1f28', '&:hover': { backgroundColor: '#6d171e' }, textTransform: 'none' }}
          >
            Consultar kardex
          </Button>
        </Box>
      )}

      {/* MOVIMIENTOS: filtros */}
      {tab === 'movimientos' && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            label="Desde"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <TextField
            size="small"
            label="Hasta"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <TextField
            select
            size="small"
            label="Tipo de movimiento"
            value={idTipoMovimiento}
            onChange={(e) => setIdTipoMovimiento(e.target.value)}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {catalogos?.tiposMovimiento.map((t) => (
              <MenuItem key={t.IdTipoMovimiento} value={t.IdTipoMovimiento}>
                {t.NombreMovimiento}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            onClick={buscarMovimientos}
            sx={{ backgroundColor: '#8c1f28', '&:hover': { backgroundColor: '#6d171e' }, textTransform: 'none' }}
          >
            Consultar
          </Button>
        </Box>
      )}

      {/* INVENTARIO */}
      {tab === 'inventario' && (
        <TablaReporte
          titulo="Inventario general"
          cargando={cargando}
          acciones={
            <Button
              size="small"
              startIcon={<FileSpreadsheet size={16} />}
              onClick={() => exportarCsv('inventario-general', inventario)}
              disabled={inventario.length === 0}
              sx={{ textTransform: 'none', color: '#8c1f28' }}
            >
              Exportar Excel (CSV)
            </Button>
          }
          encabezados={['Código', 'Artículo', 'Marca', 'Modelo', 'Serie', 'Estado', 'Ubicación', 'Responsable', 'Ingreso']}
          filas={inventario}
          render={(f) => [
            <b key="c" style={{ fontFamily: 'Consolas, monospace' }}>{f.CodigoInterno}</b>,
            f.NombreArticulo,
            f.NombreMarca ?? '—',
            f.NombreModelo ?? '—',
            f.NumeroSerie ?? '—',
            <EstadoBienChip key="e" nombre={f.NombreEstado} />,
            f.NombreUbicacion ?? '—',
            f.Responsable ?? '—',
            formatearFechaCorta(f.FechaIngreso),
          ]}
        />
      )}

      {/* KARDEX */}
      {tab === 'kardex' && (
        <TablaReporte
          titulo={`Kardex ${codigoB21 || ''}`.trim()}
          cargando={cargando}
          acciones={
            <Button
              size="small"
              startIcon={<FileSpreadsheet size={16} />}
              onClick={() => exportarCsv(`kardex-${codigoB21 || 'bien'}`, kardex)}
              disabled={kardex.length === 0}
              sx={{ textTransform: 'none', color: '#8c1f28' }}
            >
              Exportar (CSV)
            </Button>
          }
          encabezados={['Fecha', 'Movimiento', 'Usuario', 'Estado ant.', 'Estado nuevo', 'Ubic. ant.', 'Ubic. nueva', 'Resp. ant.', 'Resp. nuevo', 'Detalle']}
          filas={kardex}
          render={(f) => [
            formatearFecha(f.Fecha),
            <Chip key="t" size="small" label={f.TipoMovimiento} variant="outlined" sx={{ fontSize: '0.66rem', height: 19 }} />,
            f.Usuario ?? '—',
            f.EstadoAnterior ?? '—',
            f.EstadoNuevo ?? '—',
            f.UbicacionAnterior ?? '—',
            f.UbicacionNueva ?? '—',
            f.ResponsableAnterior ?? '—',
            f.ResponsableNuevo ?? '—',
            f.Detalle ?? '—',
          ]}
        />
      )}

      {/* MOVIMIENTOS */}
      {tab === 'movimientos' && (
        <TablaReporte
          titulo={`Movimientos ${fechaInicio} → ${fechaFin}`}
          cargando={cargando}
          acciones={
            <Button
              size="small"
              startIcon={<FileSpreadsheet size={16} />}
              onClick={() => exportarCsv('movimientos-periodo', movimientos)}
              disabled={movimientos.length === 0}
              sx={{ textTransform: 'none', color: '#8c1f28' }}
            >
              Exportar (CSV)
            </Button>
          }
          encabezados={['Código', 'Tipo', 'Fecha', 'Bien', 'Artículo', 'Usuario', 'Observación']}
          filas={movimientos}
          render={(f) => [
            <span key="c" style={{ fontFamily: 'Consolas, monospace' }}>{f.CodigoMovimiento}</span>,
            f.TipoMovimiento,
            formatearFecha(f.Fecha),
            f.CodigoInterno ?? '—',
            f.NombreArticulo ?? '—',
            f.Usuario ?? '—',
            f.Observacion ?? '—',
          ]}
        />
      )}

      {/* MANTENIMIENTO */}
      {tab === 'mantenimiento' && (
        <TablaReporte
          titulo="Mantenimientos"
          cargando={cargando}
          acciones={
            <Button
              size="small"
              startIcon={<FileSpreadsheet size={16} />}
              onClick={() => exportarCsv('mantenimientos', mantenimiento)}
              disabled={mantenimiento.length === 0}
              sx={{ textTransform: 'none', color: '#8c1f28' }}
            >
              Exportar (CSV)
            </Button>
          }
          encabezados={['Bien', 'Artículo', 'Tipo', 'Inicio', 'Fin', 'Diagnóstico', 'Costo', 'Repuestos', 'Total', 'Técnico', 'Estado']}
          filas={mantenimiento}
          render={(f) => [
            <b key="c" style={{ fontFamily: 'Consolas, monospace' }}>{f.CodigoInterno}</b>,
            f.NombreArticulo,
            f.TipoMantenimiento,
            formatearFecha(f.FechaInicio),
            formatearFecha(f.FechaFin),
            f.Diagnostico ?? '—',
            formatearMoneda(f.Costo),
            formatearMoneda(f.CostoRepuestos),
            <b key="t">{formatearMoneda(f.CostoTotal)}</b>,
            f.ResponsableTecnico ?? '—',
            f.Estado,
          ]}
        />
      )}

      {/* RESPONSABLES */}
      {tab === 'responsables' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
              Responsables y equipos asignados
            </Typography>
            <Button
              size="small"
              startIcon={<FileSpreadsheet size={16} />}
              onClick={() => exportarCsv('responsables', responsablesDetalle)}
              disabled={responsablesDetalle.length === 0}
              sx={{ textTransform: 'none', color: '#8c1f28' }}
            >
              Exportar (CSV)
            </Button>
          </Box>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    {['Bombero', 'Código', 'Bienes asignados'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', color: '#5c6470' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {responsables.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ color: '#5c6470', py: 5, textAlign: 'center' }}>
                        {cargando ? 'Cargando…' : 'Sin responsables con bienes asignados.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {responsables.map((r) => (
                    <TableRow key={r.IdBombero}>
                      <TableCell sx={{ fontWeight: 500 }}>{r.Nombre}</TableCell>
                      <TableCell>{r.CodigoBombero}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={`${r.CantidadBienes} equipos`}
                          sx={{ fontSize: '0.7rem', height: 20, backgroundColor: '#f3e5f5', color: '#4a148c' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  {['Responsable', 'Bien', 'Artículo', 'Estado', 'Ingreso'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', color: '#5c6470' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {responsablesDetalle.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>{d.Responsable}</TableCell>
                    <TableCell sx={{ fontFamily: 'Consolas, monospace' }}>{d.CodigoInterno}</TableCell>
                    <TableCell>{d.NombreArticulo}</TableCell>
                    <TableCell><EstadoBienChip nombre={d.NombreEstado} /></TableCell>
                    <TableCell>{formatearFechaCorta(d.FechaIngreso)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

function TablaReporte({
  titulo,
  cargando,
  acciones,
  encabezados,
  filas,
  render,
}: {
  titulo: string;
  cargando: boolean;
  acciones?: React.ReactNode;
  encabezados: string[];
  filas: any[];
  render: (fila: any) => React.ReactNode[];
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{titulo}</Typography>
        {acciones}
      </Box>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {encabezados.map((h) => (
                <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', color: '#5c6470', backgroundColor: '#f8f9fa', whiteSpace: 'nowrap' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando && (
              <TableRow>
                <TableCell colSpan={encabezados.length} sx={{ py: 5, textAlign: 'center', color: '#5c6470' }}>
                  Cargando…
                </TableCell>
              </TableRow>
            )}
            {!cargando && filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={encabezados.length} sx={{ py: 5, textAlign: 'center', color: '#5c6470' }}>
                  Sin datos para este reporte.
                </TableCell>
              </TableRow>
            )}
            {!cargando && filas.map((f, i) => (
              <TableRow key={i} hover>
                {render(f).map((celda, j) => (
                  <TableCell key={j} sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {celda}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}