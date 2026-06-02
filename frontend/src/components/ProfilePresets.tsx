import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button, Paper, Stack, Typography, useTheme } from "@mui/material";
import { useProfileStore } from "../store/profile";
import type { ExtractionProfile } from "../types";

const STORAGE_KEY = "parser.presets.v1";

function readPresets(): Record<string, ExtractionProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ExtractionProfile>;
  } catch {
    return {};
  }
}

function writePresets(p: Record<string, ExtractionProfile>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function ProfilePresets() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [presets, setPresets] = useState<Record<string, ExtractionProfile>>({});
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    setPresets(readPresets());
  }, []);

  const save = () => {
    const name = window.prompt("Preset name?")?.trim();
    if (!name) return;
    const next = { ...presets, [name]: { ...profile, name } };
    setPresets(next);
    writePresets(next);
    setSelected(name);
  };

  const load = (name: string) => {
    setSelected(name);
    if (presets[name]) setProfile(presets[name]);
  };

  const remove = () => {
    if (!selected) return;
    const { [selected]: _drop, ...rest } = presets;
    setPresets(rest);
    writePresets(rest);
    setSelected("");
  };

  const names = Object.keys(presets);

  return (
    <Paper
      elevation={0}
      className="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-colors dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <div className="min-w-0 flex-1">
          <Typography
            variant="overline"
            className="!font-bold !tracking-[0.2em] text-brand-700"
          >
            Presets
          </Typography>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Save and reuse recruiter configurations across roles.
          </div>
        </div>
        <select
          value={selected}
          onChange={(e) => load(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none sm:min-w-48 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
        >
          <option value="">— select —</option>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <Button
          type="button"
          onClick={save}
          variant="outlined"
          color="primary"
          startIcon={<Save className="h-4 w-4" />}
          sx={{
            borderRadius: 999,
            fontWeight: 700,
            bgcolor: isDark ? "rgba(15, 23, 42, 0.95)" : "#ffffff",
            color: isDark ? "#e2e8f0" : "#c2410c",
            borderColor: isDark ? "#334155" : "#ffedd5",
            "&:hover": {
              bgcolor: isDark ? "#0f172a" : "#fff7ed",
              borderColor: isDark ? "#475569" : "#fb923c",
            },
          }}
        >
          Save current
        </Button>
        <Button
          type="button"
          onClick={remove}
          disabled={!selected}
          variant="outlined"
          color="error"
          startIcon={<Trash2 className="h-4 w-4" />}
          sx={{
            borderRadius: 999,
            fontWeight: 700,
            bgcolor: isDark ? "rgba(15, 23, 42, 0.95)" : "#ffffff",
            borderColor: isDark ? "#334155" : "#fecdd3",
            color: isDark ? "#fca5a5" : "#e11d48",
            "&:hover": {
              bgcolor: isDark ? "#111827" : "#fff1f2",
              borderColor: isDark ? "#475569" : "#fda4af",
            },
          }}
        >
          Delete
        </Button>
      </Stack>
    </Paper>
  );
}
