import { Inbox } from "lucide-react";
import { ResultView } from "../components/ResultView";
import { useResultStore } from "../store/result";

export function ResultPage() {
  const result = useResultStore((s) => s.result);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <Inbox className="h-10 w-10 text-slate-300" />
        <h2 className="mt-3 text-base font-semibold">No result yet</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure fields and parse a resume to see the structured output here.
        </p>
      </div>
    );
  }

  return <ResultView result={result} />;
}
