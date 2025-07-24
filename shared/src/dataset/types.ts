import { Dict } from "../base/types";
import {
  DATASET_CUR_SPEC_VERSION,
  t_Automatable,
  t_DatasetSpecVersion,
  t_TechConfidence,
} from "./constants";

export interface DatasetFile {
  // [identity]
  /** used as part of unique identifier (id + version) for loading Datasets / importing Playbooks */
  id: string;
  /** used as part of unique identifier (id + version) for loading Datasets / importing Playbooks */
  version: string;
  /** general Dataset name */
  name: string;

  // [origin]
  /** optional url of original dataset that was processed into this form */
  url: null | string;

  // [specification]
  /**
   * - allows structure to change over time
   * - a loader is written for each version created
   */
  spec_version: t_DatasetSpecVersion;

  // [contents]
  /** what a single Item is referred to as (ex: a "countermeasure") */
  item_type: string;
  /** a collection of Items mapped to Techniques */
  items: Item[];

  // [templates for these contents]
  /**
   * - are displayed on the templates page
   * - are pre-started Playbooks that address situations
   * - ex: 'Ransomware' template for Remediation
   */
  templates: Template[];
}

/** An arbitrary dataset of Items called item_type that map to Techniques */
export interface Dataset extends DatasetFile {
  revoked_items: Item[];
  deprecated_items: Item[];
}

/** An arbitrary Item, (mitigation / analytic / ...), that maps to Techniques */
export interface Item {
  // [identity]
  id: string;
  name: string;

  /**
   * Allows providing a more specific name for the Item than Dataset.item_type
   *
   * Example:
   * - Dataset.item_type: "Analytic"
   * - Item.subtype's   : ["TTP", "Anomaly", ..]
   *
   * (unused)
   */
  subtype: null | string;

  // [origin]
  /** optional url of original item that was processed into this form */
  url: null | string;

  // [content]
  /** Markdown write-up content/guidance */
  content: string;

  // [metadata]
  version: string;
  created: string;
  modified: string;
  /** (unused) */
  contributors: string[];

  // [tagging]
  /** (unused) */
  technologies: string[];
  /** (unused) */
  platforms: string[];

  // [lifecycle]
  /**
   * partially used
   * - Used for preventing deprecated CMs from being displayed in-app
   * - Performs no logic to indicate "deprecated" CMs to the user
   *   - They are treated as "unknown" and get removed on Playbook import
   */
  deprecated: null | { reason: string };
  /**
   * partially used
   * - Used for preventing revoked CMs from being displayed in-app
   * - Performs no logic to indicate "revoked" CMs to the user
   *   - Performs no logic to resolve what CM it is revoked by
   *   - They are treated as "unknown" and get removed on Playbook import
   */
  revoked: null | { reason: string; by_id: string };

  // [order]
  // - for datasets that have a usage order between items
  /** (unused) */
  ids_before_this: string[];
  /** (unused) */
  ids_after_this: string[];

  // [recommended essentials]
  /**
   * - allows marking an Item as important to review / include,
   *   regardless of what Techniques have occurred
   */
  is_baseline: boolean;

  // [interchangeability]
  /**
   * (unused)
   * - when applicable, allows indicating IDs of other Items that can be used
   *   in place of this one (ex: different risk levels / considerations)
   */
  related_ids: string[];

  // [automation]
  /**
   * (unused)
   * - when applicable; how easily automated an Item is
   */
  automatable: t_Automatable;

  // [knowledgebase]
  /**
   * (unused)
   * - allows linking to articles / guides / reports
   */
  references: Reference[];

  // [mappings]
  /**
   * - the mapped Techniques themselves
   */
  techniques: MappedTech[];
}

export type ItemEntry = { id: string; version: string };

export interface TechToItemVal {
  confidence: t_TechConfidence;
  items: ItemEntry[];
}

export interface TechToItemMap {
  unmapped: TechToItemVal;
  [key: string]: TechToItemVal;
}

export interface ItemToTechVal {
  version: string;
  techs: {
    id: string;
    confidence: t_TechConfidence;
  }[];
}

export interface ItemToTechMap {
  unmapped: ItemToTechVal;
  [key: string]: ItemToTechVal;
}

/** A Template for a Playbook - a collection of Techs mapped to Items */
export interface Template {
  /** Dataset-wide unique ID for this Template */
  id: string;

  /** Display name */
  name: string;

  /** Is this Template featured? */
  featured: boolean;

  /** Optional icon to add to card - use: <img src={iconSrc} /> */
  iconSrc: null | string;

  /** Optional link to page with further details
   * (ex: CISA comments on Ransomware)
   */
  link: null | {
    url: string;
    text: string;
  };

  /**
   * Markdown Template Description
   *
   * - First sentence is displayed on the TemplateCard
   * - Entirety is displayed on the TemplateModal
   * - Prepended to the MD / Word exports of Template-based Playbooks
   */
  description: string;

  /** Techs + Item Mappings */
  tech_to_items: TechToItemMap;
  ignored_items: string[];
}

/**
 * Website / book being referenced by an Item, has rich description too
 * (unused)
 */
export interface Reference {
  source_name: string;
  /** Markdown */
  description: null | string;
  url: null | string;
}

/** An instance of a Tech being mapped to an Item */
export interface MappedTech {
  /** Txxxx[.yyy] */
  tech_id: string;

  /**
   * (unused)
   * - Markdown
   */
  content: null | string;

  /** (unused) */
  details: null | Dict<unknown>;
}

/** A 'defined null' for Dataset */
export function blank_Dataset(): Dataset {
  return {
    id: "",
    version: "",
    name: "",
    url: null,
    spec_version: DATASET_CUR_SPEC_VERSION,
    item_type: "",
    items: [],
    templates: [],
    revoked_items: [],
    deprecated_items: [],
  };
}

/**
 * Item wrapper for using Item[Card, Modal]
 * - Each Item is presented to the user under a TechID or "unmapped"
 *   - This allows checking if the specific usage is in the Playbook or not
 *   - Ex: An Item can be mappable under multiple different Techniques
 */
export interface ItemAndTech {
  item: Item;
  techId: "unmapped" | string;
}
