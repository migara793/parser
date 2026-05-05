import { useState } from "react";
import { Copy, Download, FileJson, Layers } from "lucide-react";
import type { ParseResponse } from "../types";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function PrettyValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">—</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span
        className={
          "inline-flex rounded px-2 py-0.5 text-xs " +
          (value
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-600")
        }
      >
        {String(value)}
      </span>
    );
  }
  if (typeof value === "number" || typeof value === "string") {
    return <span className="text-slate-800">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">—</span>;
    if (value.every((x) => typeof x === "string" || typeof x === "number")) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {(value as (string | number)[]).map((v, i) => (
            <span
              key={i}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 ring-1 ring-brand-100"
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
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
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
      <dt className="text-xs uppercase tracking-wide text-slate-500">
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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
        <span className="font-medium">{result.meta.filename}</span>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {result.meta.model}
        </span>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {result.meta.elements} elements
        </span>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {result.meta.chars.toLocaleString()} chars
        </span>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {result.meta.fields_requested.length} fields
        </span>
        {result.meta.custom_fields.length > 0 && (
          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-100">
            +{result.meta.custom_fields.length} custom
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded border border-slate-300 text-xs">
            <button
              type="button"
              onClick={() => setView("pretty")}
              className={
                "flex items-center gap-1 px-2 py-1 " +
                (view === "pretty"
                  ? "bg-brand-500 text-white"
                  : "bg-white text-slate-700")
              }
            >
              <Layers className="h-3.5 w-3.5" /> Pretty
            </button>
            <button
              type="button"
              onClick={() => setView("json")}
              className={
                "flex items-center gap-1 px-2 py-1 " +
                (view === "json"
                  ? "bg-brand-500 text-white"
                  : "bg-white text-slate-700")
              }
            >
              <FileJson className="h-3.5 w-3.5" /> JSON
            </button>
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </div>

      {view === "pretty" ? (
        <div className="space-y-3">
          {Object.entries(result.candidate).map(([k, v]) => (
            <div
              key={k}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                {formatLabel(k)}
              </h3>
              <PrettyValue value={v} />
            </div>
          ))}
        </div>
      ) : (
        <pre className="overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
          {json}
        </pre>
      )}
    </div>
  );
}
