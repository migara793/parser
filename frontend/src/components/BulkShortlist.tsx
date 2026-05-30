import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  LinearProgress, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  CircularProgress,
  Chip
} from "@mui/material";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Loader2 
} from "lucide-react";
import { parseResume, evaluateCandidate } from "../api/client";
import { useProfileStore } from "../store/profile";

interface FileStatus {
  file: File;
  status: "pending" | "parsing" | "shortlisting" | "completed" | "error";
  score?: number;
  error?: string;
}

export const BulkShortlist = ({ job_id }: { job_id: string }) => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [processing, setProcessing] = useState(false);
  const profile = useProfileStore((s) => s.profile);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles.map(f => ({ file: f, status: "pending" })));
    },
  });

  const runBulkProcess = async () => {
    setProcessing(true);
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const item = updatedFiles[i];
      try {
        // 1. Parsing
        item.status = "parsing";
        setFiles([...updatedFiles]);
        const parseRes = await parseResume(item.file, profile);

        // 2. Shortlisting
        item.status = "shortlisting";
        setFiles([...updatedFiles]);
        const evalRes = await evaluateCandidate(job_id, parseRes.candidate, true);

        item.status = "completed";
        item.score = evalRes.score;
      } catch (e: any) {
        item.status = "error";
        item.error = e.message || "Failed to process";
      }
      setFiles([...updatedFiles]);
    }
    setProcessing(false);
  };

  const completedCount = files.filter(f => f.status === "completed").length;
  const progress = files.length > 0 ? (completedCount / files.length) * 100 : 0;

  return (
    <Box className="space-y-6">
      <Paper className="p-8 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <div {...getRootProps()} className="cursor-pointer text-center">
          <input {...getInputProps()} />
          <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500 mb-4">
            <UploadCloud className="h-10 w-10" />
          </div>
          <Typography variant="h5" className="!font-bold mb-2">Bulk Resume Upload</Typography>
          <Typography color="text.secondary">Drop multiple CVs here to shortlist them against Job ID: <span className="font-bold text-brand-500">{job_id}</span></Typography>
        </div>
      </Paper>

      {files.length > 0 && (
        <Paper className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Typography variant="h6" className="!font-bold">Upload Queue</Typography>
              <Typography variant="caption" color="text.secondary">{files.length} files selected</Typography>
            </div>
            <Button 
              variant="contained" 
              startIcon={processing ? <Loader2 className="animate-spin" /> : <Play />}
              onClick={runBulkProcess}
              disabled={processing || files.length === 0}
              className="!rounded-2xl !bg-brand-500 !px-6"
            >
              {processing ? "Processing..." : "Start Shortlisting"}
            </Button>
          </div>

          {processing && (
            <Box className="mb-6">
              <div className="flex justify-between mb-2">
                <Typography variant="body2">Overall Progress</Typography>
                <Typography variant="body2" className="!font-bold">{Math.round(progress)}%</Typography>
              </div>
              <LinearProgress variant="determinate" value={progress} className="!h-2 !rounded-full" />
            </Box>
          )}

          <List className="space-y-2">
            {files.map((item, idx) => (
              <ListItem 
                key={idx} 
                className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30"
              >
                <ListItemIcon>
                  {item.status === "completed" ? <CheckCircle2 className="text-emerald-500" /> : 
                   item.status === "error" ? <XCircle className="text-rose-500" /> :
                   item.status === "pending" ? <FileText className="text-slate-400" /> :
                   <CircularProgress size={20} />}
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography className="!font-bold">{item.file.name}</Typography>}
                  secondary={item.error || (item.status === "completed" ? `Match Score: ${(item.score! * 100).toFixed(0)}%` : item.status.toUpperCase())}
                />
                {item.status === "completed" && (
                   <Chip 
                    label="Saved to Pool" 
                    size="small" 
                    color="success" 
                    variant="outlined"
                    className="!font-bold"
                  />
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};
