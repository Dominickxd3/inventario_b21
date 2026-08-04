import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({
  titulo,
  subtitulo,
  acciones,
  breadcrumb,
}: {
  titulo: string;
  subtitulo?: string;
  acciones?: ReactNode;
  breadcrumb?: { label: string; to?: string }[];
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1 flex items-center gap-1 text-xs text-gray-500">
            {breadcrumb.map((cr, i) => (
              <span key={cr.label} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 text-gray-400" />}
                {cr.to ? (
                  <Link to={cr.to} className="hover:text-b21-red">
                    {cr.label}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-700">{cr.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-0.5 text-sm text-gray-500">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </div>
  );
}
