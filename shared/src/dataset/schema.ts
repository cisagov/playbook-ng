import {
  s_Automatable,
  s_DatasetSpecVersion,
  s_TechConfidence,
} from "./constants";
import {
  s_Null,
  s_Anything,
  s_Boolean,
  s_StringNotBlank,
  s_NullOrStringNotBlank,
  s_StringNotBlankArray,
} from "../base/schema";

const s_MappedTech = {
  type: "object",
  properties: {
    tech_id: s_StringNotBlank,
    content: s_NullOrStringNotBlank,
    details: {
      oneOf: [
        s_Null,
        {
          type: "object",
          additionalProperties: s_Anything,
        },
      ],
    },
  },
  required: ["tech_id", "content", "details"],
  additionalProperties: false,
};

const s_Reference = {
  type: "object",
  properties: {
    source_name: s_StringNotBlank,
    description: s_NullOrStringNotBlank,
    url: s_NullOrStringNotBlank,
  },
  required: ["source_name", "description", "url"],
  additionalProperties: false,
};

export const s_Item = {
  type: "object",
  properties: {
    id: s_StringNotBlank,
    name: s_StringNotBlank,
    subtype: s_NullOrStringNotBlank,
    url: s_NullOrStringNotBlank,
    content: s_StringNotBlank,
    version: s_StringNotBlank,
    created: s_StringNotBlank,
    modified: s_StringNotBlank,
    contributors: s_StringNotBlankArray,
    technologies: s_StringNotBlankArray,
    platforms: s_StringNotBlankArray,
    deprecated: {
      oneOf: [
        s_Null,
        {
          type: "object",
          properties: {
            reason: s_StringNotBlank,
          },
          required: ["reason"],
          additionalProperties: false,
        },
      ],
    },
    revoked: {
      oneOf: [
        s_Null,
        {
          type: "object",
          properties: {
            reason: s_StringNotBlank,
            by_id: s_StringNotBlank,
          },
          required: ["reason", "by_id"],
          additionalProperties: false,
        },
      ],
    },
    ids_before_this: s_StringNotBlankArray,
    ids_after_this: s_StringNotBlankArray,
    is_baseline: s_Boolean,
    related_ids: s_StringNotBlankArray,
    automatable: s_Automatable,
    references: { type: "array", items: s_Reference },
    techniques: { type: "array", items: s_MappedTech },
  },
  required: [
    "id",
    "name",
    "subtype",
    "url",
    "content",
    "version",
    "created",
    "modified",
    "contributors",
    "technologies",
    "platforms",
    "deprecated",
    "revoked",
    "ids_before_this",
    "ids_after_this",
    "is_baseline",
    "related_ids",
    "automatable",
    "references",
    "techniques",
  ],
  additionalProperties: false,
};

const s_TechToItemVal = {
  type: "object",
  properties: {
    confidence: s_TechConfidence,
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: s_StringNotBlank,
          version: s_StringNotBlank,
        },
        required: ["id", "version"],
        additionalProperties: false,
      },
    },
  },
  required: ["confidence", "items"],
  additionalProperties: false,
};

export const s_TechToItemMap = {
  type: "object",
  properties: {
    unmapped: s_TechToItemVal,
  },
  required: ["unmapped"],
  additionalProperties: s_TechToItemVal,
};

const s_Template = {
  type: "object",
  properties: {
    id: s_StringNotBlank,
    name: s_StringNotBlank,
    featured: s_Boolean,
    iconSrc: s_NullOrStringNotBlank,
    link: {
      oneOf: [
        s_Null,
        {
          type: "object",
          properties: { url: s_StringNotBlank, text: s_StringNotBlank },
          required: ["url", "text"],
          additionalProperties: false,
        },
      ],
    },
    description: s_StringNotBlank,
    tech_to_items: s_TechToItemMap,
    ignored_items: s_StringNotBlankArray,
  },
  required: [
    "id",
    "name",
    "featured",
    "iconSrc",
    "link",
    "description",
    "tech_to_items",
    "ignored_items",
  ],
  additionalProperties: false,
};

export const s_DatasetFile = {
  type: "object",
  properties: {
    id: s_StringNotBlank,
    version: s_StringNotBlank,
    name: s_StringNotBlank,
    url: s_NullOrStringNotBlank,
    spec_version: s_DatasetSpecVersion,
    item_type: s_StringNotBlank,
    items: { type: "array", items: s_Item },
    templates: { type: "array", items: s_Template },
  },
  required: [
    "id",
    "version",
    "name",
    "url",
    "spec_version",
    "item_type",
    "items",
    "templates",
  ],
  additionalProperties: false,
};
