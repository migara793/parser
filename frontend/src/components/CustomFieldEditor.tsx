import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useProfileStore } from "../store/profile";
import type { CustomField, CustomFieldType } from "../types";

const KEY_RE = /^[a-z][a-z0-9_]*$/;
const TYPES: CustomFieldType[] = [
  "string",
  "number",
  "boolean",
  "string_list",
  "date",
];

export function CustomFieldEditor() {
  const profile = useProfileStore((s) => s.profile);
  const addCustomField = useProfileStore((s) => s.addCustomField);
  const updateCustomField = useProfileStore((s) => s.updateCustomField);
  const removeCustomField = useProfileStore((s) => s.removeCustomField);

  const [draft, setDraft] = useState<CustomField>({
    key: "",
    type: "string",
    description: "",
    required: false,
  });
  const [error, setError] = useState<string | null>(null);

  const tryAdd = () => {
    if (!KEY_RE.test(draft.key)) {
      setError("Key must be snake_case (start with lowercase letter).");
      return;
    }
    if (profile.custom_fields.some((c) => c.key === draft.key)) {
      setError("That key is already in use.");
      return;
    }
    if (draft.description.trim().length < 5) {
      setError("Description must be at least 5 characters.");
      return;
    }
    addCustomField(draft);
    setDraft({ key: "", type: "string", description: "", required: false });
    setError(null);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold">Custom fields</h3>
      <p className="mb-3 text-sm text-slate-500">
        Add your own fields. The description is what the AI uses to find the
        value — be specific. Example: <em>"Years of AWS experience as a
        number, or null if not mentioned."</em>
      </p>

      <div className="grid grid-cols-1 gap-3">
        {profile.custom_fields.map((cf) => (
          <div
            key={cf.key}
            className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 md:flex-row md:items-start"
          >
            <div className="flex flex-col gap-2 md:flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-white px-2 py-1 text-xs font-medium text-brand-700 ring-1 ring-slate-200">
                  {cf.key}
                </code>
                <select
                  value={cf.type}
                  onChange={(e) =>
                    updateCustomField(cf.key, {
                      type: e.target.value as CustomFieldType,
                    })
                  }
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label className="ml-auto inline-flex items-center gap-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-brand-500"
                    checked={cf.required}
                    onChange={(e) =>
                      updateCustomField(cf.key, { required: e.target.checked })
                    }
                  />
                  Required
                </label>
              </div>
              <textarea
                rows={2}
                maxLength={500}
                value={cf.description}
                onChange={(e) =>
                  updateCustomField(cf.key, { description: e.target.value })
                }
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              />
              <div className="text-right text-[11px] text-slate-400">
                {cf.description.length}/500
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeCustomField(cf.key)}
              className="self-start rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Remove custom field"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            placeholder="key (snake_case)"
            value={draft.key}
            onChange={(e) => setDraft({ ...draft, key: e.target.value })}
            className="w-48 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <select
            value={draft.type}
            onChange={(e) =>
              setDraft({ ...draft, type: e.target.value as CustomFieldType })
            }
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-brand-500"
              checked={draft.required}
              onChange={(e) =>
                setDraft({ ...draft, required: e.target.checked })
              }
            />
            Required
          </label>
          <button
            type="button"
            onClick={tryAdd}
            className="ml-auto inline-flex items-center gap-1 rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <textarea
          rows={2}
          maxLength={500}
          placeholder="Plain-English description of what to extract…"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
        {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      </div>
    </div>
  );
}
