import { useProfileStore } from "../store/profile";
import type { CatalogField, CatalogOption } from "../types";

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
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-brand-500"
          checked={Boolean(value)}
          onChange={(e) => setFieldOption(fieldKey, option.key, e.target.checked)}
        />
        <span>{option.label}</span>
      </label>
    );
  }

  if (option.type === "number") {
    return (
      <label className="inline-flex items-center gap-2 text-sm">
        <span>{option.label}</span>
        <input
          type="number"
          min={option.min}
          max={option.max}
          value={Number(value)}
          onChange={(e) =>
            setFieldOption(fieldKey, option.key, Number(e.target.value))
          }
          className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
    );
  }

  // multi_select
  const selected = (Array.isArray(value) ? value : []) as string[];
  return (
    <div className="text-sm">
      <div className="mb-1 text-slate-700">{option.label}</div>
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
                "rounded-full border px-3 py-1 text-xs transition " +
                (checked
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400")
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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {catalog.map((f) => {
        const cfg = profile.fields[f.key] ?? {
          enabled: f.default_enabled ?? false,
          required: f.default_required ?? false,
          options: {},
        };
        const isFullName = f.key === "full_name";
        return (
          <div
            key={f.key}
            className={
              "rounded-xl border bg-white p-4 shadow-sm transition " +
              (cfg.enabled ? "border-brand-500/50" : "border-slate-200")
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
                    className="cursor-pointer font-medium"
                  >
                    {f.label}
                  </label>
                  {isFullName && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                      always on
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">{f.description}</p>
              </div>
              <label className="flex items-center gap-1 text-xs text-slate-600">
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
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                {f.options.map((o) => (
                  <OptionInput key={o.key} fieldKey={f.key} option={o} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
