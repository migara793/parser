import { useState } from "react";
import { Copy, Download, FileJson, Layers } from "lucide-react";
import {
  Button,
  Chip,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
import type { ParseResponse } from "../types";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function PrettyValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span
        className={
          "inline-flex rounded px-2 py-0.5 text-xs " +
          (value
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")
        }
      >
        {String(value)}
      </span>
    );
  }
  if (typeof value === "number" || typeof value === "string") {
    return (
      <span className="text-slate-800 dark:text-slate-100">
        {String(value)}
      </span>
    );
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">—</span>;
    if (value.every((x) => typeof x === "string" || typeof x === "number")) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {(value as (string | number)[]).map((v, i) => (
            <span
              key={i}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950/50 dark:text-brand-200 dark:ring-brand-900/60"
            >
              {String(v)}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {value.map((v, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-950/50"
          >
            <PrettyValue value={v} />
          </div>
        ))}
      </div>
    );
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="text-slate-400">—</span>;
    return (
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[max-content_1fr]">
        {entries.map(([k, v]) => (
          <FragmentRow key={k} label={k} value={v} />
        ))}
      </dl>
    );
  }
  return <span>{JSON.stringify(value)}</span>;
}

function FragmentRow({ label, value }: { label: string; value: unknown }) {
  return (
    <>
      <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {formatLabel(label)}
      </dt>
      <dd className="text-sm">
        <PrettyValue value={value} />
      </dd>
    </>
  );
}

export function ResultView({ result }: { result: ParseResponse }) {
  const [view, setView] = useState<"pretty" | "json">("pretty");
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const json = JSON.stringify(result.candidate, null, 2);

  const copy = async () => {
    await navigator.clipboard.writeText(json);
  };
  const download = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(result.meta.filename || "candidate").replace(
      /\.[^.]+$/,
      "",
    )}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Paper
        elevation={0}
        className="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-colors dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <Typography
                variant="overline"
                className="!font-bold !tracking-[0.2em] text-brand-700 dark:text-brand-200"
              >
                Parse result
              </Typography>
              <Typography variant="h6" className="!font-bold">
                {result.meta.filename}
              </Typography>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip
                label={result.meta.model}
                variant="outlined"
                color="primary"
              />
              <Chip
                label={`${result.meta.elements} elements`}
                variant="outlined"
                sx={{
                  borderColor: isDark ? "#334155" : undefined,
                  color: isDark ? "#e2e8f0" : undefined,
                }}
              />
              <Chip
                label={`${result.meta.chars.toLocaleString()} chars`}
                variant="outlined"
                sx={{
                  borderColor: isDark ? "#334155" : undefined,
                  color: isDark ? "#e2e8f0" : undefined,
                }}
              />
              <Chip
                label={`${result.meta.fields_requested.length} fields`}
                variant="outlined"
                sx={{
                  borderColor: isDark ? "#334155" : undefined,
                  color: isDark ? "#e2e8f0" : undefined,
                }}
              />
              {result.meta.custom_fields.length > 0 && (
                <Chip
                  label={`+${result.meta.custom_fields.length} custom`}
                  color="warning"
                  sx={{
                    bgcolor: isDark ? "rgba(69, 26, 3, 0.55)" : undefined,
                    color: isDark ? "#fdba74" : undefined,
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleButtonGroup
              exclusive
              value={view}
              onChange={(_, next: "pretty" | "json" | null) =>
                next && setView(next)
              }
              size="small"
            >
              <ToggleButton
                value="pretty"
                className="!rounded-full !px-4 !font-semibold dark:!border-slate-700 dark:!text-slate-200"
              >
                <Layers className="mr-1.5 h-3.5 w-3.5" /> Pretty
              </ToggleButton>
              <ToggleButton
                value="json"
                className="!rounded-full !px-4 !font-semibold dark:!border-slate-700 dark:!text-slate-200"
              >
                <FileJson className="mr-1.5 h-3.5 w-3.5" /> JSON
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              onClick={copy}
              variant="outlined"
              color="inherit"
              startIcon={<Copy className="h-4 w-4" />}
              sx={{
                borderRadius: 999,
                fontWeight: 700,
                bgcolor: isDark ? "rgba(2, 6, 23, 0.72)" : "#ffffff",
                borderColor: isDark ? "#334155" : "#e2e8f0",
                color: isDark ? "#e2e8f0" : "#0f172a",
              }}
            >
              Copy
            </Button>
            <Button
              onClick={download}
              variant="contained"
              color="primary"
              startIcon={<Download className="h-4 w-4" />}
              className="!bg-gradient-to-r !from-brand-500 !to-emerald-500 !font-bold"
            >
              Download
            </Button>
          </div>
        </div>
      </Paper>

      {view === "pretty" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Object.entries(result.candidate).map(([k, v]) => (
            <Paper
              key={k}
              elevation={0}
              className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-[0_16px_44px_rgba(15,23,42,0.06)] transition-colors dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_16px_44px_rgba(2,6,23,0.35)]"
            >
              <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                {formatLabel(k)}
              </h3>
              <PrettyValue value={v} />
            </Paper>
          ))}
        </div>
      ) : (
        <pre className="overflow-auto rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-xs leading-relaxed text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-950 dark:shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
          {json}
        </pre>
      )}
    </div>
  );
}
