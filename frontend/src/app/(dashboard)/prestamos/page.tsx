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
import type { ListadoPaginado, Prestamo } from "@/types";
import { formatearFecha } from "@/utils/formato";

export default function PrestamosPage() {
  const [datos, setDatos] = useState<ListadoPaginado<Prestamo>>({ data: [], total: 0 });
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
      const res = await api.get<ListadoPaginado<Prestamo>>("/prestamos", { params });
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
      <PageHeader titulo="Préstamos" subtitulo="Control de préstamos y devoluciones de bienes" />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Buscar préstamo…"
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
          <MenuItem value="PRESTADO">Prestado</MenuItem>
          <MenuItem value="DEVUELTO">Devuelto</MenuItem>
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
                {["Código", "Bien", "Artículo", "Solicitante", "Autoriza", "Salida", "Devolución prog.", "Devolución real", "Estado"].map((h) => (
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
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: "#9CA3AF" }}>
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : datos.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: "#9CA3AF" }}>
                    No hay préstamos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                datos.data.map((p) => (
                  <TableRow key={p.IdPrestamo} hover>
                    <TableCell sx={{ fontFamily: "Consolas, monospace", fontSize: "0.8rem" }}>
                      {p.CodigoPrestamo}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Consolas, monospace" }}>{p.CodigoInterno ?? "—"}</TableCell>
                    <TableCell>{p.NombreArticulo ?? "—"}</TableCell>
                    <TableCell>{p.Solicitante ?? "—"}</TableCell>
                    <TableCell>{p.Autoriza ?? "—"}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatearFecha(p.FechaSalida)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{p.FechaDevolucionProgramada ? formatearFecha(p.FechaDevolucionProgramada) : "—"}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{p.FechaDevolucionReal ? formatearFecha(p.FechaDevolucionReal) : "—"}</TableCell>
                    <TableCell>
                      <B21StatusBadge estado={p.Estado} />
                    </TableCell>
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
          {datos.total} préstamos
        </Box>
      </Paper>
    </Box>
  );
}