"use client";

import { memo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  CircularProgress,
  Box,
} from "@mui/material";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Props<T> {
  columnas: ColumnDef<T, unknown>[];
  filas: T[];
  cargando?: boolean;
  total?: number;
  pagina?: number;
  filasPorPagina?: number;
  onCambiarPagina?: (pagina: number) => void;
  onCambiarFilasPorPagina?: (filas: number) => void;
  paginacionCliente?: boolean;
  emptyMessage?: string;
  getRowId?: (fila: T) => number | string;
  onFilaClick?: (fila: T) => void;
}

function alignCelda(meta: unknown): "left" | "right" | "center" | "inherit" {
  const a = (meta as { align?: string } | undefined)?.align;
  if (a === "right" || a === "center" || a === "inherit") return a;
  return "left";
}

function DataTableImpl<T>({
  columnas,
  filas,
  cargando = false,
  total = 0,
  pagina = 0,
  filasPorPagina = 10,
  onCambiarPagina,
  onCambiarFilasPorPagina,
  paginacionCliente = false,
  emptyMessage = "No hay registros.",
  getRowId,
  onFilaClick,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: filas,
    columns: columnas,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: paginacionCliente ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: { pageSize: paginacionCliente ? filasPorPagina : 50 },
    },
  });

  const filasVisibles = paginacionCliente ? table.getRowModel().rows : table.getRowModel().rows;

  return (
    <Paper
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}
    >
      <TableContainer>
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} sx={{ backgroundColor: "#F1F2F5" }}>
                {hg.headers.map((h) => {
                  const ordenable = h.column.getCanSort();
                  const sorted = h.column.getIsSorted();
                  return (
                    <TableCell
                      key={h.id}
                      align={alignCelda(h.column.columnDef.meta)}
                      onClick={ordenable ? h.column.getToggleSortingHandler() : undefined}
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "#374151",
                        whiteSpace: "nowrap",
                        cursor: ordenable ? "pointer" : "default",
                        userSelect: "none",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {ordenable &&
                          (sorted === "asc" ? (
                            <ArrowUp size={13} />
                          ) : sorted === "desc" ? (
                            <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={13} style={{ opacity: 0.4 }} />
                          ))}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={columnas.length} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : filasVisibles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas.length} align="center" sx={{ py: 8, color: "#5c6470" }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filasVisibles.map((fila, i) => {
                const f = fila.original as T;
                return (
                  <TableRow
                    key={getRowId ? getRowId(f) : i}
                    hover
                    onClick={onFilaClick ? () => onFilaClick(f) : undefined}
                    sx={{
                      cursor: onFilaClick ? "pointer" : "default",
                      "&:last-child td": { borderBottom: 0 },
                    }}
                  >
                    {fila.getVisibleCells().map((c) => (
                      <TableCell
                        key={c.id}
                        align={alignCelda(c.column.columnDef.meta)}
                        sx={{ fontSize: "0.82rem", py: 1, whiteSpace: "nowrap" }}
                      >
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {paginacionCliente && !cargando && (
        <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
          <TablePagination
            component="div"
            count={table.getFilteredRowModel().rows.length}
            page={table.getState().pagination.pageIndex}
            rowsPerPage={table.getState().pagination.pageSize}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, p) => table.setPageIndex(p)}
            onRowsPerPageChange={(e) => table.setPageSize(Number(e.target.value))}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Box>
      )}

      {!paginacionCliente && onCambiarPagina && !cargando && (
        <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
          <TablePagination
            component="div"
            count={total}
            page={pagina}
            rowsPerPage={filasPorPagina}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, p) => onCambiarPagina(p)}
            onRowsPerPageChange={(e) => {
              onCambiarFilasPorPagina?.(Number(e.target.value));
            }}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Box>
      )}
    </Paper>
  );
}

export default memo(DataTableImpl) as typeof DataTableImpl;