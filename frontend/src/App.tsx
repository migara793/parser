import { useState } from "react";
import { useEffect, useMemo } from "react";
import {
  MoonStar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Zap,
} from "lucide-react";
import {
  Box,
  Chip,
  Container,
  IconButton,
  Paper,
  Tab,
  Tabs,
  ThemeProvider,
  Tooltip,
  Typography,
  CssBaseline,
} from "@mui/material";
import { ConfigurePage } from "./pages/ConfigurePage";
import { ResultPage } from "./pages/ResultPage";
import { useResultStore } from "./store/result";
import { createAppTheme } from "./theme";

type ViewTab = "configure" | "result";
type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "parser.theme.mode";

function readThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "dark" ? "dark" : "light";
}

export default function App() {
  const [tab, setTab] = useState<ViewTab>("configure");
  const [mode, setMode] = useState<ThemeMode>(readThemeMode);
  const hasResult = useResultStore((s) => s.result !== null);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const isDark = mode === "dark";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="relative min-h-screen overflow-hidden transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-8rem] top-[-8rem] h-[20rem] w-[20rem] rounded-full bg-brand-500/15 blur-3xl dark:bg-brand-500/20" />
          <div className="absolute right-[-6rem] top-[6rem] h-[18rem] w-[18rem] rounded-full bg-emerald-500/15 blur-3xl dark:bg-emerald-500/18" />
          <div className="absolute bottom-[-6rem] left-1/2 h-[16rem] w-[16rem] -translate-x-1/2 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-400/10" />
        </div>

        <Container maxWidth="xl" className="relative z-10 py-4 sm:py-6 lg:py-8">
          <header className="mb-5 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-colors duration-300 dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_30px_90px_rgba(2,6,23,0.45)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3 sm:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 text-white shadow-lg shadow-orange-500/20">
                  <ScanSearch className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Typography
                      variant="h4"
                      className="!font-bold !leading-tight"
                    >
                      Resume Parser
                    </Typography>
                    <Chip
                      size="small"
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                      label="AI assisted"
                      color="success"
                      variant="filled"
                      className="!bg-emerald-500 !text-white"
                    />
                  </div>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    className="max-w-2xl"
                  >
                    A polished workspace for configuring resume fields,
                    uploading a file, and reviewing the extracted profile.
                  </Typography>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl border border-brand-100 bg-brand-50/80 px-4 py-3 transition-colors dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-200">
                      <Sparkles className="h-3.5 w-3.5" /> Polished
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Clean and refined
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 transition-colors dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200">
                      <Zap className="h-3.5 w-3.5" /> Works anywhere
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Mobile-first layout
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 transition-colors dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200">
                      <ShieldCheck className="h-3.5 w-3.5" /> Easy review
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Structured and clear
                    </div>
                  </div>
                </div>

                <Tooltip
                  title={
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  <IconButton
                    onClick={() => setMode(isDark ? "light" : "dark")}
                    aria-label="toggle theme"
                    className="!h-12 !w-12 !rounded-2xl !border !border-slate-200 !bg-white !text-slate-700 !shadow-sm transition hover:!bg-slate-50 dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-200 dark:hover:!bg-slate-800"
                  >
                    {isDark ? (
                      <SunMedium className="h-5 w-5" />
                    ) : (
                      <MoonStar className="h-5 w-5" />
                    )}
                  </IconButton>
                </Tooltip>
              </div>
            </div>

            <Paper
              elevation={0}
              className="mt-5 rounded-2xl border border-slate-200/70 bg-white/75 p-1 transition-colors dark:border-slate-700/60 dark:bg-slate-900/75"
            >
              <Tabs
                value={tab}
                onChange={(_, value: ViewTab) => setTab(value)}
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab value="configure" label="Configure" />
                <Tab value="result" label="Result" disabled={!hasResult} />
              </Tabs>
            </Paper>
          </header>

          <main className="pb-8">
            {tab === "configure" ? (
              <ConfigurePage onResult={() => setTab("result")} />
            ) : (
              <ResultPage />
            )}
          </main>

          <footer className="pb-4 text-center text-xs font-medium text-slate-500 transition-colors dark:text-slate-400">
            Resume Parser · AI resume extraction for recruiters
          </footer>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
