"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { B21StatusBadge } from "@/components/b21";
import { api, obtenerMensajeError } from "@/services/api";
import type { ListadoPaginado, Mantenimiento } from "@/types";
import { formatearFecha, formatearMoneda } from "@/utils/formato";

export default function MantenimientoPage() {
  const [datos, setDatos] = useState<ListadoPaginado<Mantenimiento>>({ data: [], total: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(0);
  const [filas] = useState(15);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params: Record<string, string | number> = { pagina: pagina + 1, filas };
      if (filtro) params.filtro = filtro;
      if (estado) params.estado = estado;
      const res = await api.get<ListadoPaginado<Mantenimiento>>("/mantenimientos", { params });
      setDatos(res.data);
      setError(null);
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [filtro, estado, pagina, filas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <Box>
      <PageHeader titulo="Mantenimientos" subtitulo="Control de mantenimientos preventivos y correctivos" />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Buscar mantenimiento…"
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setPagina(0);
          }}
          sx={{ minWidth: 280, flex: 1 }}
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
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPagina(0);
          }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="EN_PROCESO">En proceso</MenuItem>
          <MenuItem value="FINALIZADO">Finalizado</MenuItem>
        </TextField>
      </Box>

      {error && <Box sx={{ mb: 2, color: "error.main", fontSize: "0.82rem" }}>{error}</Box>}

      <Paper
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}
      >
        <TableContainer>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F1F2F5" }}>
                {["Bien", "Artículo", "Tipo", "Inicio", "Fin", "Costo", "Estado", "Responsable"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{ fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase", color: "#374151" }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "#9CA3AF" }}>
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : datos.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "#9CA3AF" }}>
                    No hay mantenimientos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                datos.data.map((m) => (
                  <TableRow key={m.IdMantenimiento} hover>
                    <TableCell sx={{ fontFamily: "Consolas, monospace" }}>{m.CodigoInterno}</TableCell>
                    <TableCell>{m.NombreArticulo}</TableCell>
                    <TableCell>{m.TipoMantenimiento}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{m.FechaInicio ? formatearFecha(m.FechaInicio) : "—"}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{m.FechaFin ? formatearFecha(m.FechaFin) : "—"}</TableCell>
                    <TableCell>{m.Costo != null ? formatearMoneda(m.Costo) : "—"}</TableCell>
                    <TableCell>
                      <B21StatusBadge estado={m.Estado} />
                    </TableCell>
                    <TableCell>{m.Responsable ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            px: 2,
            py: 1,
            display: "flex",
            justifyContent: "flex-end",
            fontSize: "0.78rem",
            color: "#6B7280",
          }}
        >
          {datos.total} mantenimientos
        </Box>
      </Paper>
    </Box>
  );
}