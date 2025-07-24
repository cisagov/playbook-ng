import { AttackDatasets, blank_AttackDataset } from "../../attack/objects";
import { s_StringNotBlank, s_StringNotBlankArray } from "../../base/schema";
import { Dict } from "../../base/types";
import { Dataset, blank_Dataset } from "../../dataset/types";

export interface AppDataIndex {
  attack_enterprise: string[];
  attack_mobile: string[];
  attack_ics: string[];
  datasets: Dict<string[]>;
  last_updated: string;
}

export const s_AppDataIndex = {
  type: "object",
  properties: {
    attack_enterprise: s_StringNotBlankArray,
    attack_mobile: s_StringNotBlankArray,
    attack_ics: s_StringNotBlankArray,
    datasets: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: s_StringNotBlankArray,
    },
    last_updated: s_StringNotBlank,
  },
  required: [
    "attack_enterprise",
    "attack_mobile",
    "attack_ics",
    "datasets",
    "last_updated",
  ],
};

export interface AppData {
  attack: AttackDatasets;
  dataset: Dataset;
}

export function createInitialState(): AppData {
  const init: AppData = {
    attack: {
      enterprise: blank_AttackDataset(),
      mobile: blank_AttackDataset(),
      ics: blank_AttackDataset(),
    },
    dataset: blank_Dataset(),
  };
  return init;
}

export function setDataset(state: AppData, dataset: Dataset): AppData {
  return {
    ...state,
    dataset,
  };
}

export function setAttack(state: AppData, attack: AttackDatasets): AppData {
  return {
    ...state,
    attack,
  };
}
