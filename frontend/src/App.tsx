import { useState } from "react";
import { ScanText } from "lucide-react";
import { ConfigurePage } from "./pages/ConfigurePage";
import { ResultPage } from "./pages/ResultPage";
import { useResultStore } from "./store/result";

type Tab = "configure" | "result";

export default function App() {
  const [tab, setTab] = useState<Tab>("configure");
  const hasResult = useResultStore((s) => s.result !== null);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanText className="h-6 w-6 text-brand-600" />
          <h1 className="text-lg font-semibold tracking-tight">
            Resume Parser
          </h1>
        </div>
        <div className="text-xs text-slate-500">
          Powered by Google Gemini
        </div>
      </header>

      <nav className="mt-5 inline-flex self-start rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-sm">
        <button
          type="button"
          onClick={() => setTab("configure")}
          className={
            "rounded-md px-3 py-1.5 transition " +
            (tab === "configure"
              ? "bg-brand-500 text-white"
              : "text-slate-600 hover:bg-slate-50")
          }
        >
          Configure
        </button>
        <button
          type="button"
          onClick={() => setTab("result")}
          disabled={!hasResult}
          className={
            "rounded-md px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 " +
            (tab === "result"
              ? "bg-brand-500 text-white"
              : "text-slate-600 hover:bg-slate-50")
          }
        >
          Result
        </button>
      </nav>

      <main className="mt-5 flex-1">
        {tab === "configure" ? (
          <ConfigurePage onResult={() => setTab("result")} />
        ) : (
          <ResultPage />
        )}
      </main>

      <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-xs text-slate-400">
        Resume Parser · FastAPI + unstructured + Gemini · React + Vite
      </footer>
    </div>
  );
}
