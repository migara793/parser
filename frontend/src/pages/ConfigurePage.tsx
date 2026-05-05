import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
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
  const canSubmit = !!file && enabledCount > 0 && !parseM.isPending;

  return (
    <div className="space-y-5">
      <ProfilePresets />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Resume file</h2>
        <p className="mb-3 text-sm text-slate-500">
          Upload the candidate's resume (PDF, DOCX, TXT, etc.).
        </p>
        <ResumeDropzone file={file} onFile={setFile} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Fields to extract</h2>
        <p className="mb-3 text-sm text-slate-500">
          Toggle which information you want from each resume. Mark a field
          required to make it mandatory.
        </p>
        {catalogQ.isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading catalog…
          </div>
        )}
        {catalogQ.data && <FieldPicker catalog={catalogQ.data} />}
      </div>

      <CustomFieldEditor />

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="sticky bottom-3 flex justify-end">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            setErrorMsg(null);
            parseM.mutate();
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {parseM.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {parseM.isPending ? "Extracting…" : "Parse resume"}
        </button>
      </div>
    </div>
  );
}
