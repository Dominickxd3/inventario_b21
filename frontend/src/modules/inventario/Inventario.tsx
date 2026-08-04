import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import { Eye, Plus, Search } from 'lucide-react';
import { api } from '../../services/api';
import { obtenerMensajeError } from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import type { Bien, Catalogos, ListadoBienes } from '../../types';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import EstadoBienChip from '../../components/EstadoBien';
import RegistrarBienDialog from './RegistrarBienDialog';
import { formatearFechaCorta } from '../../utils/formato';

export default function Inventario() {
  const { tienePermiso } = useAuth();
  const [datos, setDatos] = useState<ListadoBienes>({ data: [], total: 0 });
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abrirRegistrar, setAbrirRegistrar] = useState(false);

  const [filtro, setFiltro] = useState('');
  const [idEstado, setIdEstado] = useState('');
  const [idUbicacion, setIdUbicacion] = useState('');
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params: Record<string, string | number> = {
        pagina: pagina + 1,
        filas: filasPorPagina,
      };
      if (filtro) params.filtro = filtro;
      if (idEstado) params.idEstado = idEstado;
      if (idUbicacion) params.idUbicacion = idUbicacion;
      const res = await api.get<{ data: Bien[]; total: number }>('/inventario/bienes', {
        params,
      });
      setDatos(res.data);
      setError(null);
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [filtro, idEstado, idUbicacion, pagina, filasPorPagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    api
      .get<Catalogos>('/inventario/catalogos')
      .then((res) => setCatalogos(res.data))
      .catch(() => undefined);
  }, []);

  const limpiarFiltros = () => {
    setFiltro('');
    setIdEstado('');
    setIdUbicacion('');
    setPagina(0);
  };

  return (
    <Box>
      <PageHeader
        titulo="Inventario"
        subtitulo="Bienes patrimoniales de la compañía"
        breadcrumb={[{ label: 'Inventario' }]}
        acciones={
          tienePermiso('Registrar bienes') ? (
            <Button
              variant="contained"
              startIcon={<Plus size={17} />}
              onClick={() => setAbrirRegistrar(true)}
              sx={{
                backgroundColor: '#8c1f28',
                '&:hover': { backgroundColor: '#6d171e' },
                textTransform: 'none',
              }}
            >
              Registrar bien
            </Button>
          ) : undefined
        }
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2.5,
          alignItems: 'center',
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar por código, artículo o serie…"
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setPagina(0);
          }}
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
        <TextField
          select
          size="small"
          label="Estado"
          value={idEstado}
          onChange={(e) => {
            setIdEstado(e.target.value);
            setPagina(0);
          }}
          sx={{ minWidth: 190 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {catalogos?.estados.map((e) => (
            <MenuItem key={e.IdEstado} value={e.IdEstado}>
              {e.NombreEstado}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Ubicación"
          value={idUbicacion}
          onChange={(e) => {
            setIdUbicacion(e.target.value);
            setPagina(0);
          }}
          sx={{ minWidth: 190 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {catalogos?.ubicaciones.map((u) => (
            <MenuItem key={u.IdUbicacion} value={u.IdUbicacion}>
              {u.NombreUbicacion}
            </MenuItem>
          ))}
        </TextField>
        {(filtro || idEstado || idUbicacion) && (
          <Button size="small" onClick={limpiarFiltros} sx={{ textTransform: 'none' }}>
            Limpiar filtros
          </Button>
        )}
      </Box>

      {error && (
        <Box sx={{ mb: 2, color: 'error.main', fontSize: '0.85rem' }}>{error}</Box>
      )}

      <DataTable<Bien>
        columnas={[
          {
            key: 'CodigoInterno',
            label: 'Código B21',
            minWidth: 110,
            render: (b) => (
              <Link
                to={`/inventario/${b.CodigoInterno}`}
                className="font-medium text-b21-red hover:underline"
                style={{ fontFamily: 'Consolas, monospace' }}
              >
                {b.CodigoInterno}
              </Link>
            ),
          },
          {
            key: 'NombreArticulo',
            label: 'Artículo',
            minWidth: 170,
            render: (b) => (
              <Box>
                <Box sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
                  {b.NombreArticulo}
                </Box>
                {b.TipoControl && (
                  <Chip
                    size="small"
                    label={b.TipoControl}
                    variant="outlined"
                    sx={{ fontSize: '0.62rem', height: 18, mt: 0.3 }}
                  />
                )}
              </Box>
            ),
          },
          { key: 'NumeroSerie', label: 'Serie', minWidth: 120, render: (b) => b.NumeroSerie ?? '—' },
          {
            key: 'NombreEstado',
            label: 'Estado',
            minWidth: 140,
            render: (b) => <EstadoBienChip nombre={b.NombreEstado} />,
          },
          { key: 'NombreUbicacion', label: 'Ubicación', minWidth: 160, render: (b) => b.NombreUbicacion ?? '—' },
          { key: 'Responsable', label: 'Responsable', minWidth: 150, render: (b) => b.Responsable ?? '—' },
          {
            key: 'FechaIngreso',
            label: 'Ingreso',
            minWidth: 100,
            render: (b) => formatearFechaCorta(b.FechaIngreso),
          },
          {
            key: 'acciones',
            label: '',
            align: 'right',
            render: (b) => (
              <Button
                component={Link}
                to={`/inventario/${b.CodigoInterno}`}
                size="small"
                startIcon={<Eye size={15} />}
                sx={{ textTransform: 'none', color: '#8c1f28' }}
              >
                Ficha
              </Button>
            ),
          },
        ]}
        filas={datos.data}
        cargando={cargando}
        total={datos.total}
        pagina={pagina}
        filasPorPagina={filasPorPagina}
        onCambiarPagina={setPagina}
        onCambiarFilasPorPagina={(f) => {
          setFilasPorPagina(f);
          setPagina(0);
        }}
        getRowId={(b) => b.IdBien}
      />

      <RegistrarBienDialog
        abierto={abrirRegistrar}
        alCerrar={() => setAbrirRegistrar(false)}
        onRegistrado={() => {
          setPagina(0);
          cargar();
        }}
        catalogos={catalogos}
      />
    </Box>
  );
}
