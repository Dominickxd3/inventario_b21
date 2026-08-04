"use client";

import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from "@mui/material";
import PageHeader from "@/components/PageHeader";
import { api, obtenerMensajeError } from "@/services/api";
import type { Catalogos } from "@/types";
import { formatearFecha, formatearMoneda } from "@/utils/formato";
import { EstadoTipo } from "@/utils/estados";

export default function ReportesPage() {
  const [pestana, setPestana] = useState(0);
  const [filas, setFilas] = useState<Record<string, unknown>[]>([]);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipo, setTipo] = useState("");

  useEffect(() => {
    api
      .get<Catalogos>("/inventario/catalogos")
      .then((res) => setCatalogos(res.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pestana]);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      let res;
      if (pestana === 0) res = await api.get("/reportes/inventario");
      else if (pestana === 1) res = await api.get("/reportes/prestamos");
      else if (pestana === 2) res = await api.get("/reportes/mantenimiento");
      else if (pestana === 3) {
        const params: Record<string, string> = {};
        if (fechaInicio) params.fechaInicio = fechaInicio;
        if (fechaFin) params.fechaFin = fechaFin;
        if (tipo) params.idTipoMovimiento = tipo;
        const r = await api.get("/reportes/movimientos", { params });
        res = { data: r.data.detalle };
      } else {
        const r = await api.get("/reportes/responsables");
        res = { data: r.data.resumen };
      }
      const datos = (res.data ?? []) as Record<string, unknown>[];
      setFilas(datos);
      const claves = new Set<string>();
      datos.forEach((f) => Object.keys(f).forEach((k) => claves.add(k)));
      setColumnas(Array.from(claves));
    } catch (e) {
      setError(obtenerMensajeError(e));
      setFilas([]);
      setColumnas([]);
    } finally {
      setCargando(false);
    }
  };

  const formatearCelda = (v: unknown): string => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "number") return Number.isInteger(v) ? String(v) : formatearMoneda(v);
    if (typeof v === "boolean") return v ? "Sí" : "No";
    return String(v);
  };

  return (
    <Box>
      <PageHeader titulo="Reportes" subtitulo="Reportes institucionales de inventario" />

      <Tabs
        value={pestana}
        onChange={(_e, v) => setPestana(v)}
        sx={{
          mb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
          "& .Mui-selected": { color: "#8B0000" },
        }}
      >
        <Tab label="Inventario" />
        <Tab label="Préstamos" />
        <Tab label="Mantenimiento" />
        <Tab label="Movimientos" />
        <Tab label="Responsables" />
      </Tabs>

      {pestana === 3 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2.5 }}>
          <TextField
            size="small"
            type="date"
            label="Desde"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            size="small"
            label="Tipo de movimiento"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {catalogos?.tiposMovimiento.map((t) => (
              <MenuItem key={t.IdTipoMovimiento} value={t.IdTipoMovimiento}>
                {t.NombreMovimiento}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            onClick={cargar}
            sx={{ borderColor: "#8B0000", color: "#8B0000", textTransform: "none" }}
          >
            Filtrar
          </Button>
        </Box>
      )}

      {error && <Box sx={{ mb: 2, color: "error.main", fontSize: "0.82rem" }}>{error}</Box>}

      <Paper
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}
      >
        <TableContainer>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F1F2F5" }}>
                {columnas.map((c) => (
                  <TableCell
                    key={c}
                    sx={{ fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase", color: "#374151" }}
                  >
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={Math.max(columnas.length, 1)} align="center" sx={{ py: 6, color: "#9CA3AF" }}>
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : filas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(columnas.length, 1)} align="center" sx={{ py: 6, color: "#9CA3AF" }}>
                    Sin resultados para este reporte.
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((f, i) => (
                  <TableRow key={i} hover>
                    {columnas.map((c) => {
                      const v = f[c];
                      if (c.toLowerCase().includes("estado") && typeof v === "string") {
                        return (
                          <TableCell key={c}>
                            <EstadoTipo tipo={v} />
                          </TableCell>
                        );
                      }
                      if (c.toLowerCase().includes("fecha") && typeof v === "string") {
                        return (
                          <TableCell key={c} sx={{ whiteSpace: "nowrap" }}>
                            {formatearFecha(v)}
                          </TableCell>
                        );
                      }
                      return <TableCell key={c}>{formatearCelda(v)}</TableCell>;
                    })}
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
          {filas.length} registros
        </Box>
      </Paper>
    </Box>
  );
}