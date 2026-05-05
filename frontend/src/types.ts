export type CatalogOption =
  | {
      key: string;
      type: "boolean";
      label: string;
      default: boolean;
    }
  | {
      key: string;
      type: "number";
      label: string;
      default: number;
      min?: number;
      max?: number;
    }
  | {
      key: string;
      type: "multi_select";
      label: string;
      choices: string[];
      default: string[];
    };

export interface CatalogField {
  key: string;
  label: string;
  description: string;
  default_enabled?: boolean;
  default_required?: boolean;
  options: CatalogOption[];
}

export type CustomFieldType =
  | "string"
  | "number"
  | "boolean"
  | "string_list"
  | "date";

export interface CustomField {
  key: string;
  type: CustomFieldType;
  description: string;
  required: boolean;
}

export interface FieldConfig {
  enabled: boolean;
  required: boolean;
  options: Record<string, unknown>;
}

export interface ExtractionProfile {
  name?: string;
  fields: Record<string, FieldConfig>;
  custom_fields: CustomField[];
}

export interface ParseResponse {
  candidate: Record<string, unknown>;
  meta: {
    filename: string;
    elements: number;
    chars: number;
    model: string;
    provider: string;
    fields_requested: string[];
    custom_fields: string[];
  };
}

export interface ApiError {
  error: { code: string; message: string };
}
