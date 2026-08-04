import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flame, Lock, User } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { obtenerMensajeError } from '../../services/api';

const schema = z.object({
  usuario: z.string().min(1, 'Ingrese su usuario.'),
  password: z.string().min(1, 'Ingrese su contraseña.'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { usuario: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setEnviando(true);
    setError(null);
    try {
      await login(values.usuario, values.password);
      const destino = (location.state as { from?: { pathname: string } })?.from
        ?.pathname;
      navigate(destino ?? '/', { replace: true });
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #1a1d21 0%, #2a2d33 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: 400,
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            backgroundColor: '#8c1f28',
            color: '#fff',
            px: 3.5,
            py: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: '11px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={26} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.15 }}>
              Sistema de Inventario
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', opacity: 0.85 }}>
              y Trazabilidad — Compañía de Bomberos Rímac N°21
            </Typography>
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ px: 3.5, py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, py: 0.5 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Usuario"
            autoFocus
            size="small"
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <User size={16} style={{ marginRight: 8, color: '#9aa3ad' }} />
                ),
              },
            }}
            {...register('usuario')}
            error={!!errors.usuario}
            helperText={errors.usuario?.message}
          />

          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            size="small"
            sx={{ mb: 2.5 }}
            slotProps={{
              input: {
                startAdornment: (
                  <Lock size={16} style={{ marginRight: 8, color: '#9aa3ad' }} />
                ),
              },
            }}
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={enviando}
            sx={{
              py: 1.1,
              backgroundColor: '#8c1f28',
              '&:hover': { backgroundColor: '#6d171e' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {enviando ? 'Ingresando…' : 'Ingresar al sistema'}
          </Button>

          <Typography
            sx={{
              mt: 3,
              fontSize: '0.72rem',
              color: '#9aa3ad',
              textAlign: 'center',
            }}
          >
            Sistema institucional de gestión patrimonial
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
