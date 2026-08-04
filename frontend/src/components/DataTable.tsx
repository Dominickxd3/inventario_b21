import { useEffect, useState, type ReactNode } from 'react';
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
} from '@mui/material';

interface Columna<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
  render?: (fila: T) => ReactNode;
}

interface Props<T> {
  columnas: Columna<T>[];
  filas: T[];
  cargando?: boolean;
  total?: number;
  pagina?: number;
  filasPorPagina?: number;
  onCambiarPagina?: (pagina: number) => void;
  onCambiarFilasPorPagina?: (filas: number) => void;
  emptyMessage?: string;
  getRowId?: (fila: T) => number | string;
}

export default function DataTable<T>({
  columnas,
  filas,
  cargando = false,
  total = 0,
  pagina = 0,
  filasPorPagina = 10,
  onCambiarPagina,
  onCambiarFilasPorPagina,
  emptyMessage = 'No hay registros.',
  getRowId,
}: Props<T>) {
  const [page, setPage] = useState(pagina);
  const [rows, setRows] = useState(filasPorPagina);

  useEffect(() => setPage(pagina), [pagina]);

  const cambiarPagina = (_: unknown, nuevaPagina: number) => {
    setPage(nuevaPagina);
    onCambiarPagina?.(nuevaPagina);
  };

  const cambiarFilas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    setRows(v);
    onCambiarFilasPorPagina?.(v);
  };

  return (
    <Paper
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
    >
      <TableContainer>
        <Table size="small" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
              {columnas.map((c) => (
                <TableCell
                  key={c.key}
                  align={c.align ?? 'left'}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#5c6470',
                    whiteSpace: 'nowrap',
                    minWidth: c.minWidth,
                    py: 1.2,
                  }}
                >
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={columnas.length} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : filas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas.length} align="center" sx={{ py: 8, color: '#5c6470' }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filas.map((fila, i) => (
                <TableRow
                  key={getRowId ? getRowId(fila) : i}
                  hover
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  {columnas.map((c) => (
                    <TableCell
                      key={c.key}
                      align={c.align ?? 'left'}
                      sx={{ fontSize: '0.82rem', py: 1, whiteSpace: 'nowrap' }}
                    >
                      {c.render ? c.render(fila) : (fila as Record<string, unknown>)[c.key] as ReactNode}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rows}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={cambiarPagina}
          onRowsPerPageChange={cambiarFilas}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count}`
          }
        />
      </Box>
    </Paper>
  );
}
