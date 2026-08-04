/** Formatea fechas ISO a DD/MM/AAAA HH:mm (hora local). */
export function formatearFecha(fecha?: string | null): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatearFechaCorta(fecha?: string | null): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatearMoneda(valor?: number | null): string {
  if (valor === null || valor === undefined) return '—';
  return valor.toLocaleString('es-PE', {
    style: 'currency',
    currency: 'PEN',
  });
}
