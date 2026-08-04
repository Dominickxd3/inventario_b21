"use client";

import { createTheme } from "@mui/material/styles";

export const COLORS = {
  rojo: "#8B0000",
  rojoProfundo: "#B22222",
  rojoHover: "#6D0000",
  dorado: "#C8A951",
  carbon: "#111827",
  steel: "#374151",
  bg: "#F5F5F3",
  white: "#FFFFFF",
  operativo: "#1B5E20",
  mantenimiento: "#E65100",
  averiado: "#B71C1C",
  prestado: "#0D47A1",
  baja: "#546E7A",
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: COLORS.rojo,
      dark: COLORS.rojoHover,
      light: COLORS.rojoProfundo,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: COLORS.dorado,
      contrastText: COLORS.carbon,
    },
    background: {
      default: COLORS.bg,
      paper: COLORS.white,
    },
    text: {
      primary: COLORS.carbon,
      secondary: COLORS.steel,
    },
    divider: "rgba(0,0,0,0.08)",
  },
  typography: {
    fontFamily:
      '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.03em", fontSize: "2.25rem" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, fontSize: "0.9rem", letterSpacing: "0.02em" },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
    fontSize: 14,
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderRadius: 8,
          "&:hover": { boxShadow: "none" },
        },
        contained: {
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: COLORS.steel,
          backgroundColor: "transparent",
          borderBottom: "2px solid rgba(0,0,0,0.06)",
          padding: "10px 16px",
        },
        root: {
          borderBottom: "1px solid rgba(0,0,0,0.04)",
          padding: "10px 16px",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(139,0,0,0.02)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          fontSize: "0.72rem",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: COLORS.white,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: COLORS.rojo,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {},
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(0,0,0,0.06)",
        },
      },
    },
  },
});

export default theme;
