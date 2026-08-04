import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import { Plus, Search, Trash2, CheckCircle2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { obtenerMensajeError } from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import type { Bien, Mantenimiento } from '../../types';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { formatearFecha, formatearMoneda } from '../../utils/formato';

const TIPOS_MANTENIMIENTO = [
  'Preventivo',
  'Correctivo',
  'Inspección',
  'Calibración',
  'Prueba operativa',
];

const schemaCrear = z.object({
  idBien: z.string().min(1, 'Seleccione el bien.'),
  tipoMantenimiento: z.string().min(1, 'Seleccione el tipo de mantenimiento.'),
  diagnostico: z.string().optional(),
  idResponsableTecnico: z.string().optional(),
  observaciones: z.string().optional(),
  repuestos: z.array(
    z.object({
      nombre: z.string(),
      cantidad: z.string(),
      costoUnitario: z.string(),
    }),
  ),
});

type FormCrear = z.infer<typeof schemaCrear>;

const schemaFinalizar = z.object({
  trabajoRealizado: z.string().optional(),
  costo: z.string().optional(),
  observaciones: z.string().optional(),
});

type FormFinalizar = z.infer<typeof schemaFinalizar>;

const ESTADOS_NO_MANTENIBLES = ['Mantenimiento', 'Prestado', 'Dado de baja'];

export default function Mantenimiento() {
  const { tienePermiso } = useAuth();
  const [datos, setDatos] = useState<Mantenimiento[]>([]);
  const [bienes, setBienes] = useState<Bien[]>([]);
  const [bomberos, setBomberos] = useState<{ IdBombero: number; Nombre: string }[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [ficha, setFicha] = useState<{
    cabecera: any;
    repuestos: any[];
  } | null>(null);
  const [abrirCrear, setAbrirCrear] = useState(false);
  const [finalizar, setFinalizar] = useState<Mantenimiento | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params: Record<string, string> = {};
      if (filtro) params.filtro = filtro;
      if (estadoFiltro) params.estado = estadoFiltro;
      const res = await api.get<{ data: Mantenimiento[] }>('/mantenimientos', { params });
      setDatos(res.data.data);
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
        setBienes(todos.filter((b) => !ESTADOS_NO_MANTENIBLES.includes(b.NombreEstado)));
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
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormCrear>({
    resolver: zodResolver(schemaCrear),
    defaultValues: { repuestos: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'repuestos',
  });

  const {
    register: registerF,
    handleSubmit: handleSubmitF,
    reset: resetF,
    formState: { errors: errorsF },
  } = useForm<FormFinalizar>({
    resolver: zodResolver(schemaFinalizar),
  });

  const abrirFicha = async (id: number) => {
    try {
      const res = await api.get(`/mantenimientos/${id}`);
      setFicha(res.data);
    } catch {
      setFicha(null);
    }
  };

  const registrarMantenimiento = async (values: FormCrear) => {
    setGuardando(true);
    try {
      const repuestos = values.repuestos
        .filter((r) => r.nombre.trim() !== '')
        .map((r) => ({
          nombre: r.nombre,
          cantidad: r.cantidad ? Number(r.cantidad) : undefined,
          costoUnitario: r.costoUnitario ? Number(r.costoUnitario) : undefined,
        }));
      await api.post('/mantenimientos', {
        idBien: Number(values.idBien),
        tipoMantenimiento: values.tipoMantenimiento,
        diagnostico: values.diagnostico ?? null,
        idResponsableTecnico: values.idResponsableTecnico ? Number(values.idResponsableTecnico) : null,
        observaciones: values.observaciones ?? null,
        repuestos: repuestos.length ? repuestos : undefined,
      });
      setAbrirCrear(false);
      reset();
      setMensaje('Mantenimiento registrado correctamente.');
      cargar();
    } catch (e) {
      setMensaje(obtenerMensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const cerrarMantenimiento = async (values: FormFinalizar) => {
    if (!finalizar) return;
    setGuardando(true);
    try {
      await api.post(`/mantenimientos/${finalizar.IdMantenimiento}/finalizar`, {
        trabajoRealizado: values.trabajoRealizado ?? null,
        costo: values.costo ? Number(values.costo) : undefined,
        observaciones: values.observaciones ?? null,
      });
      setFinalizar(null);
      resetF();
      setMensaje('Mantenimiento finalizado.');
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
        titulo="Mantenimiento"
        subtitulo="Historial técnico de los equipos"
        breadcrumb={[{ label: 'Mantenimiento' }]}
        acciones={
          tienePermiso('Registrar mantenimiento') ? (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setAbrirCrear(true)}
              sx={{ backgroundColor: '#8c1f28', '&:hover': { backgroundColor: '#6d171e' }, textTransform: 'none' }}
            >
              Nuevo mantenimiento
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
          placeholder="Buscar mantenimiento…"
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
          <MenuItem value="EN_PROCESO">En proceso</MenuItem>
          <MenuItem value="FINALIZADO">Finalizados</MenuItem>
        </TextField>
      </Box>

      {error && (
        <Box sx={{ mb: 2, color: 'error.main', fontSize: '0.85rem' }}>{error}</Box>
      )}

      <DataTable<Mantenimiento>
        columnas={[
          { key: 'CodigoInterno', label: 'Bien', minWidth: 110, render: (m) => <span style={{ fontFamily: 'Consolas, monospace' }}>{m.CodigoInterno}</span> },
          { key: 'NombreArticulo', label: 'Artículo', minWidth: 160, render: (m) => m.NombreArticulo ?? '—' },
          { key: 'TipoMantenimiento', label: 'Tipo', minWidth: 120 },
          { key: 'FechaInicio', label: 'Inicio', minWidth: 130, render: (m) => formatearFecha(m.FechaInicio) },
          { key: 'FechaFin', label: 'Fin', minWidth: 130, render: (m) => formatearFecha(m.FechaFin) },
          { key: 'Diagnostico', label: 'Diagnóstico', minWidth: 220, render: (m) => m.Diagnostico ?? '—' },
          {
            key: 'Costo',
            label: 'Costo',
            align: 'right',
            minWidth: 100,
            render: (m) => formatearMoneda(m.Costo),
          },
          {
            key: 'Estado',
            label: 'Estado',
            minWidth: 110,
            render: (m) => (
              <Chip
                size="small"
                label={m.Estado}
                sx={{
                  fontSize: '0.68rem',
                  height: 20,
                  backgroundColor: m.Estado === 'FINALIZADO' ? '#e8f5e9' : '#e3f2fd',
                  color: m.Estado === 'FINALIZADO' ? '#1b5e20' : '#0d47a1',
                }}
              />
            ),
          },
          {
            key: 'acciones',
            label: '',
            render: (m) => (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button
                  size="small"
                  onClick={() => abrirFicha(m.IdMantenimiento)}
                  sx={{ textTransform: 'none', color: '#8c1f28' }}
                >
                  Detalle
                </Button>
                {m.Estado === 'EN_PROCESO' && tienePermiso('Registrar mantenimiento') ? (
                  <Button
                    size="small"
                    startIcon={<CheckCircle2 size={14} />}
                    onClick={() => {
                      setFinalizar(m);
                      resetF();
                    }}
                    sx={{ textTransform: 'none', color: '#1b5e20' }}
                  >
                    Finalizar
                  </Button>
                ) : null}
              </Box>
            ),
          },
        ]}
        filas={datos}
        cargando={cargando}
        emptyMessage="No hay mantenimientos registrados."
        getRowId={(m) => m.IdMantenimiento}
      />

      <Dialog open={!!ficha} onClose={() => setFicha(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Mantenimiento — {ficha?.cabecera?.CodigoInterno}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableBody>
                {[
                  ['Tipo', ficha?.cabecera?.TipoMantenimiento],
                  ['Diagnóstico', ficha?.cabecera?.Diagnostico],
                  ['Trabajo realizado', ficha?.cabecera?.TrabajoRealizado],
                  ['Inicio', ficha?.cabecera?.FechaInicio && formatearFecha(ficha.cabecera.FechaInicio)],
                  ['Fin', ficha?.cabecera?.FechaFin && formatearFecha(ficha.cabecera.FechaFin)],
                  ['Costo', ficha?.cabecera?.Costo && formatearMoneda(ficha.cabecera.Costo)],
                  ['Responsable técnico', ficha?.cabecera?.Responsable],
                  ['Estado', ficha?.cabecera?.Estado],
                ].map(([k, v]) => (
                  <TableRow key={k as string}>
                    <TableCell sx={{ color: '#5c6470', fontWeight: 500, width: 180 }}>{k}</TableCell>
                    <TableCell>{v ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 1 }}>
            Repuestos utilizados
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Repuesto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Cantidad
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Costo unitario
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Subtotal
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(ficha?.repuestos ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ color: '#5c6470' }}>
                      Sin repuestos registrados.
                    </TableCell>
                  </TableRow>
                )}
                {(ficha?.repuestos ?? []).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.NombreRepuesto}</TableCell>
                    <TableCell align="right">{r.Cantidad}</TableCell>
                    <TableCell align="right">{formatearMoneda(r.CostoUnitario)}</TableCell>
                    <TableCell align="right">
                      {formatearMoneda(r.Cantidad * r.CostoUnitario)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFicha(null)} sx={{ textTransform: 'none' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={abrirCrear} onClose={() => setAbrirCrear(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Nuevo mantenimiento
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" id="form-crear-mto" onSubmit={handleSubmit(registrarMantenimiento)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              size="small"
              label="Bien"
              {...register('idBien')}
              error={!!errors.idBien}
              helperText={errors.idBien?.message}
            >
              {bienes.map((b) => (
                <MenuItem key={b.IdBien} value={String(b.IdBien)}>
                  {b.CodigoInterno} — {b.NombreArticulo} ({b.NombreEstado})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Tipo de mantenimiento"
              {...register('tipoMantenimiento')}
              error={!!errors.tipoMantenimiento}
              helperText={errors.tipoMantenimiento?.message}
            >
              {TIPOS_MANTENIMIENTO.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Diagnóstico"
              multiline
              rows={2}
              {...register('diagnostico')}
            />
            <TextField
              select
              size="small"
              label="Responsable técnico (opcional)"
              {...register('idResponsableTecnico')}
              helperText={errors.idResponsableTecnico?.message}
            >
              <MenuItem value="">— Sin asignar —</MenuItem>
              {bomberos.map((b) => (
                <MenuItem key={b.IdBombero} value={String(b.IdBombero)}>
                  {b.Nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Observaciones"
              multiline
              rows={2}
              {...register('observaciones')}
            />

            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mt: 1 }}>
              Repuestos
            </Typography>
            {fields.map((f, i) => (
              <Box key={f.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  size="small"
                  placeholder="Nombre del repuesto"
                  sx={{ flex: 2 }}
                  {...register(`repuestos.${i}.nombre`)}
                />
                <TextField
                  size="small"
                  placeholder="Cantidad"
                  type="number"
                  sx={{ flex: 0.5 }}
                  slotProps={{ htmlInput: { min: 1 } }}
                  {...register(`repuestos.${i}.cantidad`)}
                />
                <TextField
                  size="small"
                  placeholder="Costo unit."
                  type="number"
                  sx={{ flex: 0.5 }}
                  slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                  {...register(`repuestos.${i}.costoUnitario`)}
                />
                <IconButton size="small" onClick={() => remove(i)} sx={{ mt: 0.5, color: '#8c1f28' }}>
                  <Trash2 size={16} />
                </IconButton>
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<Plus size={14} />}
              onClick={() => append({ nombre: '', cantidad: '', costoUnitario: '' })}
              sx={{ textTransform: 'none', color: '#8c1f28', alignSelf: 'flex-start' }}
            >
              Agregar repuesto
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAbrirCrear(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-crear-mto"
            variant="contained"
            disabled={guardando}
            sx={{ backgroundColor: '#8c1f28', '&:hover': { backgroundColor: '#6d171e' }, textTransform: 'none' }}
          >
            {guardando ? 'Registrando…' : 'Registrar mantenimiento'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!finalizar} onClose={() => setFinalizar(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Finalizar mantenimiento — {finalizar?.CodigoInterno}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" id="form-fin-mto" onSubmit={handleSubmitF(cerrarMantenimiento)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              size="small"
              label="Trabajo realizado"
              multiline
              rows={2}
              {...registerF('trabajoRealizado')}
              helperText={errorsF.trabajoRealizado?.message}
            />
            <TextField
              size="small"
              label="Costo total (opcional)"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              {...registerF('costo')}
              helperText={errorsF.costo?.message}
            />
            <TextField
              size="small"
              label="Observaciones"
              multiline
              rows={2}
              {...registerF('observaciones')}
              helperText={errorsF.observaciones?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFinalizar(null)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-fin-mto"
            variant="contained"
            disabled={guardando}
            sx={{ backgroundColor: '#8c1f28', '&:hover': { backgroundColor: '#6d171e' }, textTransform: 'none' }}
          >
            {guardando ? 'Guardando…' : 'Finalizar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}