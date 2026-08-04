import type { ReactNode } from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface Props {
  titulo: string;
  valor: ReactNode;
  icono?: ReactNode;
  color?: string;
}

export default function StatCard({ titulo, valor, icono, color = '#8c1f28' }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 2.5,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {icono && (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            backgroundColor: `${color}14`,
            flexShrink: 0,
          }}
        >
          {icono}
        </Box>
      )}
      <Box>
        <Typography variant="caption" sx={{ color: '#5c6470', fontWeight: 500 }}>
          {titulo}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {valor}
        </Typography>
      </Box>
    </Paper>
  );
}
