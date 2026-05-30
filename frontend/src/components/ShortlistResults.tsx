import { useState } from "react";
import { Box, Typography, Paper, LinearProgress, Chip, Stack } from "@mui/material";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { EvaluationResponse } from "../api/client";

export const ShortlistResults = ({ evaluation }: { evaluation: EvaluationResponse }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Shortlisted": return "success";
      case "Hold": return "warning";
      case "Rejected": return "error";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Shortlisted": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "Hold": return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "Rejected": return <XCircle className="h-5 w-5 text-rose-500" />;
      default: return null;
    }
  };

  return (
    <Paper className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50 mt-6">
      <div className="flex items-center justify-between mb-6">
        <Typography variant="h6" className="!font-bold">Shortlist Evaluation</Typography>
        <Chip 
          label={evaluation.status} 
          color={getStatusColor(evaluation.status) as any}
          icon={getStatusIcon(evaluation.status) as any}
          className="!font-bold !px-2"
        />
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <Typography variant="body2" color="text.secondary">Total Match Score</Typography>
            <Typography variant="body2" className="!font-bold">{(evaluation.score * 100).toFixed(0)}%</Typography>
          </div>
          <LinearProgress 
            variant="determinate" 
            value={evaluation.score * 100} 
            className="!h-3 !rounded-full"
            color={getStatusColor(evaluation.status) as any}
          />
        </div>

        <Stack direction="row" spacing={2} className="flex-wrap gap-y-2">
          <Paper variant="outlined" className="p-3 flex-1 min-w-[120px] rounded-2xl">
            <Typography variant="caption" color="text.secondary" className="block text-center uppercase tracking-wider">Semantic</Typography>
            <Typography variant="h6" className="text-center !font-bold">{(evaluation.breakdown.semantic_similarity * 100).toFixed(0)}%</Typography>
          </Paper>
          <Paper variant="outlined" className="p-3 flex-1 min-w-[120px] rounded-2xl">
            <Typography variant="caption" color="text.secondary" className="block text-center uppercase tracking-wider">Experience</Typography>
            <Typography variant="h6" className="text-center !font-bold">{(evaluation.breakdown.experience_match * 100).toFixed(0)}%</Typography>
          </Paper>
          <Paper variant="outlined" className="p-3 flex-1 min-w-[120px] rounded-2xl">
            <Typography variant="caption" color="text.secondary" className="block text-center uppercase tracking-wider">Skills</Typography>
            <Typography variant="h6" className="text-center !font-bold">{(evaluation.breakdown.skills_match * 100).toFixed(0)}%</Typography>
          </Paper>
        </Stack>

        <Paper className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
          <Typography variant="subtitle2" className="!font-bold mb-1">AI Reasoning</Typography>
          <Typography variant="body2" color="text.secondary">{evaluation.reasoning}</Typography>
        </Paper>
      </div>
    </Paper>
  );
};
