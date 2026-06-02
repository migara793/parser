import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Chip, Paper, TextField, useTheme } from "@mui/material";
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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

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
    <Paper
      elevation={0}
      className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-colors dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_rgba(2,6,23,0.35)]"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Custom fields
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Add your own fields. The description is what the AI uses to find the
            value — be specific. Example:{" "}
            <em>
              "Years of AWS experience as a number, or null if not mentioned."
            </em>
          </p>
        </div>
        <Chip
          size="small"
          label={`${profile.custom_fields.length} custom fields`}
          variant="outlined"
          color="primary"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {profile.custom_fields.map((cf) => (
          <div
            key={cf.key}
            className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 md:flex-row md:items-start dark:border-slate-700 dark:from-slate-950/60 dark:to-slate-900"
          >
            <div className="flex flex-col gap-2 md:flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950/50 dark:text-brand-200 dark:ring-brand-900/60">
                  {cf.key}
                </code>
                <select
                  value={cf.type}
                  onChange={(e) =>
                    updateCustomField(cf.key, {
                      type: e.target.value as CustomFieldType,
                    })
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm outline-none dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
              />
              <div className="text-right text-[11px] text-slate-400 dark:text-slate-500">
                {cf.description.length}/500
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeCustomField(cf.key)}
              className="self-start rounded-xl p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-rose-950/30"
              aria-label="Remove custom field"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[22px] border border-dashed border-brand-200 bg-brand-50/30 p-4 dark:border-slate-700 dark:bg-slate-950/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <TextField
            placeholder="key (snake_case)"
            value={draft.key}
            onChange={(e) => setDraft({ ...draft, key: e.target.value })}
            size="small"
            className="lg:w-56"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                backgroundColor: isDark ? "rgba(2, 6, 23, 0.72)" : "#ffffff",
                color: isDark ? "#e2e8f0" : "#0f172a",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: isDark ? "#334155" : "#e2e8f0",
              },
              "& .MuiInputBase-input::placeholder": {
                opacity: 1,
                color: isDark ? "#94a3b8" : "#64748b",
              },
            }}
          />
          <select
            value={draft.type}
            onChange={(e) =>
              setDraft({ ...draft, type: e.target.value as CustomFieldType })
            }
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none lg:w-44 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
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
          <Button
            type="button"
            onClick={tryAdd}
            variant="contained"
            color="primary"
            startIcon={<Plus className="h-4 w-4" />}
            sx={{
              ml: "auto",
              borderRadius: 999,
              fontWeight: 700,
              background: "linear-gradient(90deg, #f43f5e 0%, #16a34a 100%)",
              color: "#fff",
              boxShadow: "none",
              "&:hover": {
                background: "linear-gradient(90deg, #e11d48 0%, #15803d 100%)",
                boxShadow: "none",
              },
            }}
          >
            Add
          </Button>
        </div>
        <textarea
          rows={2}
          maxLength={500}
          placeholder="Plain-English description of what to extract…"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
        />
        {error && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}
      </div>
    </Paper>
  );
}
