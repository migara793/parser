import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CatalogField,
  CustomField,
  ExtractionProfile,
  FieldConfig,
} from "../types";

interface ProfileState {
  profile: ExtractionProfile;
  loadFromCatalog: (catalog: CatalogField[]) => void;
  setFieldEnabled: (key: string, enabled: boolean) => void;
  setFieldRequired: (key: string, required: boolean) => void;
  setFieldOption: (key: string, optionKey: string, value: unknown) => void;
  addCustomField: (cf: CustomField) => void;
  updateCustomField: (key: string, partial: Partial<CustomField>) => void;
  removeCustomField: (key: string) => void;
  setProfile: (p: ExtractionProfile) => void;
  reset: () => void;
}

const emptyProfile: ExtractionProfile = {
  fields: {
    full_name: { enabled: true, required: true, options: {} },
    "contact.email": { enabled: true, required: true, options: {} },
  },
  custom_fields: [],
};

function defaultsFromCatalog(catalog: CatalogField[]): ExtractionProfile {
  const fields: Record<string, FieldConfig> = {};
  for (const f of catalog) {
    const optDefaults: Record<string, unknown> = {};
    for (const o of f.options) optDefaults[o.key] = o.default;
    fields[f.key] = {
      enabled: f.default_enabled ?? false,
      required: f.default_required ?? false,
      options: optDefaults,
    };
  }
  // full_name must always be enabled.
  if (fields.full_name) {
    fields.full_name.enabled = true;
    fields.full_name.required = true;
  }
  return { fields, custom_fields: [] };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: emptyProfile,
      loadFromCatalog: (catalog) => {
        // Only load defaults the first time (when only the seed keys are present).
        const current = get().profile;
        const seemsSeed =
          Object.keys(current.fields).length <= 2 &&
          current.custom_fields.length === 0;
        if (seemsSeed) set({ profile: defaultsFromCatalog(catalog) });
      },
      setFieldEnabled: (key, enabled) =>
        set((s) => ({
          profile: {
            ...s.profile,
            fields: {
              ...s.profile.fields,
              [key]: {
                ...(s.profile.fields[key] ?? {
                  enabled: false,
                  required: false,
                  options: {},
                }),
                enabled,
                ...(key === "full_name" && !enabled ? { enabled: true } : {}),
              },
            },
          },
        })),
      setFieldRequired: (key, required) =>
        set((s) => ({
          profile: {
            ...s.profile,
            fields: {
              ...s.profile.fields,
              [key]: {
                ...(s.profile.fields[key] ?? {
                  enabled: false,
                  required: false,
                  options: {},
                }),
                required,
              },
            },
          },
        })),
      setFieldOption: (key, optionKey, value) =>
        set((s) => {
          const cur = s.profile.fields[key] ?? {
            enabled: false,
            required: false,
            options: {},
          };
          return {
            profile: {
              ...s.profile,
              fields: {
                ...s.profile.fields,
                [key]: {
                  ...cur,
                  options: { ...cur.options, [optionKey]: value },
                },
              },
            },
          };
        }),
      addCustomField: (cf) =>
        set((s) => ({
          profile: {
            ...s.profile,
            custom_fields: [...s.profile.custom_fields, cf],
          },
        })),
      updateCustomField: (key, partial) =>
        set((s) => ({
          profile: {
            ...s.profile,
            custom_fields: s.profile.custom_fields.map((cf) =>
              cf.key === key ? { ...cf, ...partial } : cf,
            ),
          },
        })),
      removeCustomField: (key) =>
        set((s) => ({
          profile: {
            ...s.profile,
            custom_fields: s.profile.custom_fields.filter((cf) => cf.key !== key),
          },
        })),
      setProfile: (p) => set({ profile: p }),
      reset: () => set({ profile: emptyProfile }),
    }),
    { name: "parser.profile.v1" },
  ),
);
