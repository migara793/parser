import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X } from "lucide-react";

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
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-brand-600" />
          <div>
            <div className="text-sm font-medium">{file.name}</div>
            <div className="text-xs text-slate-500">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onFile(null)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition " +
          (isDragActive
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 bg-white hover:border-brand-500/60")
        }
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-8 w-8 text-slate-400" />
        <div className="mt-2 text-sm font-medium">
          Drop resume here, or click to browse
        </div>
        <div className="mt-1 text-xs text-slate-500">
          PDF, DOCX, DOC, TXT, RTF, HTML, MD · up to {maxMb} MB
        </div>
      </div>
      {fileRejections.length > 0 && (
        <div className="mt-2 text-xs text-red-600">
          {fileRejections[0].errors[0].message}
        </div>
      )}
    </div>
  );
}
