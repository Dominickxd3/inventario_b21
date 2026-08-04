import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Chip,
  InputAdornment,
  TextField,
} from '@mui/material';
import { Search } from 'lucide-react';
import { api } from '../../services/api';
import { obtenerMensajeError } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { formatearFecha } from '../../utils/formato';

interface Usuario {
  IdUsuario: number;
  Usuario: string;
  Estado: number | boolean;
  UltimoAcceso: string | null;
  FechaRegistro: string;
  IdBombero: number | null;
  CodigoBombero: string | null;
  DNI: string | null;
  Nombres: string | null;
  Apellidos: string | null;
  Roles: string | null;
}

export default function Usuarios() {
  const [datos, setDatos] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get<Usuario[]>('/usuarios');
      setDatos(res.data);
      setError(null);
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = datos.filter(
    (u) =>
      !filtro ||
      u.Usuario.toLowerCase().includes(filtro.toLowerCase()) ||
      (u.Nombres ?? '').toLowerCase().includes(filtro.toLowerCase()) ||
      (u.Apellidos ?? '').toLowerCase().includes(filtro.toLowerCase()),
  );

  return (
    <Box>
      <PageHeader
        titulo="Usuarios"
        subtitulo="Cuentas de acceso al sistema"
        breadcrumb={[{ label: 'Usuarios' }]}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Buscar usuario o bombero…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          sx={{ minWidth: 300, flex: 1 }}
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
      </Box>

      {error && (
        <Box sx={{ mb: 2, color: 'error.main', fontSize: '0.85rem' }}>{error}</Box>
      )}

      <DataTable<Usuario>
        columnas={[
          { key: 'Usuario', label: 'Usuario', minWidth: 130, render: (u) => <b>{u.Usuario}</b> },
          {
            key: 'Nombre',
            label: 'Bombero',
            minWidth: 190,
            render: (u) =>
              [u.Nombres, u.Apellidos].filter(Boolean).join(' ').trim() || '—',
          },
          { key: 'CodigoBombero', label: 'Código', render: (u) => u.CodigoBombero ?? '—' },
          { key: 'Roles', label: 'Roles', minWidth: 220, render: (u) => u.Roles ?? '—' },
          {
            key: 'Estado',
            label: 'Estado',
            render: (u) => (
              <Chip
                size="small"
                label={u.Estado === true || u.Estado === 1 ? 'Activo' : 'Inactivo'}
                sx={{
                  fontSize: '0.68rem',
                  height: 20,
                  backgroundColor: u.Estado === true || u.Estado === 1 ? '#e8f5e9' : '#fce4ec',
                  color: u.Estado === true || u.Estado === 1 ? '#1b5e20' : '#b71c1c',
                }}
              />
            ),
          },
          {
            key: 'UltimoAcceso',
            label: 'Último acceso',
            minWidth: 150,
            render: (u) => formatearFecha(u.UltimoAcceso),
          },
        ]}
        filas={filtrados}
        cargando={cargando}
        emptyMessage="No hay usuarios registrados."
        getRowId={(u) => u.IdUsuario}
      />
    </Box>
  );
}