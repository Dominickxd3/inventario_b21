"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Grid,
} from "@mui/material";
import {
  ArrowLeft,
  Boxes,
  MapPin,
  User,
  Barcode,
  FileText,
  ImageIcon,
  QrCode,
  History,
} from "lucide-react";
import { api, obtenerMensajeError } from "@/services/api";
import type { FichaBien } from "@/types";
import { EstadoChip } from "@/utils/estados";
import { formatearFecha, formatearMoneda, texto } from "@/utils/formato";

export default function FichaBienPage() {
  const params = useParams<{ codigo: string }>();
  const router = useRouter();
  const [ficha, setFicha] = useState<FichaBien | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await api.get<FichaBien>(`/inventario/bienes/${params.codigo}`);
      setFicha(res.data);
      setError(null);
    } catch (e) {
      setError(obtenerMensajeError(e));
    }
  }, [params.codigo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error) {
    return (
      <Box sx={{ p: 4, color: "error.main" }}>
        {error}
        <Button sx={{ mt: 2, display: "block", textTransform: "none" }} onClick={() => router.push("/inventario")}>
          ← Volver al inventario
        </Button>
      </Box>
    );
  }

  if (!ficha) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  const b = ficha.bien;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Button
          size="small"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => router.push("/inventario")}
          sx={{ textTransform: "none", color: "#374151" }}
        >
          Inventario
        </Button>
        <Chip
          label={b.CodigoInterno}
          sx={{ fontFamily: "Consolas, monospace", backgroundColor: "#111827", color: "#FFFFFF", fontWeight: 600 }}
        />
        <EstadoChip nombre={b.NombreEstado} />
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3, mb: 2 }}
          >
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <Box
                sx={{
                  width: 140,
                  height: 140,
                  borderRadius: 2,
                  backgroundColor: "#F1F2F5",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9CA3AF",
                  flexShrink: 0,
                }}
              >
                <Boxes size={44} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {b.NombreArticulo}
                </Typography>
                <Typography sx={{ color: "#374151", fontSize: "0.88rem", mb: 1.5 }}>
                  {b.Descripcion || "Sin descripción registrada."}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {b.TipoControl && <Chip size="small" label={b.TipoControl} variant="outlined" />}
                  {b.NombreMarca && <Chip size="small" label={b.NombreMarca} />}
                  {b.NombreModelo && <Chip size="small" label={b.NombreModelo} />}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Grid container spacing={2}>
              {[
                { icon: <Barcode size={15} />, label: "Serie", valor: b.NumeroSerie ?? "—" },
                { icon: <Boxes size={15} />, label: "Patrimonial", valor: b.CodigoPatrimonial ?? "—" },
                { icon: <MapPin size={15} />, label: "Ubicación", valor: b.NombreUbicacion ?? "—" },
                { icon: <User size={15} />, label: "Responsable", valor: b.Responsable ?? "—" },
                { icon: <History size={15} />, label: "Ingreso", valor: formatearFecha(b.FechaIngreso) },
                { icon: <Boxes size={15} />, label: "Valor de adquisición", valor: formatearMoneda((b as { ValorAdquisicion?: number }).ValorAdquisicion) },
              ].map((f) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={f.label}>
                  <Box
                    sx={{
                      padding: "10px 12px",
                      borderRadius: 1.5,
                      backgroundColor: "#FAFAFB",
                      border: "1px solid #EEF0F2",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#6B7280", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
                      {f.icon}
                      {f.label}
                    </Box>
                    <Box sx={{ fontSize: "0.88rem", fontWeight: 600, color: "#111827" }}>{f.valor}</Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3, mb: 2 }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <History size={16} /> Trazabilidad del bien
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#F1F2F5" }}>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Movimiento</TableCell>
                    <TableCell>Detalle</TableCell>
                    <TableCell>Registrado por</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(ficha.kardex ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ color: "#5c6470" }}>
                        Sin movimientos registrados.
                      </TableCell>
                    </TableRow>
                  )}
                  {(ficha.kardex ?? []).map((k, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatearFecha(k.Fecha ?? k.FechaMovimiento)}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Consolas, monospace" }}>
                        {k.CodigoMovimiento ?? "—"}
                      </TableCell>
                      <TableCell>{texto(k.Detalle ?? k.NombreMovimiento)}</TableCell>
                      <TableCell>{texto(k.UsuarioRegistro)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3, mb: 2 }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2 }}>
              Cambios de estado y responsable
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#F1F2F5" }}>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Estado anterior</TableCell>
                    <TableCell>Estado nuevo</TableCell>
                    <TableCell>Responsable anterior</TableCell>
                    <TableCell>Responsable nuevo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(ficha.historialEstado ?? []).length === 0 &&
                    (ficha.historialAsignacion ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ color: "#5c6470" }}>
                          Sin cambios registrados.
                        </TableCell>
                      </TableRow>
                    )}
                  {(ficha.historialEstado ?? []).map((h, i) => (
                    <TableRow key={`e${i}`}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatearFecha(h.FechaMovimiento ?? h.Fecha)}
                      </TableCell>
                      <TableCell>{h.EstadoAntes ?? h.NombreEstado ?? "—"}</TableCell>
                      <TableCell>{h.EstadoDespues ?? "—"}</TableCell>
                      <TableCell>{h.ResponsableAntes ?? "—"}</TableCell>
                      <TableCell>{h.ResponsableDespues ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {(ficha.historialAsignacion ?? []).map((h, i) => (
                    <TableRow key={`a${i}`}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatearFecha(h.FechaAsignacion ?? h.Fecha)}
                      </TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>{h.Bombero ?? h.ResponsableDespues ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3, mb: 2 }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <QrCode size={16} /> Código QR B21
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <img
                src={`/api/inventario/bienes/${b.CodigoInterno}/qr/png`}
                alt={`QR ${b.CodigoInterno}`}
                style={{ width: 180, height: 180, borderRadius: 10, border: "1px solid #E5E7EB" }}
              />
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3, mb: 2 }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <ImageIcon size={16} /> Fotos
            </Typography>
            {(ficha.fotos ?? []).length === 0 ? (
              <Typography sx={{ color: "#5c6470", fontSize: "0.82rem" }}>
                Sin fotos registradas.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                {(ficha.fotos ?? []).map((f, i) => (
                  <img
                    key={i}
                    src={f.RutaArchivo ?? `https://drive.google.com/thumbnail?id=${f.IdArchivoGoogleDrive}`}
                    alt={f.NombreArchivoOriginal ?? `Foto ${i + 1}`}
                    style={{
                      width: 96,
                      height: 96,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                    }}
                  />
                ))}
              </Box>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3 }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <FileText size={16} /> Documentos
            </Typography>
            {(ficha.documentos ?? []).length === 0 ? (
              <Typography sx={{ color: "#5c6470", fontSize: "0.82rem" }}>
                Sin documentos registrados.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {(ficha.documentos ?? []).map((d, i) => (
                  <a
                    key={i}
                    href={
                      d.RutaArchivo ??
                      `https://drive.google.com/file/d/${d.IdArchivoGoogleDrive}/view`
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "0.82rem",
                      color: "#8B0000",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FileText size={14} />
                    {d.NombreArchivoOriginal ?? d.TipoDocumento ?? "Documento"}
                  </a>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}