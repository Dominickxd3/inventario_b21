"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
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
  Typography,
  Chip,
} from "@mui/material";
import PageHeader from "@/components/PageHeader";
import { api, obtenerMensajeError } from "@/services/api";
import { usePermiso } from "@/hooks/usePermiso";
import { formatearFecha } from "@/utils/formato";

interface FilaUsuario {
  IdUsuario: number;
  Usuario: string;
  Estado: number | boolean;
  UltimoAcceso: Date | null;
  FechaRegistro: Date;
  IdBombero: number | null;
  CodigoBombero: string | null;
  DNI: string | null;
  Nombres: string | null;
  Apellidos: string | null;
  Roles: string | null;
}

interface DetalleUsuario extends FilaUsuario {
  roles: { IdRol: number; NombreRol: string }[];
  permisos: { IdPermiso: number; NombrePermiso: string; Modulo: string }[];
}

export default function UsuariosPage() {
  const puedeAdministrar = usePermiso("Administrar usuarios");
  const [datos, setDatos] = useState<FilaUsuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleUsuario | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get<FilaUsuario[]>("/usuarios");
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

  const abrirDetalle = async (id: number) => {
    setDetalle(null);
    try {
      const res = await api.get<DetalleUsuario>(`/usuarios/${id}`);
      setDetalle(res.data);
    } catch (e) {
      setError(obtenerMensajeError(e));
    }
  };

  const toggleEstado = async (u: FilaUsuario) => {
    try {
      await api.patch(`/usuarios/${u.IdUsuario}/estado`, { estado: !u.Estado });
      cargar();
    } catch (e) {
      setError(obtenerMensajeError(e));
    }
  };

  return (
    <Box>
      <PageHeader titulo="Usuarios" subtitulo="Gestión de usuarios del sistema" />

      {error && <Box sx={{ mb: 2, color: "error.main", fontSize: "0.82rem" }}>{error}</Box>}

      <Paper
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}
      >
        <TableContainer>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F1F2F5" }}>
                {["Usuario", "Bombero", "DNI", "Roles", "Estado", "Último acceso", "Acciones"].map((h) => (
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
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "#9CA3AF" }}>
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : datos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "#9CA3AF" }}>
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                datos.map((u) => (
                  <TableRow key={u.IdUsuario} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{u.Usuario}</TableCell>
                    <TableCell>
                      {u.Nombres || u.Apellidos ? `${u.Nombres ?? ""} ${u.Apellidos ?? ""}` : u.CodigoBombero ?? "—"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Consolas, monospace" }}>{u.DNI ?? "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {(u.Roles ?? "")
                          .split(",")
                          .filter(Boolean)
                          .map((r) => (
                            <Chip
                              key={r}
                              label={r.trim()}
                              size="small"
                              sx={{ fontSize: "0.65rem", height: 20, bgcolor: "#F1F2F5", color: "#374151" }}
                            />
                          ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 999,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          backgroundColor: u.Estado ? "#E3F5E9" : "#FDE8E8",
                          color: u.Estado ? "#1E7A43" : "#B42318",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.Estado ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {u.UltimoAcceso ? formatearFecha(String(u.UltimoAcceso)) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => abrirDetalle(u.IdUsuario)}
                        sx={{ textTransform: "none", color: "#8B0000" }}
                      >
                        Ver
                      </Button>
                      {puedeAdministrar && (
                        <Button
                          size="small"
                          onClick={() => toggleEstado(u)}
                          sx={{ textTransform: "none", color: "#6B7280" }}
                        >
                          {u.Estado ? "Desactivar" : "Activar"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!detalle} onClose={() => setDetalle(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>
          {detalle?.Nombres || detalle?.Apellidos
            ? `${detalle?.Nombres ?? ""} ${detalle?.Apellidos ?? ""}`
            : detalle?.Usuario}
        </DialogTitle>
        <DialogContent>
          {detalle && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, fontSize: "0.85rem" }}>
              <Typography>
                <strong>Código bombero:</strong> {detalle.CodigoBombero ?? "—"}
              </Typography>
              <Typography>
                <strong>DNI:</strong> {detalle.DNI ?? "—"}
              </Typography>
              <Typography>
                <strong>Usuario:</strong> {detalle.Usuario}
              </Typography>
              <Typography>
                <strong>Registro:</strong>                 {formatearFecha(String(detalle.FechaRegistro))}
              </Typography>
              <Typography sx={{ mt: 1, fontWeight: 700 }}>Roles</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {detalle.roles.map((r) => (
                  <Chip key={r.IdRol} label={r.NombreRol} size="small" sx={{ fontSize: "0.7rem" }} />
                ))}
              </Box>
              <Typography sx={{ mt: 1, fontWeight: 700 }}>Permisos</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {detalle.permisos.map((p) => (
                  <Chip
                    key={p.IdPermiso}
                    label={`${p.Modulo}: ${p.NombrePermiso}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.65rem" }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetalle(null)} sx={{ textTransform: "none" }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}