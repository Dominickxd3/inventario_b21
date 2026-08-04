import { estadoBien } from '../utils/estados';

export default function EstadoBienChip({ nombre }: { nombre?: string | null }) {
  const e = estadoBien(nombre);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: e.color, backgroundColor: e.fondo }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: e.color }}
      />
      {e.texto}
    </span>
  );
}