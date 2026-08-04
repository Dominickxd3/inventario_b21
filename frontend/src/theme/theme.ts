"use client";

import { createTheme } from "@mui/material/styles";

export const COLORS = {
  red: "#8B0000",
  redDark: "#6D0000",
  redLight: "#C0392B",
  carbon: "#111827",
  steel: "#374151",
  bg: "#F5F6F8",
  gold: "#C8A951",
  white: "#FFFFFF",
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: COLORS.red,
      dark: COLORS.redDark,
      light: COLORS.redLight,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: COLORS.gold,
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
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
    fontSize: 14,
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: COLORS.steel,
          backgroundColor: "#F1F2F5",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;