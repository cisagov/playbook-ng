import {
  s_NullOrStringNotBlank,
  s_StringNotBlank,
  s_StringNotBlankArray,
} from "../base/schema";
import { s_TechToItemMap } from "../dataset/schema";
import { s_PlaybookSpecVersion } from "./constants";

export const s_Playbook_X_Y_Z = {
  type: "object",
  properties: {
    spec_version: s_PlaybookSpecVersion,
  },
  required: ["spec_version"],
  additionalProperties: true,
};

export const s_Playbook_1_0_0 = {
  type: "object",
  properties: {
    dataset_id: s_StringNotBlank,
    dataset_version: s_StringNotBlank,
    title: s_StringNotBlank,
    template_used: s_NullOrStringNotBlank,
    version: s_StringNotBlank,
    created: s_StringNotBlank,
    updated: s_StringNotBlank,
    spec_version: { const: "1.0.0" },
    tech_to_items: s_TechToItemMap,
  },
  required: [
    "dataset_id",
    "dataset_version",
    "title",
    "template_used",
    "version",
    "created",
    "updated",
    "spec_version",
    "tech_to_items",
  ],
  additionalProperties: false,
};

export const s_Playbook_2_0_0 = {
  type: "object",
  properties: {
    dataset_id: s_StringNotBlank,
    dataset_version: s_StringNotBlank,
    title: s_StringNotBlank,
    template_used: s_NullOrStringNotBlank,
    version: s_StringNotBlank,
    created: s_StringNotBlank,
    updated: s_StringNotBlank,
    spec_version: { const: "2.0.0" },
    tech_to_items: s_TechToItemMap,
    ignored_items: s_StringNotBlankArray,
  },
  required: [
    "dataset_id",
    "dataset_version",
    "title",
    "template_used",
    "version",
    "created",
    "updated",
    "spec_version",
    "tech_to_items",
    "ignored_items",
  ],
  additionalProperties: false,
};

/** Latest version - used app-wide */
export const s_Playbook = s_Playbook_2_0_0;
