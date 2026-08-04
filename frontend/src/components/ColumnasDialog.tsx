"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
} from "@mui/material";
import type { ColumnDef } from "@tanstack/react-table";

interface Props<T> {
  abierto: boolean;
  alCerrar: () => void;
  columnas: ColumnDef<T, unknown>[];
  visibles: string[];
  alCambiar: (visibles: string[]) => void;
}

export default function ColumnasDialog<T>({
  abierto,
  alCerrar,
  columnas,
  visibles,
  alCambiar,
}: Props<T>) {
  const ids = columnas
    .map((c) => (c as { id?: string }).id)
    .filter(Boolean) as string[];

  const toggle = (id: string) => {
    if (visibles.includes(id)) {
      alCambiar(visibles.filter((v) => v !== id));
    } else {
      alCambiar([...visibles, id]);
    }
  };

  useEffect(() => {
    if (abierto && visibles.length === 0) {
      alCambiar(ids);
    }
  }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={abierto} onClose={alCerrar} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>
        Columnas visibles
      </DialogTitle>
      <DialogContent>
        <FormGroup>
          {ids.map((id) => {
            const def = columnas.find((c) => (c as { id?: string }).id === id);
            const label =
              (def as { label?: string } | undefined)?.label ?? String(id);
            return (
              <FormControlLabel
                key={String(id)}
                control={
                  <Checkbox
                    checked={visibles.includes(id)}
                    onChange={() => toggle(String(id))}
                    size="small"
                  />
                }
                label={<Typography sx={{ fontSize: "0.85rem" }}>{label}</Typography>}
              />
            );
          })}
        </FormGroup>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={alCerrar} sx={{ textTransform: "none" }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}