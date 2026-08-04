import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';

interface Props {
  permiso: string;
  children: ReactNode;
}

/** Redirige al dashboard si el usuario no posee el permiso indicado. */
export function RequirePermiso({ permiso, children }: Props) {
  const { tienePermiso } = useAuth();

  if (!tienePermiso(permiso)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
