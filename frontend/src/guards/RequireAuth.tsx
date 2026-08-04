import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
