import { Inbox } from "lucide-react";
import { Paper, Typography } from "@mui/material";
import { ResultView } from "../components/ResultView";
import { useResultStore } from "../store/result";

export function ResultPage() {
  const result = useResultStore((s) => s.result);

  if (!result) {
    return (
      <Paper
        elevation={0}
        className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-brand-200 bg-white/80 p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-colors dark:border-brand-900/60 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/10 to-emerald-500/10 text-brand-600">
          <Inbox className="h-8 w-8" />
        </div>
        <Typography variant="h6" className="mt-4 !font-bold">
          No result yet
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          className="mt-2 max-w-md"
        >
          Configure fields and parse a resume to see the structured output here.
        </Typography>
      </Paper>
    );
  }

  return <ResultView result={result} />;
}
