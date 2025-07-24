export const DATASET_ALL_SPEC_VERSIONS = ["1.0.0"] as const;
export type t_DatasetSpecVersion = (typeof DATASET_ALL_SPEC_VERSIONS)[number];
export const s_DatasetSpecVersion = { enum: DATASET_ALL_SPEC_VERSIONS };
export const DATASET_CUR_SPEC_VERSION: t_DatasetSpecVersion = "1.0.0";

export const TECH_CONFIDENCE_LEVELS = [
  "none",
  "suspected",
  "confirmed",
] as const;
export type t_TechConfidence = (typeof TECH_CONFIDENCE_LEVELS)[number];
export const s_TechConfidence = { enum: TECH_CONFIDENCE_LEVELS };
export const DEFAULT_TECH_CONFIDENCE: t_TechConfidence = "suspected";

export const AUTOMATABLE_LEVELS = [
  "unspecified",
  "none",
  "partial",
  "full",
] as const;
export type t_Automatable = (typeof AUTOMATABLE_LEVELS)[number];
export const s_Automatable = { enum: AUTOMATABLE_LEVELS };
