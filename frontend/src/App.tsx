import { useState, useEffect, useMemo } from "react";
import {
  MoonStar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Zap,
  LayoutDashboard,
  ClipboardList,
  Trophy,
  Files
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
  FormControlLabel,
  Switch
} from "@mui/material";
import { ConfigurePage } from "./pages/ConfigurePage";
import { ResultPage } from "./pages/ResultPage";
import { JobManager } from "./components/JobManager";
import { ShortlistResults } from "./components/ShortlistResults";
import { ShortlistLeaderboard } from "./components/ShortlistLeaderboard";
import { BulkShortlist } from "./components/BulkShortlist";
import { useResultStore } from "./store/result";
import { createAppTheme } from "./theme";
import { evaluateCandidate, EvaluationResponse } from "./api/client";

type ViewTab = "configure" | "result" | "jobs" | "shortlist" | "bulk";
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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  
  const { result } = useResultStore();
  const hasResult = result !== null;

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const isDark = mode === "dark";

  const handleRunShortlist = async (jobId: string) => {
    if (!result) return;
    setEvalLoading(true);
    try {
      const res = await evaluateCandidate(jobId, result.candidate, autoSave);
      setEvaluation(res);
    } catch (e) {
      console.error(e);
      alert("Evaluation failed. Make sure Shortlist Agent is running.");
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="relative min-h-screen overflow-hidden transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-8rem] top-[-8rem] h-[20rem] w-[20rem] rounded-full bg-brand-500/15 blur-3xl dark:bg-brand-500/20" />
          <div className="absolute right-[-6rem] top[6rem] h-[18rem] w-[18rem] rounded-full bg-emerald-500/15 blur-3xl dark:bg-emerald-500/18" />
          <div className="absolute bottom-[-6rem] left-1/2 h-[16rem] w-[16rem] -translate-x-1/2 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-400/10" />
        </div>

        <Container maxWidth="xl" className="relative z-10 py-4 sm:py-6 lg:py-8">
          <header className="mb-5 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-colors duration-300 dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_30px_90px_rgba(2,6,23,0.45)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3 sm:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-500 text-white shadow-lg shadow-amber-500/20">
                  <ScanSearch className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Typography
                      variant="h4"
                      className="!font-bold !leading-tight"
                    >
                      Resume Parser <span className="text-brand-500">& Shortlist</span>
                    </Typography>
                    <Chip
                      size="small"
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                      label="RAG Powered"
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
                    Parse resumes and instantly match them against your job knowledge base using semantic search.
                  </Typography>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                <Tab value="jobs" icon={<LayoutDashboard className="h-4 w-4 mr-2" />} iconPosition="start" label="Job Management" />
                <Tab value="bulk" icon={<Files className="h-4 w-4 mr-2" />} iconPosition="start" label="Bulk Shortlist" disabled={!selectedJobId} />
                <Tab value="configure" icon={<ScanSearch className="h-4 w-4 mr-2" />} iconPosition="start" label="Single Parser" />
                <Tab value="result" icon={<ClipboardList className="h-4 w-4 mr-2" />} iconPosition="start" label="Match & Results" disabled={!hasResult} />
                <Tab value="shortlist" icon={<Trophy className="h-4 w-4 mr-2" />} iconPosition="start" label="Top 10 Shortlist" disabled={!selectedJobId} />
              </Tabs>
            </Paper>
          </header>

          <main className="pb-8">
            {tab === "jobs" && (
              <JobManager 
                selectedJobId={selectedJobId}
                onJobCreated={(id) => {
                  setSelectedJobId(id);
                  setTab("bulk");
                }} 
              />
            )}
            {tab === "bulk" && selectedJobId && (
              <BulkShortlist job_id={selectedJobId} />
            )}
            {tab === "configure" && (
              <ConfigurePage onResult={() => setTab("result")} />
            )}
            {tab === "result" && (
              <Box>
                <ResultPage />
                
                {selectedJobId ? (
                   <Box className="mt-8">
                     <Typography variant="h6" className="!font-bold mb-4">Shortlist Comparison</Typography>
                     <Paper className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50 flex items-center justify-between">
                        <Box>
                          <Typography>Match against stored job: <span className="font-bold text-brand-500">{selectedJobId}</span></Typography>
                          <FormControlLabel 
                            control={<Switch checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} size="small" />} 
                            label={<Typography variant="caption">Auto-save to Talent Pool</Typography>}
                          />
                        </Box>
                        <IconButton 
                          disabled={evalLoading}
                          onClick={() => handleRunShortlist(selectedJobId)}
                          className="!bg-brand-500 !text-white hover:!bg-brand-600 !rounded-xl"
                        >
                          <Zap className="h-5 w-5" />
                        </IconButton>
                     </Paper>
                     {evaluation && <ShortlistResults evaluation={evaluation} />}
                   </Box>
                ) : (
                  <Paper className="p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-600 mt-8 text-center">
                    <Typography color="text.secondary">Go to "Job Management" first to define a job for shortlisting.</Typography>
                  </Paper>
                )}
              </Box>
            )}
            {tab === "shortlist" && selectedJobId && (
              <ShortlistLeaderboard job_id={selectedJobId} />
            )}
          </main>

          <footer className="pb-4 text-center text-xs font-medium text-slate-500 transition-colors dark:text-slate-400">
            Resume Parser & Shortlist Agent · Powered by Qdrant & Gemini
          </footer>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
