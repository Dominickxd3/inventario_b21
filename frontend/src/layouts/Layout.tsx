import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Handshake,
  Wrench,
  FileBarChart,
  Users,
  LogOut,
  Flame,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../app/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', permiso: null, icon: LayoutDashboard },
  { to: '/inventario', label: 'Inventario', permiso: 'Consultar inventario', icon: Package },
  { to: '/movimientos', label: 'Movimientos', permiso: null, icon: ArrowLeftRight },
  { to: '/prestamos', label: 'Préstamos', permiso: null, icon: Handshake },
  { to: '/mantenimiento', label: 'Mantenimiento', permiso: null, icon: Wrench },
  { to: '/reportes', label: 'Reportes', permiso: 'Generar reportes', icon: FileBarChart },
  { to: '/usuarios', label: 'Usuarios', permiso: 'Administrar usuarios', icon: Users },
];

export default function Layout() {
  const { usuario, logout, tienePermiso } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const items = useMemo(
    () => NAV.filter((n) => !n.permiso || tienePermiso(n.permiso)),
    [tienePermiso],
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <Box sx={{ width: 250, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '9px',
            backgroundColor: '#8c1f28',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <Flame size={20} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.1 }}>
            Inventario B21
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: '#5c6470' }}>
            Compañía de Bomberos Rímac N°21
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1.2, py: 1.5 }}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              end={item.to === '/'}
              sx={{
                borderRadius: '8px',
                mb: 0.3,
                px: 1.8,
                py: 0.9,
                '&.active': {
                  backgroundColor: '#8c1f28',
                  color: '#fff',
                  '& .MuiListItemIcon-root': { color: '#fff' },
                },
                '&:not(.active):hover': { backgroundColor: '#f1f2f4' },
              }}
              onClick={() => setAbierto(false)}
            >
              <ListItemIcon sx={{ minWidth: 34, color: '#5c6470' }}>
                <Icon size={19} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontSize: '0.85rem', fontWeight: 500 } } }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: '#1a1d21',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {usuario?.nombreCompleto?.slice(0, 1) ?? 'U'}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {usuario?.nombreCompleto}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#5c6470' }}>
              {usuario?.rol}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Cerrar sesión">
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{ color: '#5c6470', '&:hover': { color: '#8c1f28' } }}
          >
            <LogOut size={17} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar escritorio */}
      <Paper
        elevation={0}
        sx={{
          width: 250,
          borderRight: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
          display: { xs: 'none', md: 'block' },
          flexShrink: 0,
        }}
      >
        {sidebar}
      </Paper>

      {/* Sidebar móvil */}
      {abierto && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: { xs: 'flex', md: 'none' },
          }}
        >
          <Box
            onClick={() => setAbierto(false)}
            sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
          />
          <Paper
            elevation={8}
            sx={{ width: 260, borderRadius: 0, position: 'relative', height: '100%' }}
          >
            {sidebar}
          </Paper>
          <IconButton
            onClick={() => setAbierto(false)}
            sx={{ position: 'absolute', top: 10, left: 270, color: '#fff' }}
          >
            <X />
          </IconButton>
        </Box>
      )}

      {/* Contenido */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#fff',
          }}
        >
          <IconButton size="small" onClick={() => setAbierto(true)}>
            <Menu size={20} />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
            Inventario B21
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
