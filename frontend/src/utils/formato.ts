import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export function formatearFecha(fecha?: string | null): string {
  if (!fecha) return "—";
  const d = dayjs(fecha);
  if (!d.isValid()) return "—";
  return d.format("DD/MM/YYYY HH:mm");
}

export function formatearFechaCorta(fecha?: string | null): string {
  if (!fecha) return "—";
  const d = dayjs(fecha);
  if (!d.isValid()) return "—";
  return d.format("DD/MM/YYYY");
}

export function formatearMoneda(valor?: number | null): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(valor);
}

export function mesNombre(mes: number): string {
  const nombres = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  return nombres[mes - 1] ?? mes.toString();
}

export function texto(valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  return String(valor);
}