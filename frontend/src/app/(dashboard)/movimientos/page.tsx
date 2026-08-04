"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api, obtenerMensajeError } from "@/services/api";
import type { ListadoPaginado, Movimiento, Catalogos } from "@/types";
import { formatearFecha } from "@/utils/formato";
import { EstadoTipo } from "@/utils/estados";

export default function MovimientosPage() {
  const [datos, setDatos] = useState<ListadoPaginado<Movimiento>>({ data: [], total: 0 });
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(0);
  const [filas] = useState(15);
  const [fichaMov, setFichaMov] = useState<{ cabecera: Record<string, unknown>; detalle: Record<string, unknown>[] } | null>(null);
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params: Record<string, string | number> = { pagina: pagina + 1, filas };
      if (filtro) params.filtro = filtro;
      if (tipo) params.idTipoMovimiento = tipo;
      const res = await api.get<ListadoPaginado<Movimiento>>("/movimientos", { params });
      setDatos(res.data);
      setError(null);
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [filtro, tipo, pagina, filas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    api
      .get<Catalogos>("/inventario/catalogos")
      .then((res) => setCatalogos(res.data))
      .catch(() => undefined);
  }, []);

  const abrirDetalle = async (id: number) => {
    try {
      const res = await api.get(`/movimientos/${id}`);
      setFichaMov(res.data);
    } catch {
      setFichaMov(null);
    }
  };

  return (
    <Box>
      <PageHeader
        titulo="Movimientos"
        subtitulo="Kardex y trazabilidad de movimientos patrimoniales"
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Buscar movimiento…"
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
          label="Tipo de movimiento"
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
            setPagina(0);
          }}
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
        <Box sx={{ mb: 2, color: "error.main", fontSize: "0.82rem" }}>{error}</Box>
      )}

      <Paper
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}
      >
        <TableContainer>
          <Table size="small" sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F1F2F5" }}>
                {["Código", "Movimiento", "Fecha", "Bien", "Artículo", "Estado", "", ""].map((h) => (
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
                    No hay movimientos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                datos.data.map((m) => (
                  <TableRow key={m.IdMovimiento} hover>
                    <TableCell sx={{ fontFamily: "Consolas, monospace", fontSize: "0.8rem" }}>
                      {m.CodigoMovimiento}
                    </TableCell>
                    <TableCell>{m.NombreMovimiento ?? "—"}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatearFecha(m.FechaMovimiento)}</TableCell>
                    <TableCell sx={{ fontFamily: "Consolas, monospace" }}>{m.CodigoInterno ?? "—"}</TableCell>
                    <TableCell>{m.NombreArticulo ?? "—"}</TableCell>
                    <TableCell>
                      <EstadoTipo tipo={m.Estado ?? undefined} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          color: "#6B7280",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.Observacion ?? ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => abrirDetalle(m.IdMovimiento)}
                        sx={{ textTransform: "none", color: "#8B0000" }}
                      >
                        Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ borderTop: "1px solid", borderColor: "divider", px: 2, py: 1, display: "flex", justifyContent: "flex-end", fontSize: "0.78rem", color: "#6B7280" }}>
          {datos.total} movimientos
        </Box>
      </Paper>

      <Dialog open={!!fichaMov} onClose={() => setFichaMov(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>
          Movimiento {String(fichaMov?.cabecera?.CodigoMovimiento ?? "")}
        </DialogTitle>
        <DialogContent>
          {fichaMov && (
            <>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableBody>
                    {[
                      ["Tipo", fichaMov.cabecera.NombreMovimiento],
                      ["Fecha", fichaMov.cabecera.FechaMovimiento && formatearFecha(String(fichaMov.cabecera.FechaMovimiento))],
                      ["Usuario", fichaMov.cabecera.Usuario],
                      ["Estado", fichaMov.cabecera.Estado],
                    ].map(([k, v]) => (
                      <TableRow key={String(k)}>
                        <TableCell sx={{ color: "#5c6470", fontWeight: 600, width: 140 }}>{String(k)}</TableCell>
                        <TableCell>{v !== null && v !== undefined && v !== "" ? String(v) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", mb: 1 }}>
                Detalle
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F1F2F5" }}>
                      {["Bien", "Estado antes", "Estado después", "Ubicación antes", "Ubicación después", "Responsable antes", "Responsable después"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase" }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(fichaMov.detalle ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ color: "#5c6470" }}>
                          Sin detalle.
                        </TableCell>
                      </TableRow>
                    )}
                    {(fichaMov.detalle ?? []).map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>{String(d.CodigoInterno ?? "—")}</TableCell>
                        <TableCell>{String(d.EstadoAntes ?? "—")}</TableCell>
                        <TableCell>{String(d.EstadoDespues ?? "—")}</TableCell>
                        <TableCell>{String(d.UbicacionAntes ?? "—")}</TableCell>
                        <TableCell>{String(d.UbicacionDespues ?? "—")}</TableCell>
                        <TableCell>{String(d.ResponsableAntes ?? "—")}</TableCell>
                        <TableCell>{String(d.ResponsableDespues ?? "—")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFichaMov(null)} sx={{ textTransform: "none" }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}