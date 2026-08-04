"use client";

import { useCallback, useEffect, useMemo, useTransition, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Search, Columns3, Plus, Eye } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { api, obtenerMensajeError } from "@/services/api";
import type { Bien, Catalogos, ListadoPaginado } from "@/types";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import ColumnasDialog from "@/components/ColumnasDialog";
import { EstadoChip } from "@/utils/estados";
import { B21StatusBadge } from "@/components/b21";
import { formatearFechaCorta } from "@/utils/formato";
import { usePermiso } from "@/hooks/usePermiso";
import RegistrarBienDialog from "./RegistrarBienDialog";

export default function InventarioPage() {
  const puedeRegistrar = usePermiso("Registrar bienes");
  const [isPending, startTransition] = useTransition();

  const [datos, setDatos] = useState<ListadoPaginado<Bien>>({ data: [], total: 0 });
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtro, setFiltro] = useState("");
  const [filtroDebounced, setFiltroDebounced] = useState("");
  const [idEstado, setIdEstado] = useState("");
  const [idUbicacion, setIdUbicacion] = useState("");
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  const [abrirColumnas, setAbrirColumnas] = useState(false);
  const [abrirRegistrar, setAbrirRegistrar] = useState(false);
  const [visibles, setVisibles] = useState<string[]>([
    "CodigoInterno",
    "NombreArticulo",
    "NumeroSerie",
    "NombreEstado",
    "NombreUbicacion",
    "Responsable",
    "FechaIngreso",
    "acciones",
  ]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params: Record<string, string | number> = {
        pagina: pagina + 1,
        filas: filasPorPagina,
      };
      if (filtroDebounced) params.filtro = filtroDebounced;
      if (idEstado) params.idEstado = idEstado;
      if (idUbicacion) params.idUbicacion = idUbicacion;
      const res = await api.get<ListadoPaginado<Bien>>("/inventario/bienes", { params });
      startTransition(() => {
        setDatos(res.data);
        setError(null);
      });
    } catch (e) {
      startTransition(() => setError(obtenerMensajeError(e)));
    } finally {
      setCargando(false);
    }
  }, [filtroDebounced, idEstado, idUbicacion, pagina, filasPorPagina]);

  useEffect(() => {
    const timer = setTimeout(() => setFiltroDebounced(filtro), 250);
    return () => clearTimeout(timer);
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    api
      .get<Catalogos>("/inventario/catalogos")
      .then((res) => setCatalogos(res.data))
      .catch(() => undefined);
  }, []);

  const columnas: ColumnDef<Bien, unknown>[] = useMemo(
    () => [
      {
        id: "CodigoInterno",
        header: "Código B21",
        enableSorting: true,
        accessorFn: (b) => b.CodigoInterno,
        cell: (info) => (
          <Link
            href={`/inventario/${info.row.original.CodigoInterno}`}
            style={{
              color: "#8B0000",
              fontWeight: 600,
              fontFamily: "Consolas, monospace",
              textDecoration: "none",
            }}
          >
            {info.row.original.CodigoInterno}
          </Link>
        ),
      },
      {
        id: "NombreArticulo",
        header: "Equipo",
        enableSorting: true,
        accessorFn: (b) => b.NombreArticulo,
        cell: (info) => info.row.original.NombreArticulo ?? "—",
      },
      {
        id: "NumeroSerie",
        header: "Serie",
        accessorFn: (b) => b.NumeroSerie,
        cell: (info) => info.row.original.NumeroSerie ?? "—",
      },
      {
        id: "NombreEstado",
        header: "Estado",
        accessorFn: (b) => b.NombreEstado,
        cell: (info) => <B21StatusBadge estado={info.row.original.NombreEstado} />,
      },
      {
        id: "NombreUbicacion",
        header: "Ubicación",
        accessorFn: (b) => b.NombreUbicacion,
        cell: (info) => info.row.original.NombreUbicacion ?? "—",
      },
      {
        id: "Responsable",
        header: "Responsable",
        accessorFn: (b) => b.Responsable,
        cell: (info) => info.row.original.Responsable ?? "—",
      },
      {
        id: "FechaIngreso",
        header: "Ingreso",
        accessorFn: (b) => b.FechaIngreso,
        cell: (info) => formatearFechaCorta(info.row.original.FechaIngreso),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: (info) => (
          <Button
            component={Link}
            href={`/inventario/${info.row.original.CodigoInterno}`}
            size="small"
            startIcon={<Eye size={15} />}
            sx={{ textTransform: "none", color: "#8B0000" }}
          >
            Ficha
          </Button>
        ),
      },
    ],
    [],
  );

  const columnasFiltradas = useMemo(
    () => columnas.filter((c) => visibles.includes((c as { id: string }).id)),
    [columnas, visibles],
  );

  return (
    <Box>
      <PageHeader
        titulo="Inventario"
        subtitulo="Bienes patrimoniales de la compañía"
        acciones={
          <>
            <Tooltip title="Configurar columnas">
              <IconButton
                onClick={() => setAbrirColumnas(true)}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
              >
                <Columns3 size={17} />
              </IconButton>
            </Tooltip>
            {puedeRegistrar && (
              <Button
                variant="contained"
                startIcon={<Plus size={17} />}
                onClick={() => setAbrirRegistrar(true)}
              >
                Registrar bien
              </Button>
            )}
          </>
        }
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Buscar por código, equipo o serie…"
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
                  <Search size={16} />
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
          sx={{ minWidth: 180 }}
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
      </Box>

      {error && (
        <Box sx={{ mb: 2, color: "error.main", fontSize: "0.82rem" }}>{error}</Box>
      )}

      <DataTable<Bien>
        columnas={columnasFiltradas}
        filas={datos.data}
        cargando={cargando}
        total={datos.total}
        pagina={pagina}
        filasPorPagina={filasPorPagina}
        onCambiarPagina={setPagina}
        onCambiarFilasPorPagina={setFilasPorPagina}
        getRowId={(b) => b.IdBien}
        emptyMessage="No hay bienes registrados."
      />

      <ColumnasDialog<Bien>
        abierto={abrirColumnas}
        alCerrar={() => setAbrirColumnas(false)}
        columnas={columnas}
        visibles={visibles}
        alCambiar={setVisibles}
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