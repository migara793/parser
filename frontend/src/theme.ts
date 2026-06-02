import { alpha, createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#84cc16",
        light: "#a3e635",
        dark: "#65a30d",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#84cc16",
        light: "#a3e635",
        dark: "#65a30d",
        contrastText: "#ffffff",
      },
      background: {
        default: isDark ? "#020617" : "#f8fafc",
        paper: isDark ? "rgba(15, 23, 42, 0.78)" : "rgba(255, 255, 255, 0.82)",
      },
      text: {
        primary: isDark ? "#f8fafc" : "#0f172a",
        secondary: isDark ? "#cbd5e1" : "#475569",
      },
    },
    shape: {
      borderRadius: 18,
    },
    typography: {
      fontFamily: '"Sora", "Inter", "Segoe UI", sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: "-0.04em",
      },
      h2: {
        fontWeight: 800,
        letterSpacing: "-0.03em",
      },
      h3: {
        fontWeight: 750,
        letterSpacing: "-0.02em",
      },
      button: {
        fontWeight: 700,
        textTransform: "none",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isDark
              ? "radial-gradient(circle at top left, rgba(132, 204, 22, 0.15), transparent 28%), radial-gradient(circle at top right, rgba(132, 204, 22, 0.12), transparent 24%), linear-gradient(180deg, #020617 0%, #0f172a 44%, #111827 100%)"
              : "radial-gradient(circle at top left, rgba(132, 204, 22, 0.12), transparent 28%), radial-gradient(circle at top right, rgba(132, 204, 22, 0.14), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 36%, #ffffff 100%)",
            color: isDark ? "#f8fafc" : "#0f172a",
            transition: "background 220ms ease, color 220ms ease",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backdropFilter: "blur(18px)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            boxShadow: "none",
            paddingInline: 18,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 48,
            textTransform: "none",
            fontWeight: 700,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 700,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: alpha(
              isDark ? "#0f172a" : "#ffffff",
              isDark ? 0.9 : 0.92,
            ),
          },
        },
      },
    },
  });
}
