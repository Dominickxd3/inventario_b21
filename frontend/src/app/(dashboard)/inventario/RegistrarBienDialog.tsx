"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, obtenerMensajeError } from "@/services/api";
import type { Articulo, Catalogos } from "@/types";

const schema = z.object({
  idArticulo: z.string().min(1, "Seleccione el artículo."),
  codigoPatrimonial: z.string().optional(),
  numeroSerie: z.string().optional(),
  idMarca: z.string().optional(),
  idModelo: z.string().optional(),
  descripcion: z.string().optional(),
  idEstado: z.string().min(1, "Seleccione el estado."),
  idUbicacion: z.string().optional(),
  idResponsableActual: z.string().optional(),
  fechaIngreso: z.string().optional(),
  anioFabricacion: z.string().optional(),
  valorAdquisicion: z.string().optional(),
  observaciones: z.string().optional(),
});

type FormBien = z.infer<typeof schema>;

interface Props {
  abierto: boolean;
  alCerrar: () => void;
  onRegistrado: () => void;
  catalogos: Catalogos | null;
}

export default function RegistrarBienDialog({
  abierto,
  alCerrar,
  onRegistrado,
  catalogos,
}: Props) {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [bomberos, setBomberos] = useState<{ IdBombero: number; Nombre: string }[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormBien>({ resolver: zodResolver(schema) });

  const idMarca = watch("idMarca");

  useEffect(() => {
    if (!abierto) return;
    setMensaje(null);
    reset();
    api
      .get<Articulo[]>("/inventario/articulos")
      .then((res) => setArticulos(res.data))
      .catch(() => undefined);
    api
      .get<{ IdBombero: number; Nombres: string; Apellidos: string; Usuario: string }[]>(
        "/usuarios",
      )
      .then((res) =>
        setBomberos(
          res.data.map((u) => ({
            IdBombero: u.IdBombero,
            Nombre: [u.Nombres, u.Apellidos].filter(Boolean).join(" ").trim() || u.Usuario,
          })),
        ),
      )
      .catch(() => undefined);
  }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps

  const registrar = async (values: FormBien) => {
    setGuardando(true);
    setMensaje(null);
    try {
      await api.post("/inventario/bienes", {
        idArticulo: Number(values.idArticulo),
        codigoPatrimonial: values.codigoPatrimonial || null,
        numeroSerie: values.numeroSerie || null,
        idMarca: values.idMarca ? Number(values.idMarca) : null,
        idModelo: values.idModelo ? Number(values.idModelo) : null,
        descripcion: values.descripcion ?? null,
        idEstado: Number(values.idEstado),
        idUbicacion: values.idUbicacion ? Number(values.idUbicacion) : null,
        idResponsableActual: values.idResponsableActual
          ? Number(values.idResponsableActual)
          : null,
        fechaIngreso: values.fechaIngreso || null,
        anioFabricacion: values.anioFabricacion ? Number(values.anioFabricacion) : null,
        valorAdquisicion: values.valorAdquisicion ? Number(values.valorAdquisicion) : null,
        observaciones: values.observaciones ?? null,
      });
      onRegistrado();
      alCerrar();
    } catch (e) {
      setMensaje(obtenerMensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const modelosDeMarca =
    catalogos?.modelos.filter((m) => String(m.IdMarca) === idMarca) ?? [];

  return (
    <Dialog open={abierto} onClose={alCerrar} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>
        Registrar bien patrimonial
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {mensaje && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 1,
              backgroundColor: "#FDE8E8",
              color: "#B42318",
              fontSize: "0.8rem",
            }}
          >
            {mensaje}
          </Box>
        )}
        <Box
          component="form"
          id="form-registrar-bien"
          onSubmit={handleSubmit(registrar)}
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            select
            size="small"
            label="Artículo"
            {...register("idArticulo")}
            error={!!errors.idArticulo}
            helperText={errors.idArticulo?.message}
          >
            {articulos.map((a) => (
              <MenuItem key={a.IdArticulo} value={String(a.IdArticulo)}>
                {a.CodigoArticulo} — {a.NombreArticulo} ({a.TipoControl})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Estado"
            {...register("idEstado")}
            error={!!errors.idEstado}
            helperText={errors.idEstado?.message}
          >
            {catalogos?.estados.map((e) => (
              <MenuItem key={e.IdEstado} value={String(e.IdEstado)}>
                {e.NombreEstado}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              size="small"
              label="Código patrimonial"
              sx={{ flex: 1 }}
              {...register("codigoPatrimonial")}
            />
            <TextField
              size="small"
              label="Número de serie"
              sx={{ flex: 1 }}
              {...register("numeroSerie")}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              select
              size="small"
              label="Marca"
              sx={{ flex: 1 }}
              {...register("idMarca")}
              helperText={errors.idMarca?.message}
            >
              <MenuItem value="">— Sin marca —</MenuItem>
              {catalogos?.marcas.map((m) => (
                <MenuItem key={m.IdMarca} value={String(m.IdMarca)}>
                  {m.NombreMarca}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Modelo"
              sx={{ flex: 1 }}
              disabled={!idMarca}
              {...register("idModelo")}
              helperText={errors.idModelo?.message}
            >
              <MenuItem value="">— Sin modelo —</MenuItem>
              {modelosDeMarca.map((m) => (
                <MenuItem key={m.IdModelo} value={String(m.IdModelo)}>
                  {m.NombreModelo}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              select
              size="small"
              label="Ubicación"
              sx={{ flex: 1 }}
              {...register("idUbicacion")}
              helperText={errors.idUbicacion?.message}
            >
              <MenuItem value="">— Sin ubicación —</MenuItem>
              {catalogos?.ubicaciones.map((u) => (
                <MenuItem key={u.IdUbicacion} value={String(u.IdUbicacion)}>
                  {u.NombreUbicacion}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Responsable"
              sx={{ flex: 1 }}
              {...register("idResponsableActual")}
              helperText={errors.idResponsableActual?.message}
            >
              <MenuItem value="">— Sin responsable —</MenuItem>
              {bomberos.map((b) => (
                <MenuItem key={b.IdBombero} value={String(b.IdBombero)}>
                  {b.Nombre}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              type="date"
              size="small"
              label="Fecha de ingreso"
              sx={{ flex: 1 }}
              slotProps={{ inputLabel: { shrink: true } }}
              {...register("fechaIngreso")}
            />
            <TextField
              type="number"
              size="small"
              label="Año fabricación"
              sx={{ flex: 1 }}
              slotProps={{ htmlInput: { min: 1900, max: 2200 } }}
              {...register("anioFabricacion")}
            />
            <TextField
              type="number"
              size="small"
              label="Valor de adquisición"
              sx={{ flex: 1 }}
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              {...register("valorAdquisicion")}
            />
          </Box>

          <TextField
            size="small"
            label="Descripción"
            multiline
            rows={2}
            {...register("descripcion")}
          />
          <TextField
            size="small"
            label="Observaciones"
            multiline
            rows={2}
            {...register("observaciones")}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={alCerrar} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="form-registrar-bien"
          variant="contained"
          disabled={guardando}
        >
          {guardando ? "Registrando…" : "Registrar bien"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}