import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, WandSparkles } from "lucide-react";
import {
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { fetchCatalog, parseResume } from "../api/client";
import { CustomFieldEditor } from "../components/CustomFieldEditor";
import { FieldPicker } from "../components/FieldPicker";
import { ProfilePresets } from "../components/ProfilePresets";
import { ResumeDropzone } from "../components/ResumeDropzone";
import { useProfileStore } from "../store/profile";
import { useResultStore } from "../store/result";

interface Props {
  onResult: () => void;
}

export function ConfigurePage({ onResult }: Props) {
  const profile = useProfileStore((s) => s.profile);
  const loadFromCatalog = useProfileStore((s) => s.loadFromCatalog);
  const setResult = useResultStore((s) => s.setResult);

  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const catalogQ = useQuery({ queryKey: ["catalog"], queryFn: fetchCatalog });

  useEffect(() => {
    if (catalogQ.data) loadFromCatalog(catalogQ.data);
  }, [catalogQ.data, loadFromCatalog]);

  const parseM = useMutation({
    mutationFn: () => parseResume(file!, profile),
    onSuccess: (data) => {
      setResult(data);
      onResult();
    },
    onError: (e: Error) => setErrorMsg(e.message),
  });

  const enabledCount = Object.values(profile.fields).filter(
    (f) => f.enabled,
  ).length;
  const totalFields = catalogQ.data?.length ?? 0;
  const completion =
    totalFields > 0
      ? Math.min(100, Math.round((enabledCount / totalFields) * 100))
      : 0;
  const canSubmit = !!file && enabledCount > 0 && !parseM.isPending;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <ProfilePresets />

        <Paper
          elevation={0}
          className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-colors dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Typography variant="h6" className="!font-bold">
                Resume file
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload the candidate's resume in PDF, DOCX, TXT, or similar
                format.
              </Typography>
            </div>
            <Chip
              size="small"
              color={file ? "success" : "default"}
              variant={file ? "filled" : "outlined"}
              label={file ? "File selected" : "Awaiting your resume"}
            />
          </div>
          <ResumeDropzone file={file} onFile={setFile} />
        </Paper>

        <Paper
          elevation={0}
          className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-colors dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Typography variant="h6" className="!font-bold">
                Fields to extract
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose the fields you want to extract from each resume.
              </Typography>
            </div>
            <Chip
              size="small"
              variant="outlined"
              color="primary"
              label={`${enabledCount} enabled`}
            />
          </div>
          {catalogQ.isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading catalog…
            </div>
          )}
          {catalogQ.data && <FieldPicker catalog={catalogQ.data} />}
        </Paper>

        <CustomFieldEditor />

        {errorMsg && (
          <Paper
            elevation={0}
            className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700"
          >
            {errorMsg}
          </Paper>
        )}
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <Paper
          elevation={0}
          className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-colors dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <Typography
                variant="overline"
                className="!font-bold !tracking-[0.2em] text-brand-700"
              >
                Setup summary
              </Typography>
              <Typography variant="h6" className="!font-bold">
                Ready to go
              </Typography>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 text-white shadow-lg shadow-orange-500/20">
              <WandSparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-colors dark:border-slate-700 dark:bg-slate-950/60">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Selected fields
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {enabledCount}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Custom fields
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {profile.custom_fields.length}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  File status
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {file ? "Loaded" : "Pending"}
                </span>
              </div>
              <LinearProgress
                variant="determinate"
                value={completion}
                sx={{
                  mt: 2,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "rgba(249, 115, 22, 0.12)",
                }}
              />
              <div className="mt-2 text-xs text-slate-500">
                {completion}% of available fields are enabled.
              </div>
            </div>

            <Stack spacing={1.25}>
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={() => {
                  setErrorMsg(null);
                  parseM.mutate();
                }}
                size="large"
                variant="contained"
                color="primary"
                startIcon={
                  parseM.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )
                }
                className="!bg-gradient-to-r !from-brand-500 !to-emerald-500 !py-3 !text-base !font-bold"
                fullWidth
              >
                {parseM.isPending ? "Extracting…" : "Parse resume"}
              </Button>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 transition-colors dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                The action stays visible on desktop and the layout adapts on
                smaller screens.
              </div>
            </Stack>
          </div>
        </Paper>
      </aside>
    </div>
  );
}
