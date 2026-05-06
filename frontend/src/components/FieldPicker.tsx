import { useProfileStore } from "../store/profile";
import type { CatalogField, CatalogOption } from "../types";
import { Chip, Paper } from "@mui/material";

function OptionInput({
  fieldKey,
  option,
}: {
  fieldKey: string;
  option: CatalogOption;
}) {
  const profile = useProfileStore((s) => s.profile);
  const setFieldOption = useProfileStore((s) => s.setFieldOption);
  const cfg = profile.fields[fieldKey];
  const value =
    (cfg?.options?.[option.key] as never) ?? (option.default as never);

  if (option.type === "boolean") {
    return (
      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          className="h-4 w-4 accent-brand-500"
          checked={Boolean(value)}
          onChange={(e) =>
            setFieldOption(fieldKey, option.key, e.target.checked)
          }
        />
        <span>{option.label}</span>
      </label>
    );
  }

  if (option.type === "number") {
    return (
      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        <span>{option.label}</span>
        <input
          type="number"
          min={option.min}
          max={option.max}
          value={Number(value)}
          onChange={(e) =>
            setFieldOption(fieldKey, option.key, Number(e.target.value))
          }
          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
        />
      </label>
    );
  }

  // multi_select
  const selected = (Array.isArray(value) ? value : []) as string[];
  return (
    <div className="text-sm">
      <div className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">
        {option.label}
      </div>
      <div className="flex flex-wrap gap-2">
        {option.choices.map((c) => {
          const checked = selected.includes(c);
          return (
            <button
              type="button"
              key={c}
              onClick={() => {
                const next = checked
                  ? selected.filter((x) => x !== c)
                  : [...selected, c];
                setFieldOption(fieldKey, option.key, next);
              }}
              className={
                "rounded-full border px-3 py-1 text-xs font-medium transition " +
                (checked
                  ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-brand-400")
              }
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FieldPicker({ catalog }: { catalog: CatalogField[] }) {
  const profile = useProfileStore((s) => s.profile);
  const setFieldEnabled = useProfileStore((s) => s.setFieldEnabled);
  const setFieldRequired = useProfileStore((s) => s.setFieldRequired);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {catalog.map((f) => {
        const cfg = profile.fields[f.key] ?? {
          enabled: f.default_enabled ?? false,
          required: f.default_required ?? false,
          options: {},
        };
        const isFullName = f.key === "full_name";
        return (
          <Paper
            key={f.key}
            elevation={0}
            className={
              "rounded-[24px] border p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition " +
              (cfg.enabled
                ? "border-brand-200 bg-gradient-to-br from-white to-brand-50/40 dark:border-brand-900/60 dark:from-slate-950/60 dark:to-brand-950/20"
                : "border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-950/75")
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    id={`enabled-${f.key}`}
                    type="checkbox"
                    className="h-4 w-4 accent-brand-500"
                    checked={cfg.enabled}
                    disabled={isFullName}
                    onChange={(e) => setFieldEnabled(f.key, e.target.checked)}
                  />
                  <label
                    htmlFor={`enabled-${f.key}`}
                    className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {f.label}
                  </label>
                  {isFullName && (
                    <Chip
                      size="small"
                      label="always on"
                      className="!h-5 !rounded-full !bg-slate-100 !text-[10px] !uppercase !tracking-[0.18em] !text-slate-500 dark:!bg-slate-800 dark:!text-slate-300"
                    />
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {f.description}
                </p>
              </div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-brand-500"
                  checked={cfg.required}
                  disabled={!cfg.enabled}
                  onChange={(e) => setFieldRequired(f.key, e.target.checked)}
                />
                Required
              </label>
            </div>
            {cfg.enabled && f.options.length > 0 && (
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                {f.options.map((o) => (
                  <OptionInput key={o.key} fieldKey={f.key} option={o} />
                ))}
              </div>
            )}
          </Paper>
        );
      })}
    </div>
  );
}
