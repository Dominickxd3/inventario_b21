export interface EstadoChip {
  color: string;
  fondo: string;
  texto: string;
}

const ESTADOS: Record<string, EstadoChip> = {
  Nuevo: { color: '#37474f', fondo: '#eceff1', texto: 'Nuevo' },
  Operativo: { color: '#1b5e20', fondo: '#e8f5e9', texto: 'Operativo' },
  Averiado: { color: '#b26a00', fondo: '#fff8e1', texto: 'Averiado' },
  Mantenimiento: { color: '#0d47a1', fondo: '#e3f2fd', texto: 'Mantenimiento' },
  Prestado: { color: '#4a148c', fondo: '#f3e5f5', texto: 'Prestado' },
  'Dado de baja': { color: '#7b1fa2', fondo: '#fce4ec', texto: 'Dado de baja' },
  'No localizado': { color: '#b71c1c', fondo: '#ffebee', texto: 'No localizado' },
  'En evaluación': { color: '#4e342e', fondo: '#efebe9', texto: 'En evaluación' },
};

export function estadoBien(nombre?: string | null): EstadoChip {
  if (!nombre) {
    return { color: '#5c6470', fondo: '#eceef1', texto: '—' };
  }
  return ESTADOS[nombre] ?? { color: '#5c6470', fondo: '#eceef1', texto: nombre };
}
