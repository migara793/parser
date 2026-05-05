import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useProfileStore } from "../store/profile";
import type { ExtractionProfile } from "../types";

const STORAGE_KEY = "parser.presets.v1";

function readPresets(): Record<string, ExtractionProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ExtractionProfile>;
  } catch {
    return {};
  }
}

function writePresets(p: Record<string, ExtractionProfile>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function ProfilePresets() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);

  const [presets, setPresets] = useState<Record<string, ExtractionProfile>>({});
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    setPresets(readPresets());
  }, []);

  const save = () => {
    const name = window.prompt("Preset name?")?.trim();
    if (!name) return;
    const next = { ...presets, [name]: { ...profile, name } };
    setPresets(next);
    writePresets(next);
    setSelected(name);
  };

  const load = (name: string) => {
    setSelected(name);
    if (presets[name]) setProfile(presets[name]);
  };

  const remove = () => {
    if (!selected) return;
    const { [selected]: _drop, ...rest } = presets;
    setPresets(rest);
    writePresets(rest);
    setSelected("");
  };

  const names = Object.keys(presets);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="text-sm font-medium text-slate-700">Presets:</span>
      <select
        value={selected}
        onChange={(e) => load(e.target.value)}
        className="rounded border border-slate-300 px-2 py-1 text-sm"
      >
        <option value="">— select —</option>
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={save}
        className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
      >
        <Save className="h-4 w-4" /> Save current
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={!selected}
        className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" /> Delete
      </button>
    </div>
  );
}
