import {
  s_Boolean,
  s_Null,
  s_NullOrStringNotBlank,
  s_StringNotBlank,
} from "../../base/schema";
import { s_ExportMarks } from "../../lib/remark-docx/src/control";

const s_LoadAttack = {
  type: "object",
  properties: {
    enterprise: s_Boolean,
    mobile: s_Boolean,
    ics: s_Boolean,
  },
  required: ["enterprise", "mobile", "ics"],
  additionalProperties: false,
};

const s_LoadDataset = {
  type: "object",
  properties: {
    id: s_StringNotBlank,
    version: s_StringNotBlank,
  },
  required: ["id", "version"],
  additionalProperties: false,
};

const s_Load = {
  type: "object",
  properties: {
    attack: s_LoadAttack,
    dataset: s_LoadDataset,
  },
  required: ["attack", "dataset"],
  additionalProperties: false,
};

const s_ExportLogging = {
  oneOf: [
    s_Null,
    {
      type: "object",
      properties: {
        url: s_StringNotBlank,
        more_info_md: s_NullOrStringNotBlank,
      },
      required: ["url", "more_info_md"],
      additionalProperties: false,
    },
  ],
};

export const s_AppConfig = {
  type: "object",
  properties: {
    load: s_Load,
    unload_warning: s_Boolean,
    search_caching: s_Boolean,
    export_marks: s_ExportMarks,
    external_link_prompt: s_NullOrStringNotBlank,
    export_logging: s_ExportLogging,
  },
  required: [
    "load",
    "unload_warning",
    "search_caching",
    "export_marks",
    "external_link_prompt",
    "export_logging",
  ],
  additionalProperties: false,
};

export const s_AppConfigFile = {
  type: "object",
  properties: {
    dev: s_AppConfig,
    prod: s_AppConfig,
  },
  required: ["dev", "prod"],
  additionalProperties: false,
};
