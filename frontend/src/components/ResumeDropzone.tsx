import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X } from "lucide-react";
import { Button, Paper } from "@mui/material";

interface Props {
  file: File | null;
  onFile: (f: File | null) => void;
  maxMb?: number;
}

export function ResumeDropzone({ file, onFile, maxMb = 10 }: Props) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      multiple: false,
      maxSize: maxMb * 1024 * 1024,
      accept: {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "application/msword": [".doc"],
        "text/plain": [".txt", ".md"],
        "text/html": [".html", ".htm"],
        "application/rtf": [".rtf"],
      },
      onDrop: (accepted) => {
        if (accepted[0]) onFile(accepted[0]);
      },
    });

  if (file) {
    return (
      <Paper
        elevation={0}
        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-colors dark:border-slate-700 dark:bg-slate-950/60 dark:shadow-[0_16px_40px_rgba(2,6,23,0.35)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {file.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onFile(null)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </Paper>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={
          "flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed p-6 text-center transition-all duration-200 " +
          (isDragActive
            ? "border-brand-500 bg-brand-50/70 shadow-[0_18px_40px_rgba(245,158,11,0.12)] dark:border-brand-400 dark:bg-brand-950/40"
            : "border-slate-200 bg-gradient-to-b from-white to-brand-50/30 hover:border-brand-400 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:from-slate-950/60 dark:to-brand-950/20 dark:hover:border-brand-400")
        }
      >
        <input {...getInputProps()} />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/10 to-emerald-500/10 text-brand-600 dark:from-brand-500/20 dark:to-emerald-500/20 dark:text-brand-300">
          <UploadCloud className="h-7 w-7" />
        </div>
        <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Drop resume here, or click to browse
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          PDF, DOCX, DOC, TXT, RTF, HTML, MD · up to {maxMb} MB
        </div>
      </div>
      {fileRejections.length > 0 && (
        <div className="mt-2 text-xs text-rose-600 dark:text-rose-300">
          {fileRejections[0].errors[0].message}
        </div>
      )}
    </div>
  );
}
