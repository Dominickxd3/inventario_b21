import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { router } from '../routes';

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif',
    button: { textTransform: 'none' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { color: '#1a1d21' },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>    </ThemeProvider>
  );
}