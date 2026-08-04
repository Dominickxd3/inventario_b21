import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import { Search, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { obtenerMensajeError } from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import type { Bien, Prestamo } from '../../types';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { formatearFecha } from '../../utils/formato';

const schemaDevolucion = z.object({
  idEstadoRetorno: z.string().min(1, 'Seleccione el estado de retorno.'),
  idBomberoRecibe: z.string().min(1, 'Seleccione quien recibe.'),
  observacion: z.string().optional(),
});

type FormDevolucion = z.infer<typeof schemaDevolucion>;

const schemaCrear = z.object({
  idBien: z.string().min(1, 'Seleccione el bien a prestar.'),
  idBomberoSolicitante: z.string().min(1, 'Seleccione el bombero solicitante.'),
  idBomberoAutoriza: z.string().optional(),
  fechaDevolucionProgramada: z.string().optional(),
  observacion: z.string().optional(),
});

type FormCrear = z.infer<typeof schemaCrear>;

const ESTADOS_NO_PRESTABLES = ['Prestado', 'Dado de baja', 'No localizado'];

export default function Prestamos() {
  const { tienePermiso } = useAuth();
  const [datos, setDatos] = useState<Prestamo[]>([]);
  const [bienes, setBienes] = useState<Bien[]>([]);
  const [bomberos, setBomberos] = useState<{ IdBombero: number; Nombre: string }[]>([]);
  const [estados, setEstados] = useState<{ IdEstado: number; NombreEstado: string }[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [abrirCrear, setAbrirCrear] = useState(false);
  const [devolver, setDevolver] = useState<Prestamo | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params: Record<string, string> = {};
      if (filtro) params.filtro = filtro;
      if (estadoFiltro) params.estado = estadoFiltro;
      const res = await api.get<{ data: Prestamo[]; total: number }>('/prestamos', { params });
      setDatos(res.data.data ?? res.data);
      setError(null);
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [filtro, estadoFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    api
      .get<{ data: Bien[] }>('/inventario/bienes')
      .then((res) => {
        const todos = res.data.data ?? (res.data as unknown as Bien[]);
        setBienes(todos.filter((b) => !ESTADOS_NO_PRESTABLES.includes(b.NombreEstado)));
      })
      .catch(() => undefined);
    api
      .get('/usuarios')
      .then((res) =>
        setBomberos(
          (res.data as any[]).map((u) => ({
            IdBombero: u.IdBombero,
            Nombre: [u.Nombres, u.Apellidos].filter(Boolean).join(' ').trim() || u.Usuario,
          })),
        ),
      )
      .catch(() => undefined);
    api
      .get('/inventario/catalogos')
      .then((res) => setEstados(res.data.estados))
      .catch(() => undefined);
  }, []);

  const { register: registerDev, handleSubmit: handleSubmitDev, reset: resetDev, formState: { errors: errorsDev } } =
    useForm<FormDevolucion>({
      resolver: zodResolver(schemaDevolucion),
    });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormCrear>({
    resolver: zodResolver(schemaCrear),
  });

  const registrarDevolucion = async (values: FormDevolucion) => {
    if (!devolver) return;
    try {
      await api.post(`/prestamos/${devolver.IdPrestamo}/devolucion`, {
        idEstadoRetorno: Number(values.idEstadoRetorno),
        idBomberoRecibe: Number(values.idBomberoRecibe),
        observacion: values.observacion ?? null,
      });
      setDevolver(null);
      resetDev();
      setMensaje(`Devolución de ${devolver.CodigoPrestamo} registrada.`);
      cargar();
    } catch (e) {
      setMensaje(obtenerMensajeError(e));
    }
  };

  const registrarPrestamo = async (values: FormCrear) => {
    setGuardando(true);
    try {
      await api.post('/prestamos', {
        idBien: Number(values.idBien),
        idBomberoSolicitante: Number(values.idBomberoSolicitante),
        idBomberoAutoriza: values.idBomberoAutoriza ? Number(values.idBomberoAutoriza) : null,
        fechaDevolucionProgramada: values.fechaDevolucionProgramada || null,
        observacion: values.observacion ?? null,
      });
      setAbrirCrear(false);
      reset();
      setMensaje('Préstamo registrado correctamente.');
      cargar();
    } catch (e) {
      setMensaje(obtenerMensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Box>
      <PageHeader
        titulo="Préstamos"
        subtitulo="Gestión de préstamos y devoluciones de equipos"
        breadcrumb={[{ label: 'Préstamos' }]}
        acciones={
          tienePermiso('Registrar préstamo') ? (
            <Button
              variant="contained"
              onClick={() => setAbrirCrear(true)}
              sx={{ backgroundColor: '#8c1f28', '&:hover': { backgroundColor: '#6d171e' }, textTransform: 'none' }}
            >
              Nuevo préstamo
            </Button>
          ) : undefined
        }
      />

      {mensaje && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, backgroundColor: '#f3f4f6', fontSize: '0.85rem' }}>
          {mensaje}
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Buscar préstamo…"
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
          label="Estado"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="PRESTADO">Activos</MenuItem>
          <MenuItem value="DEVUELTO">Devueltos</MenuItem>
        </TextField>
      </Box>

      {error && (
        <Box sx={{ mb: 2, color: 'error.main', fontSize: '0.85rem' }}>{error}</Box>
      )}

      <DataTable<Prestamo>
        columnas={[
          { key: 'CodigoPrestamo', label: 'Código', minWidth: 120, render: (p) => <span style={{ fontFamily: 'Consolas, monospace' }}>{p.CodigoPrestamo}</span> },
          { key: 'CodigoInterno', label: 'Bien', render: (p) => p.CodigoInterno ?? '—' },
          { key: 'NombreArticulo', label: 'Artículo', minWidth: 160, render: (p) => p.NombreArticulo ?? '—' },
          { key: 'Solicitante', label: 'Solicitante', render: (p) => p.Solicitante ?? '—' },
          { key: 'Autoriza', label: 'Autoriza', render: (p) => p.Autoriza ?? '—' },
          { key: 'FechaSalida', label: 'Salida', minWidth: 130, render: (p) => formatearFecha(p.FechaSalida) },
          { key: 'FechaDevolucionProgramada', label: 'Devolución prog.', minWidth: 130, render: (p) => formatearFecha(p.FechaDevolucionProgramada) },
          {
            key: 'Estado',
            label: 'Estado',
            minWidth: 100,
            render: (p) => (
              <Chip
                size="small"
                label={p.Estado}
                sx={{
                  fontSize: '0.68rem',
                  height: 20,
                  backgroundColor: p.Estado === 'PRESTADO' ? '#f3e5f5' : '#e8f5e9',
                  color: p.Estado === 'PRESTADO' ? '#4a148c' : '#1b5e20',
                }}
              />
            ),
          },
          {
            key: 'acciones',
            label: '',
            render: (p) =>
              p.Estado === 'PRESTADO' && tienePermiso('Registrar devolución') ? (
                <Button
                  size="small"
                  startIcon={<RefreshCw size={14} />}
                  onClick={() => {
                    setDevolver(p);
                    resetDev();
                  }}
                  sx={{ textTransform: 'none', color: '#8c1f28' }}
                >
                  Devolver
                </Button>
              ) : null,
          },
        ]}
        filas={datos}
        cargando={cargando}
        emptyMessage="No hay préstamos registrados."
        getRowId={(p) => p.IdPrestamo}
      />

      <Dialog open={!!devolver} onClose={() => setDevolver(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Registrar devolución — {devolver?.CodigoPrestamo}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" id="form-devolucion" onSubmit={handleSubmitDev(registrarDevolucion)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              size="small"
              label="Estado de retorno"
              {...registerDev('idEstadoRetorno')}
              error={!!errorsDev.idEstadoRetorno}
              helperText={errorsDev.idEstadoRetorno?.message}
            >
              {estados.map((e) => (
                <MenuItem key={e.IdEstado} value={String(e.IdEstado)}>
                  {e.NombreEstado}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Recibe (bombero)"
              {...registerDev('idBomberoRecibe')}
              error={!!errorsDev.idBomberoRecibe}
              helperText={errorsDev.idBomberoRecibe?.message}
            >
              {bomberos.map((b) => (
                <MenuItem key={b.IdBombero} value={String(b.IdBombero)}>
                  {b.Nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Observación"
              multiline
              rows={2}
              {...registerDev('observacion')}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDevolver(null)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-devolucion"
            variant="contained"
            sx={{ backgroundColor: '#8c1f28', '&:hover': { backgroundColor: '#6d171e' }, textTransform: 'none' }}
          >
            Registrar devolución
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={abrirCrear} onClose={() => setAbrirCrear(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Nuevo préstamo
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" id="form-crear-prestamo" onSubmit={handleSubmit(registrarPrestamo)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              size="small"
              label="Bien a prestar"
              {...register('idBien')}
              error={!!errors.idBien}
              helperText={errors.idBien?.message}
            >
              {bienes.map((b) => (
                <MenuItem key={b.IdBien} value={String(b.IdBien)}>
                  {b.CodigoInterno} — {b.NombreArticulo}
                  {b.NumeroSerie ? ` (S/N ${b.NumeroSerie})` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Bombero solicitante"
              {...register('idBomberoSolicitante')}
              error={!!errors.idBomberoSolicitante}
              helperText={errors.idBomberoSolicitante?.message}
            >
              {bomberos.map((b) => (
                <MenuItem key={b.IdBombero} value={String(b.IdBombero)}>
                  {b.Nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Autoriza (opcional)"
              {...register('idBomberoAutoriza')}
              helperText={errors.idBomberoAutoriza?.message}
            >
              <MenuItem value="">— Sin autorizador —</MenuItem>
              {bomberos.map((b) => (
                <MenuItem key={b.IdBombero} value={String(b.IdBombero)}>
                  {b.Nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="date"
              size="small"
              label="Fecha de devolución programada (opcional)"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('fechaDevolucionProgramada')}
              helperText={errors.fechaDevolucionProgramada?.message}
            />
            <TextField
              size="small"
              label="Observación"
              multiline
              rows={2}
              {...register('observacion')}
              helperText={errors.observacion?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAbrirCrear(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-crear-prestamo"
            variant="contained"
            disabled={guardando}
            sx={{ backgroundColor: '#8c1f28', '&:hover': { backgroundColor: '#6d171e' }, textTransform: 'none' }}
          >
            {guardando ? 'Registrando…' : 'Registrar préstamo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}