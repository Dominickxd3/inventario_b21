import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { RequireAuth } from '../guards/RequireAuth';
import { RequirePermiso } from '../guards/RequirePermiso';
import Login from '../modules/auth/Login';
import Dashboard from '../modules/dashboard/Dashboard';
import Inventario from '../modules/inventario/Inventario';
import FichaBien from '../modules/inventario/FichaBien';
import Movimientos from '../modules/movimientos/Movimientos';
import Prestamos from '../modules/prestamos/Prestamos';
import Mantenimiento from '../modules/mantenimiento/Mantenimiento';
import Reportes from '../modules/reportes/Reportes';
import Usuarios from '../modules/usuarios/Usuarios';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: 'inventario',
        element: (
          <RequirePermiso permiso="Consultar inventario">
            <Inventario />
          </RequirePermiso>
        ),
      },
      {
        path: 'inventario/:codigo',
        element: (
          <RequirePermiso permiso="Consultar inventario">
            <FichaBien />
          </RequirePermiso>
        ),
      },
      { path: 'movimientos', element: <Movimientos /> },
      { path: 'prestamos', element: <Prestamos /> },
      { path: 'mantenimiento', element: <Mantenimiento /> },
      {
        path: 'reportes',
        element: (
          <RequirePermiso permiso="Generar reportes">
            <Reportes />
          </RequirePermiso>
        ),
      },
      {
        path: 'usuarios',
        element: (
          <RequirePermiso permiso="Administrar usuarios">
            <Usuarios />
          </RequirePermiso>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
