/**
 * Help & Documentation
 *
 * Resources
 * - ATT&CK STIX Usage Guide
 *   - URL: https://github.com/mitre-attack/attack-stix-data/blob/master/USAGE.md
 *
 * TL;DR
 * - get the AttackDataset(s) from appdataSlice
 * - scroll to the end of this file
 *   - use functions here to interact with the data
 *   - AttackDataset has fields that are arrays of objects (Technique[], ..)
 *
 * readonly
 * - used for TS enforcement here when writing faux methods / helpers
 * - Redux protects us on the slice / app-usage side
 *
 * AttackFile
 * - typing for an ATT&CK.json file
 *
 * AttackDataset
 * - typing for a processed and loaded ATT&CK dataset
 *
 * ThingI
 * - represents an un-processed Thing inside the ATT&CK.json file (AttackFile)
 *
 * Thing
 * - represents a processed Thing inside AttackDataset
 *
 * new_Thing()
 * - processes ThingI --into--> Thing
 * - used by new_AttackDataset() to process AttackFile --into--> AttackDataset
 * - typically provides default values for optional fields
 * - sometimes adds extra data (attackId / attackUrl for AttackObject)
 *
 * StixBase : STIX object
 *    ^
 *    | extends
 *    |
 * AttackBase : ATT&CK STIX object
 *    ^
 *    | extends
 *    |
 * AttackObject : non-relationship ATT&CK object (Technique, Tactic, ..)
 *   -or-
 * AttackRelationship : ATT&CK relationship
 *
 */

import { Dict } from "../base/types";

// -----------------------------------------------------------------------------
// Aliases

/**
 * STIX ID
 *
 * - Alias of string
 * - StixBaseI.id
 * - UUIDv4
 */
export type StixId = string;

/**
 * ATT&CK ID
 *
 * - Alias of string
 * - AttackObject.external_references[0].external_id
 * - Tnnnn(.nnn), TAnnnn, Gnnnn, ...
 */
export type AttackId = string;

// -----------------------------------------------------------------------------
// Type Restrictions (Object / Relationship / Domain / Kill Chain Name)

/** The type any ATT&CK item may be (objs + rels) */
export type BaseType =
  | "relationship"
  | "x-mitre-matrix"
  | "intrusion-set"
  | "campaign"
  | "tool"
  | "course-of-action"
  | "marking-definition"
  | "x-mitre-tactic"
  | "identity"
  | "malware"
  | "attack-pattern"
  | "x-mitre-data-component"
  | "x-mitre-data-source"
  | "x-mitre-collection"
  | "extension-definition"
  | "x-mitre-asset"
  | "x-mitre-data-component"
  | "x-mitre-data-source";

/** The type any ATT&CK object may be (base - rels) */
export type ObjectType = Exclude<BaseType, "relationship">;

/** The relationship_type any ATT&CK Relationship may be */
export type RelationshipType =
  | "mitigates"
  | "uses"
  | "revoked-by"
  | "attributed-to"
  | "subtechnique-of"
  | "detects"
  | "targets";

/** ATT&CK domain names (basic) */
export const ATTACK_DOMAIN_PLAINS = ["enterprise", "mobile", "ics"] as const;

/** Typing an ATT&CK domain name (basic) */
export type AttackDomainPlain = (typeof ATTACK_DOMAIN_PLAINS)[number];

/**
 * Gives presentation of an ATT&CK domain name
 * - Given: AttackDomainPlain
 * - Gives: A properly capitalized version for UI usage
 */
export const ATTACK_DOMAIN_DISPLAY: { [domain in AttackDomainPlain]: string } =
  {
    enterprise: "Enterprise",
    mobile: "Mobile",
    ics: "ICS",
  } as const;

/**
 * Typing an ATT&CK domain name (x_mitre_domains)
 * - Types individual entries of AttackBase.x_mitre_domains
 */
export type AttackDomainName =
  | "enterprise-attack"
  | "mobile-attack"
  | "ics-attack";

/**
 * ATT&CK domain names (source_name, kill_chain_name)
 * - Names appear in these fields:
 *   - AttackBase.external_references[N].source_name
 *   - Technique.kill_chain_phases[N].kill_chain_name
 */
export const ATTACK_SOURCE_NAMES = [
  "mitre-attack",
  "mitre-mobile-attack",
  "mitre-ics-attack",
] as const;

/**
 * Typing an ATT&CK domain name (source_name, kill_chain_name)
 * - Types these fields:
 *   - AttackBase.external_references[N].source_name
 *   - Technique.kill_chain_phases[N].kill_chain_name
 */
export type AttackSourceName = (typeof ATTACK_SOURCE_NAMES)[number];

// -----------------------------------------------------------------------------
// External References

/** External Reference */
export interface ExtRef {
  readonly source_name: AttackSourceName | string;
  readonly url?: string;
  readonly external_id?: string;
  readonly description?: string;
}

/**
 * ATT&CK External Reference
 * - .external_references[0] of ID'd ATT&CK objects (Techs, Tacts, ..)
 *   contains the ATT&CK ID and URL
 */
export interface AttackExtRef extends ExtRef {
  readonly source_name: AttackSourceName;
  readonly url: string;
  readonly external_id: AttackId;
}

// -----------------------------------------------------------------------------
// Stix Base

/** Represents any STIX item (in-file) */
interface StixBaseI {
  readonly type: BaseType;
  readonly id: StixId;
  readonly external_references?: ExtRef[];
  readonly description?: string;
  readonly spec_version: string;
  readonly created?: string;
  readonly created_by_ref?: string;
  readonly modified?: string;
  readonly object_marking_refs?: string[];
  readonly revoked?: boolean;
}

/** Represents any STIX item (parsed) */
export interface StixBase extends StixBaseI {
  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;
}

function correctDescription(desc: string): string {
  desc = desc.replace(
    /<code>(.*?)<\/code>/gim,
    (_whole: string, inner: string) => {
      const escaped = inner.replace(/[\\<>~]/g, (c: string) => {
        return `&#${c.charCodeAt(0)};`;
      });
      return `<code>${escaped}</code>`;
    }
  );

  return desc;
}

/**
 * De-duplicates External References
 *
 * - Only within the scope of a single item
 * - Different items can have the same ExtRef in their lists
 * - Must keep order (stability sake)
 */
function correctExtRefs(ext_refs: ExtRef[]): ExtRef[] {
  const nameLUT: Map<string, ExtRef> = new Map();

  ext_refs.forEach((ref) => {
    const name = ref.source_name;
    const entry = nameLUT.get(name);

    // already exists -> add any new props
    if (entry) {
      Object.assign(entry, ref);
    }

    // doesn't exist -> place it down
    else {
      nameLUT.set(name, ref);
    }
  });

  return Array.from(nameLUT.values());
}

/** Parses a STIX item from file */
function new_StixBase(data: StixBaseI): StixBase {
  return {
    ...data,
    external_references: correctExtRefs(data.external_references ?? []),
    description: correctDescription(data.description ?? ""),
    revoked: data.revoked ?? false,
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Base

/** Represents any ATT&CK item (in-file) */
interface AttackBaseI extends StixBaseI {
  readonly x_mitre_attack_spec_version: string;
  readonly x_mitre_version: string;
  readonly x_mitre_modified_by_ref?: string;
  readonly x_mitre_domains?: AttackDomainName[];
  readonly x_mitre_deprecated?: boolean;
  readonly x_mitre_contributors?: string[];
}

/** Represents any ATT&CK item (parsed) */
export interface AttackBase extends StixBase, AttackBaseI {
  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // enhancement
  readonly fromDomain: AttackDomainPlain;
}

/** Parse an ATT&CK item from file */
function new_AttackBase(
  data: AttackBaseI,
  fromDomain: AttackDomainPlain
): AttackBase {
  return {
    ...data,
    ...new_StixBase(data),
    x_mitre_domains: data.x_mitre_domains ?? [],
    x_mitre_deprecated: data.x_mitre_deprecated ?? false,
    x_mitre_contributors: data.x_mitre_contributors ?? [],
    fromDomain: fromDomain,
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Object

/** Represents any ATT&CK Object (in-file) */
interface AttackObjectI extends AttackBaseI {
  readonly type: ObjectType;

  readonly name?: string;
}

/** Represents any ATT&CK Object (parsed) */
export interface AttackObject extends AttackBase, AttackObjectI {
  readonly type: ObjectType;

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;

  // Enhancements
  readonly attackId: AttackId;
  readonly attackUrl: string;
}

/** Parse an ATT&CK Object from file */
function new_AttackObject(
  data: AttackObjectI,
  fromDomain: AttackDomainPlain
): AttackObject {
  const item = {
    ...data,
    ...new_AttackBase(data, fromDomain),
    name: data.name ?? "",
    type: data.type,
    attackId: "",
    attackUrl: "",
  };

  const ref = getAttackExtRef(item);
  if (typeof ref !== "undefined") {
    item.attackId = ref.external_id;
    item.attackUrl = ref.url;
  }

  return item;
}

/**
 * Attempts to get the ATT&CK-specific external reference
 * - ID'd objects (Techs, Tacts, ..) have AttackExtRef as .external_reference[0]
 *   - This reference contains an ATT&CK ID and URL
 *   - Not all objects have this reference (thus undefined)
 */
function getAttackExtRef(item: AttackBase): AttackExtRef | undefined {
  for (const ref of item.external_references) {
    if (ATTACK_SOURCE_NAMES.some((val) => val === ref.source_name)) {
      return <AttackExtRef>ref;
    }
  }
  return undefined;
}

// -----------------------------------------------------------------------------
// ATT&CK Relationship

/** Represents an ATT&CK Relationship (in-file) */
interface AttackRelationshipI extends AttackBaseI {
  readonly type: "relationship";

  readonly relationship_type: RelationshipType;
  readonly source_ref: string;
  readonly target_ref: string;
}

/** Represents an ATT&CK Relationship (parsed) */
export interface AttackRelationship extends AttackBase, AttackRelationshipI {
  readonly type: "relationship";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  readonly relationship_type: RelationshipType;
  readonly source_ref: string;
  readonly target_ref: string;
}

/** Parses an ATT&CK Relationship from file */
function new_AttackRelationship(
  data: AttackRelationshipI,
  fromDomain: AttackDomainPlain
): AttackRelationship {
  return {
    ...data,
    ...new_AttackBase(data, fromDomain),
    type: "relationship",
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Mitigation

/** Represents an ATT&CK Mitigation (in-file) */
interface MitigationI extends AttackObjectI {
  readonly type: "course-of-action";

  readonly description: string;
  readonly external_references: ExtRef[];
}

/** Represents an ATT&CK Mitigation (parsed) */
export interface Mitigation extends AttackObject, MitigationI {
  readonly type: "course-of-action";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;
}

/** Parses an ATT&CK Mitigation from file */
function new_Mitigation(
  data: MitigationI,
  fromDomain: AttackDomainPlain
): Mitigation {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: "course-of-action",
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Identity

/** Represents an ATT&CK Identity (in-file) */
interface IdentityI extends AttackObjectI {
  readonly type: "identity";

  readonly identity_class: string;
}

/** Represents an ATT&CK Identity (parsed) */
export interface Identity extends AttackObject, IdentityI {
  readonly type: "identity";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;
}

/** Parses an ATT&CK Identity from file */
function new_Identity(
  data: IdentityI,
  fromDomain: AttackDomainPlain
): Identity {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: "identity",
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Marking Definition

/** Represents an ATT&CK Marking Definition (in-file) */
interface MarkingDefinitionI extends AttackObjectI {
  readonly type: "marking-definition";

  readonly definition: { statement: string };
  readonly definition_type: string;
}

/** Represents an ATT&CK Marking Definition (parsed) */
export interface MarkingDefinition extends AttackObject, MarkingDefinitionI {
  readonly type: "marking-definition";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;
}

/** Parses an ATT&CK Marking Definition from file */
function new_MarkingDefinition(
  data: MarkingDefinitionI,
  fromDomain: AttackDomainPlain
): MarkingDefinition {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: "marking-definition",
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Extension Definition

/** Represents an ATT&CK Extension Definition (in-file) */
interface ExtensionDefinitionI extends AttackObjectI {
  readonly type: "extension-definition";

  readonly extension_types: string[];
  readonly extension_properties: string[];
}

/** Represents an ATT&CK Extension Definition (parsed) */
export interface ExtensionDefinition
  extends AttackObject,
    ExtensionDefinitionI {
  readonly type: "extension-definition";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;

  readonly extension_types: string[];
  readonly extension_properties: string[];
}

/** Parses an ATT&CK Extension Definition from file */
function new_ExtensionDefinition(
  data: ExtensionDefinitionI,
  fromDomain: AttackDomainPlain
): ExtensionDefinition {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: "extension-definition",
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Tactic

/** Represents an ATT&CK Tactic (in-file) */
interface TacticI extends AttackObjectI {
  readonly type: "x-mitre-tactic";

  readonly description: string;
  readonly external_references: ExtRef[];
  readonly x_mitre_shortname: string;
}

/** Represents an ATT&CK Tactic (parsed) */
export interface Tactic extends AttackObject, TacticI {
  readonly type: "x-mitre-tactic";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;
}

/** Parses an ATT&CK Tactic from file */
function new_Tactic(data: TacticI, fromDomain: AttackDomainPlain): Tactic {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: "x-mitre-tactic",
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Technique

/**
 * Technique.kill_chain_phases[N] typing
 * - When .kill_chain_name is an AttackSourceName,
 *   .phase_name is a Tactic.x_mitre_shortname
 */
export interface KillChainPhase {
  readonly phase_name: string;
  readonly kill_chain_name: AttackSourceName | string;
}

/** Represents an ATT&CK Technique (in-file) */
export interface TechniqueI extends AttackObjectI {
  readonly type: "attack-pattern";

  readonly description: string;
  readonly external_references: ExtRef[];
  readonly kill_chain_phases: KillChainPhase[];
  readonly x_mitre_platforms?: string[];
  readonly x_mitre_detection?: string;
  readonly x_mitre_tactic_type?: string[];
  readonly x_mitre_is_subtechnique?: boolean;
  readonly x_mitre_data_sources?: string[];
  readonly x_mitre_permissions_required?: string[];
  readonly x_mitre_defense_bypassed?: string[];
  readonly x_mitre_remote_support?: boolean;
  readonly x_mitre_system_requirements?: string[];
  readonly x_mitre_impact_type?: string[];
  readonly x_mitre_effective_permissions?: string[];
}

/**
 * Technique.name typing
 * - Attack Objects normally have .name: string
 *   - Techniques had this too
 * - This change makes formation of Full Technique Names easier
 *   - Full Name: `{base}: {self}`
 *   - Prevents the need of a Tech lookup when name forming
 */
export interface TechName {
  base: string | null;
  self: string;
}

/**
 * Technique.name Full Name Helper
 * - Builds a string Full Tech Name given a TechName
 *   - Full Name: `{base}: {self}` (or just self)
 */
export function joinTechName(name: TechName): string {
  const { base, self } = name;

  if (base === null) {
    return self;
  } else {
    return `${base}: ${self}`;
  }
}

/** Represents an ATT&CK Technique (parsed) */
export interface Technique
  extends Omit<AttackObject, "name">,
    Omit<TechniqueI, "name"> {
  readonly type: "attack-pattern";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: TechName;

  readonly kill_chain_phases: KillChainPhase[];
  readonly x_mitre_platforms: string[];
  readonly x_mitre_detection?: string;
  readonly x_mitre_tactic_type?: string[];
  readonly x_mitre_is_subtechnique: boolean;
  readonly x_mitre_data_sources: string[];
  readonly x_mitre_permissions_required?: string[];
  readonly x_mitre_defense_bypassed?: string[];
  readonly x_mitre_remote_support?: boolean;
  readonly x_mitre_system_requirements?: string[];
  readonly x_mitre_impact_type?: string[];
  readonly x_mitre_effective_permissions?: string[];
}

/** Parses an ATT&CK Technique from file */
function new_Technique(
  data: TechniqueI,
  techStatuses: TechStatuses,
  fromDomain: AttackDomainPlain
): Technique {
  const attackObj = new_AttackObject(data, fromDomain);
  const { name } = getTechStatus(techStatuses, attackObj.attackId);

  return {
    ...data,
    ...attackObj,
    type: "attack-pattern",
    name,
    // ICS Techs have .x_mitre_platforms = ["None"]
    // - Remove this value while preserving others
    // - An empty array is already indicative of none
    x_mitre_platforms: (data.x_mitre_platforms ?? []).filter(
      (p) => p !== "None"
    ),
    x_mitre_is_subtechnique: data.x_mitre_is_subtechnique ?? false,
    x_mitre_data_sources: data.x_mitre_data_sources ?? [],
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Asset

/** Represents an ATT&CK Asset (in-file) */
interface AssetI extends AttackObjectI {
  readonly type: "x-mitre-asset";
  readonly x_mitre_platforms?: string[];
  readonly x_mitre_sectors?: string[];
}

/** Represents an ATT&CK Asset (parsed) */
export interface Asset extends AttackObject, AssetI {
  readonly type: "x-mitre-asset";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;

  readonly x_mitre_platforms: string[];
  readonly x_mitre_sectors: string[];
}

/** Parses an ATT&CK Asset from file */
function new_Asset(data: AssetI, fromDomain: AttackDomainPlain): Asset {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: data.type,
    x_mitre_platforms: (data.x_mitre_platforms ?? []).filter(
      (p) => p !== "None"
    ),
    x_mitre_sectors: (data.x_mitre_sectors ?? []).filter((p) => p !== "None"),
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Data Component

/** Represents an ATT&CK Data Component (in-file) */
interface DataComponentI extends AttackObjectI {
  readonly type: "x-mitre-data-component";
  readonly x_mitre_data_source_ref: string;
}

/** Represents an ATT&CK Data Component (parsed) */
export interface DataComponent extends AttackObject, DataComponentI {
  readonly type: "x-mitre-data-component";
  readonly x_mitre_data_source_ref: string;

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;
}

/** Parses an ATT&CK Data Component from file */
function new_DataComponent(
  data: DataComponentI,
  fromDomain: AttackDomainPlain
): DataComponent {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: data.type,
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Data Source

/** Represents an ATT&CK Data Source (in-file) */
interface DataSourceI extends AttackObjectI {
  readonly type: "x-mitre-data-source";
}

/** Represents an ATT&CK Data Source (parsed) */
export interface DataSource extends AttackObject, DataSourceI {
  readonly type: "x-mitre-data-source";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;
}

/** Parses an ATT&CK Data Source from file */
function new_DataSource(
  data: DataSourceI,
  fromDomain: AttackDomainPlain
): DataSource {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: data.type,
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Software

/** Represents an ATT&CK Software (in-file) */
interface SoftwareI extends AttackObjectI {
  readonly type: "malware" | "tool";

  readonly description: string;
  readonly x_mitre_platforms?: string[];
  readonly x_mitre_aliases?: string[];
  readonly external_references: ExtRef[];
  readonly is_family?: boolean; // (type = 'malware')
}

/** Represents an ATT&CK Software (parsed) */
export interface Software extends AttackObject, SoftwareI {
  readonly type: "malware" | "tool";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;

  readonly x_mitre_platforms: string[];
  readonly x_mitre_aliases: string[];
  readonly is_family: boolean; // (type = 'malware')
}

/** Parses an ATT&CK Software from file */
function new_Software(
  data: SoftwareI,
  fromDomain: AttackDomainPlain
): Software {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: data.type,
    x_mitre_platforms: data.x_mitre_platforms ?? [],
    x_mitre_aliases: data.x_mitre_aliases ?? [],
    is_family: data.is_family ?? false,
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Campaign

/** Represents an ATT&CK Campaign (in-file) */
interface CampaignI extends AttackObjectI {
  readonly type: "campaign";

  readonly description: string;
  readonly aliases: string[];
  readonly first_seen: string;
  readonly last_seen: string;
  readonly x_mitre_first_seen_citation: string;
  readonly x_mitre_last_seen_citation: string;
  readonly external_references: ExtRef[];
}

/** Represents an ATT&CK Campaign (parsed) */
export interface Campaign extends AttackObject, CampaignI {
  readonly type: "campaign";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;
}

/** Parses an ATT&CK Campaign from file */
function new_Campaign(
  data: CampaignI,
  fromDomain: AttackDomainPlain
): Campaign {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: "campaign",
  };
}

// -----------------------------------------------------------------------------
// ATT&CK Group

/** Represents an ATT&CK Group (in-file) */
interface GroupI extends AttackObjectI {
  readonly type: "intrusion-set";

  readonly aliases?: string[];
  readonly external_references: ExtRef[];
}

/** Represents an ATT&CK Group (parsed) */
export interface Group extends AttackObject, GroupI {
  readonly type: "intrusion-set";

  // StixBase
  readonly external_references: ExtRef[];
  readonly description: string;
  readonly revoked: boolean;

  // AttackBase
  readonly x_mitre_domains: AttackDomainName[];
  readonly x_mitre_deprecated: boolean;
  readonly x_mitre_contributors: string[];

  // AttackObject
  readonly name: string;

  readonly aliases: string[];
}

/** Parses an ATT&CK Group from file */
function new_Group(data: GroupI, fromDomain: AttackDomainPlain): Group {
  return {
    ...data,
    ...new_AttackObject(data, fromDomain),
    type: "intrusion-set",
    aliases: data.aliases ?? [],
  };
}

// -----------------------------------------------------------------------------
// ATT&CK File --processing--> Dataset

/** Represents an ATT&CK STIX File */
export interface AttackFile {
  readonly type: string;
  readonly id: string;
  readonly spec_version: string;
  readonly objects: AttackBaseI[];
}

/** Concatenates and returns the Technique Status Lookup of all domains */
export function getTechStatusLut(attack: AttackDatasets): TechStatuses {
  return {
    ...attack.enterprise.techStatuses,
    ...attack.mobile.techStatuses,
    ...attack.ics.techStatuses,
  };
}

/**
 * Unknown Technique Blank Name Provider
 * - Returns
 *   - "-" for Base Techs
 *   - "-": "-" for Sub Techs
 */
function unknownTechName(id: AttackId): TechName {
  const isSub = id.includes(".");
  return {
    base: isSub ? "-" : null,
    self: "-",
  };
}

/**
 * Lookup the Status of a Technique ID
 * - missing tech -> undefined -> "unknown" + blank name provider
 */
export function getTechStatus(lut: TechStatuses, id: AttackId): TechIdStatus {
  return lut[id] ?? { type: "unknown", name: unknownTechName(id) };
}

/**
 * Typing for Status of a Technique
 * - name
 *   - The .name: TechName of the Technique
 *   - For an unfound / "unknown" Tech, this is ("-") or ("-": "-")
 * - type
 *   - active
 *     - Technique is not deprecated / revoked / unknown
 *     - Technique will be present in-app
 *   - deprecated
 *     - Technique is marked .x_mitre_deprecated: true
 *   - revoked
 *     - Technique is marked .revoked: true
 *     - Technique is source of a "revoked-by" Relationship
 *     - by: The Name + ID of the Technique this is revoked by
 *   - unknown
 *     - Technique was not found
 */
export type TechIdStatus = { name: TechName } & (
  | { type: "active" }
  | { type: "deprecated" }
  | { type: "revoked"; by: string }
  | { type: "unknown" }
);

/**
 * TechIdStatus Lookup Type
 * - Uses undefined as a non-existant Tech wouldn't have an entry
 */
type TechStatuses = Dict<TechIdStatus | undefined>;

/** Represents an ATT&Ck Dataset parsed from a whole ATT&CK File */
export interface AttackDataset {
  readonly id: string;
  readonly spec_version: string;

  /**
   * Technique Status Lookup
   * - Provides a fast means of checking the status of a Technique
   *   - active / deprecated / revoked / unknown
   * - Allows recording the statuses + IDs of ALL Techs without
   *   polluting the techniques list with inactive Techs
   */
  readonly techStatuses: TechStatuses;

  readonly tactics: Tactic[];
  readonly techniques: Technique[];
  readonly assets: Asset[];
  readonly dataComponents: DataComponent[];
  readonly dataSources: DataSource[];
  readonly groups: Group[];
  readonly campaigns: Campaign[];
  readonly software: Software[];
  readonly relationships: AttackRelationship[];
  readonly mitigations: Mitigation[];
  readonly identities: Identity[];
  readonly markingDefinitions: MarkingDefinition[];
  readonly extensionDefinitions: ExtensionDefinition[];
}

/**
 * Creates an empty/blank AttackDataset
 * - Effectively null without the need to option chain
 */
export function blank_AttackDataset(): AttackDataset {
  return {
    id: "",
    spec_version: "",

    techStatuses: {},

    tactics: [],
    techniques: [],
    assets: [],
    dataComponents: [],
    dataSources: [],
    groups: [],
    campaigns: [],
    software: [],
    relationships: [],
    mitigations: [],
    identities: [],
    markingDefinitions: [],
    extensionDefinitions: [],
  };
}

/**
 * Identify the Plain ATT&CK Domain Name of an ATT&CK File
 * 1. Finds the x-mitre-collection object
 * 2. Reads the collection's name
 * 3. Returns the domain that was found as a substring
 *    - Errors if identification fails
 */
function identifyDomain(data: AttackFile): AttackDomainPlain {
  const collection = data.objects.find((o) => o.type === "x-mitre-collection");

  if (typeof collection === "undefined")
    throw new Error("Could not find x-mitre-collection in file.objects");

  const dataName = (
    (collection as { name?: string }).name ?? "<missing>"
  ).toLowerCase();

  for (const name of ATTACK_DOMAIN_PLAINS) {
    if (dataName.includes(name)) return name;
  }

  throw new Error(
    `Could not determine ATT&CK domain from x-mitre-collection.name of (${dataName})`
  );
}

/**
 * Builds the Technique Status Lookup
 * - For all Techniques in a given ATT&CK File
 *   - (active or not)
 * - Follows revocation chains to the final target
 *   - Marks each Tech (in chain) as revoked if final target is active
 *   - Marks each Tech (in chain) as deprecated if final target is deprecated
 */
function buildTechStatuses(data: AttackFile): TechStatuses {
  const statuses: TechStatuses = {};

  const domain = identifyDomain(data);

  const allTechs = data.objects
    .filter((item) => item.type === "attack-pattern")
    .map((item) => new_AttackObject(<TechniqueI>item, domain));

  const stixIdToTech: { [id: StixId]: AttackObject } = {};
  allTechs.forEach((tech) => (stixIdToTech[tech.id] = tech));

  const techIdToTech: { [id: AttackId]: AttackObject } = {};
  allTechs.forEach((tech) => (techIdToTech[tech.attackId] = tech));

  const getTechName = (tech: AttackObject): TechName => {
    const self = tech.name;
    let base = null;

    if (tech.attackId.includes(".")) {
      const baseId = tech.attackId.split(".")[0];
      const baseTech = techIdToTech[baseId];
      base = baseTech.name;
    }

    return { base, self };
  };

  /** Tech Revocation LUT: ATT&CK ID ---revoked-by--> Tech */
  const techIdRevByTech: { [id: AttackId]: AttackObject } = {};

  data.objects
    .filter((item) => item.type === "relationship")
    .map((item) => item as AttackRelationshipI)
    .filter(
      (rel) =>
        rel.relationship_type === "revoked-by" &&
        Relationship_getSrcType(rel) === "attack-pattern" &&
        Relationship_getTgtType(rel) === "attack-pattern"
    )
    .forEach((rel) => {
      const sourceT = stixIdToTech[rel.source_ref];
      const targetT = stixIdToTech[rel.target_ref];
      techIdRevByTech[sourceT.attackId] = targetT;
    });

  // populate tech status table
  allTechs.forEach((tech) => {
    const tid = tech.attackId;
    const name = getTechName(tech);

    // deprecated
    if (tech.x_mitre_deprecated) {
      statuses[tid] = { type: "deprecated", name };
    }

    // active
    else if (!tech.revoked) {
      statuses[tid] = { type: "active", name };
    }

    // revoked
    else {
      // follow revocation chain to final node
      let dest = tech;
      while (dest.revoked) {
        dest = techIdRevByTech[dest.attackId];
      }

      // deprecated - final is deprecated
      if (dest.x_mitre_deprecated) {
        statuses[tid] = { type: "deprecated", name };
      }

      // revoked - final is active
      else {
        statuses[tid] = {
          type: "revoked",
          by: dest.attackId,
          name,
        };
      }
    }
  });

  return statuses;
}

/** Processes AttackFile (ATT&CK.json) --into--> AttackDataset */
export function new_AttackDataset(data: AttackFile): AttackDataset {
  const fromDomain = identifyDomain(data);

  const dataset: AttackDataset = {
    ...blank_AttackDataset(),
    id: data.id,
    spec_version: data.spec_version,
    techStatuses: buildTechStatuses(data),
  };

  const activeObjectIds = new Set<string>();

  // add [ non-dep | non-revoke ] objects first
  data.objects
    .filter((item) => item.type !== "relationship" && isItemActive(item))
    .forEach((item) => {
      if (AttackDataset_addItem(dataset, item, fromDomain)) {
        activeObjectIds.add(item.id);
      }
    });

  // add [ non-dep | non-revoke | src-found | tgt-found ] rels second
  data.objects
    .filter(
      (item) =>
        item.type === "relationship" &&
        isRelationshipActive(<AttackRelationshipI>item, activeObjectIds)
    )
    .forEach((item) => {
      AttackDataset_addItem(dataset, item, fromDomain);
    });

  // post-add sorting
  dataset.techniques.sort((a, b) =>
    a.attackId.localeCompare(b.attackId, "en", { sensitivity: "base" })
  );

  return dataset;
}

/**
 * Adds an in-file ATT&CK Item to an ATT&CK Dataset
 * - If the type is known
 *   1. The item is cast to its according in-file type
 *   2. The item is parsed
 *   3. The item is added to its according list
 *   4. true is returned
 * - If the type is unknown
 *   1. false is returned
 */
function AttackDataset_addItem(
  ds: AttackDataset,
  data: AttackBaseI,
  fromDomain: AttackDomainPlain
): boolean {
  // return: bool, true if added

  let item;

  switch (data.type) {
    case "relationship":
      item = new_AttackRelationship(<AttackRelationshipI>data, fromDomain);
      ds.relationships.push(item);
      break;

    case "course-of-action":
      item = new_Mitigation(<MitigationI>data, fromDomain);
      ds.mitigations.push(item);
      break;

    case "marking-definition":
      item = new_MarkingDefinition(<MarkingDefinitionI>data, fromDomain);
      ds.markingDefinitions.push(item);
      break;

    case "x-mitre-tactic":
      item = new_Tactic(<TacticI>data, fromDomain);
      ds.tactics.push(item);
      break;

    case "x-mitre-asset":
      item = new_Asset(<AssetI>data, fromDomain);
      ds.assets.push(item);
      break;

    case "x-mitre-data-component":
      item = new_DataComponent(<DataComponentI>data, fromDomain);
      ds.dataComponents.push(item);
      break;

    case "x-mitre-data-source":
      item = new_DataSource(<DataSourceI>data, fromDomain);
      ds.dataSources.push(item);
      break;

    case "identity":
      item = new_Identity(<IdentityI>data, fromDomain);
      ds.identities.push(item);
      break;

    case "attack-pattern":
      item = new_Technique(<TechniqueI>data, ds.techStatuses, fromDomain);
      ds.techniques.push(item);
      break;

    case "extension-definition":
      item = new_ExtensionDefinition(<ExtensionDefinitionI>data, fromDomain);
      ds.extensionDefinitions.push(item);
      break;

    case "malware":
    case "tool":
      item = new_Software(<SoftwareI>data, fromDomain);
      ds.software.push(item);
      break;

    case "campaign":
      item = new_Campaign(<CampaignI>data, fromDomain);
      ds.campaigns.push(item);
      break;

    case "intrusion-set":
      item = new_Group(<GroupI>data, fromDomain);
      ds.groups.push(item);
      break;

    default:
      item = undefined;
      break;
  }

  return typeof item !== "undefined";
}

/** Lookup of each AttackDataset by plain domain name */
export type AttackDatasets = {
  [domain in AttackDomainPlain]: AttackDataset;
};

// -----------------------------------------------------------------------------
// Functions / Faux Methods

/** Given item and AttackDatasets - gives dataset specific to item */
export function lookupAttackDataset(
  dss: AttackDatasets,
  item: AttackBase
): AttackDataset {
  return dss[item.fromDomain];
}

/** True if Item (Base) isn't deprecated or revoked */
export function isItemActive(item: AttackBaseI): boolean {
  return !item.x_mitre_deprecated && !item.revoked;
}

/** True if Relationship isn't deprecated or revoked and src/tgt can be found */
export function isRelationshipActive(
  item: AttackRelationshipI,
  activeObjectIds: Set<string>
): boolean {
  return (
    isItemActive(item) &&
    activeObjectIds.has(item.source_ref) &&
    activeObjectIds.has(item.target_ref)
  );
}

/** Returns the source type of a Relationship */
export function Relationship_getSrcType(item: AttackRelationshipI): ObjectType {
  return <ObjectType>item.source_ref.split("--")[0];
}

/** Returns the target type of a Relationship */
export function Relationship_getTgtType(item: AttackRelationshipI): ObjectType {
  return <ObjectType>item.target_ref.split("--")[0];
}

/** Gets a Technique by its AttackId or StixId (only pass valid IDs) */
export function getTech(ds: AttackDataset, id: AttackId | StixId): Technique {
  if (id.startsWith("T")) {
    return <Technique>ds.techniques.find((t) => t.attackId === id);
  } else {
    return <Technique>ds.techniques.find((t) => t.id === id);
  }
}

/** getTech(), but it searches all domains (only pass valid IDs) */
export function getTechAll(
  dss: AttackDatasets,
  id: AttackId | StixId
): Technique {
  for (const ds of Object.values(dss)) {
    const tech = <Technique | undefined>getTech(ds as AttackDataset, id);
    if (typeof tech !== "undefined") return tech;
  }
  return <Technique>{}; // not reachable with valid IDs
}

/** Gets a Tactic by its AttackId or StixId (only pass valid IDs) */
export function getTact(ds: AttackDataset, id: AttackId | StixId): Tactic {
  if (id.startsWith("TA")) {
    return <Tactic>ds.tactics.find((t) => t.attackId === id);
  } else {
    return <Tactic>ds.tactics.find((t) => t.id === id);
  }
}

/** getTact(), but it searches all domains (only pass valid IDs) */
export function getTactAll(dss: AttackDatasets, id: AttackId | StixId): Tactic {
  for (const ds of [dss.enterprise, dss.mobile, dss.ics]) {
    const tact = <Tactic | undefined>getTact(ds, id);
    if (typeof tact !== "undefined") return tact;
  }
  return <Tactic>{}; // not reachable with valid IDs
}

/** Get Tactics a Technique is under */
export function Tech_getTactics(
  dss: AttackDatasets,
  tech: Technique
): Tactic[] {
  const ds = lookupAttackDataset(dss, tech);

  const shortnames = tech.kill_chain_phases
    .filter((phase) =>
      ATTACK_SOURCE_NAMES.some((val) => val === phase.kill_chain_name)
    )
    .map((phase) => phase.phase_name);
  return ds.tactics.filter((tact) =>
    shortnames.includes(tact.x_mitre_shortname)
  );
}

/** Get Techniques under a Tactic */
export function Tact_getTechniques(
  dss: AttackDatasets,
  tact: Tactic
): Technique[] {
  const ds = lookupAttackDataset(dss, tact);

  return ds.techniques.filter((tech) => {
    const shortnames = tech.kill_chain_phases
      .filter((phase) =>
        ATTACK_SOURCE_NAMES.some((val) => val === phase.kill_chain_name)
      )
      .map((phase) => phase.phase_name);
    return shortnames.includes(tact.x_mitre_shortname);
  });
}

/** Return base Tech for this Tech if it exists */
export function Tech_getBaseTech(
  dss: AttackDatasets,
  tech: Technique
): Technique | undefined {
  const ds = lookupAttackDataset(dss, tech);

  if (tech.x_mitre_is_subtechnique) {
    const baseId = tech.attackId.split(".")[0];
    return getTech(ds, baseId);
  } else {
    return undefined;
  }
}

/** Return list of sub Techs, empty if 0 subs or if this Tech is a sub */
export function Tech_getSubTechs(
  dss: AttackDatasets,
  tech: Technique
): Technique[] {
  const ds = lookupAttackDataset(dss, tech);

  if (tech.x_mitre_is_subtechnique) {
    return [];
  } else {
    return ds.techniques.filter((sub) =>
      sub.attackId.startsWith(`${tech.attackId}.`)
    );
  }
}

/** Return a Tech's "neighborhood" (base+subs), where Tech can be a base or a sub */
export function Tech_getBaseAndSubs(
  dss: AttackDatasets,
  tech: Technique
): { base: Technique; subs: Technique[] } {
  const base = tech.x_mitre_is_subtechnique
    ? <Technique>Tech_getBaseTech(dss, tech)
    : tech;
  const subs = Tech_getSubTechs(dss, base);
  return { base, subs };
}

/**
 * Structure to Organize Relationships of what "uses" a Technique
 *
 * - Each field is a type of ATT&CK Object that can use a Technique
 *   - Each value is a list of "uses" Relationships with source being that
 *     object type
 * - These are procedure examples
 */
export interface TechProcedureBreakdown {
  readonly tool: AttackRelationship[]; // |- Software
  readonly malware: AttackRelationship[]; // |
  readonly group: AttackRelationship[];
  readonly campaign: AttackRelationship[];
}

/** Returns organized Relationships of what 'uses' this Tech */
export function Tech_getProcedureBreakdown(
  dss: AttackDatasets,
  tech: Technique
): TechProcedureBreakdown {
  const ds = lookupAttackDataset(dss, tech);

  const toolRels: AttackRelationship[] = [];
  const malwareRels: AttackRelationship[] = [];
  const groupRels: AttackRelationship[] = [];
  const campaignRels: AttackRelationship[] = [];

  ds.relationships
    .filter(
      (rel) => rel.relationship_type === "uses" && rel.target_ref === tech.id
    )
    .forEach((rel) => {
      const srcType = Relationship_getSrcType(rel);
      switch (srcType) {
        case "tool":
          toolRels.push(rel);
          break;

        case "malware":
          malwareRels.push(rel);
          break;

        case "intrusion-set":
          groupRels.push(rel);
          break;

        case "campaign":
          campaignRels.push(rel);
          break;
      }
    });

  return {
    tool: toolRels,
    malware: malwareRels,
    group: groupRels,
    campaign: campaignRels,
  };
}

/**
 * Platform names of a Technique (better than .x_mitre_platforms)
 *
 * - Gives platform names as the union of:
 *   - Each platform string in Tech.x_mitre_platforms
 *   - .name of each Asset that this Tech targets
 *   - Each platform string in .x_mitre_platforms of Assets this Tech targets
 * - Fixes the 'issue' of ICS Techniques appearing to run on nothing
 *   - Names of what they target are now mentioned
 *   - Names of the underlying platforms those targets run on are now mentioned
 * - A-Z Sorted for clean UI use
 */
export function Tech_getPlatformNames(
  attack: AttackDatasets,
  tech: Technique
): string[] {
  const dataset = lookupAttackDataset(attack, tech);

  const namesSet = new Set(tech.x_mitre_platforms);

  const assetIds = new Set<string>();

  dataset.relationships
    .filter(
      (rel) =>
        rel.relationship_type === "targets" &&
        rel.source_ref === tech.id &&
        rel.target_ref.startsWith("x-mitre-asset")
    )
    .forEach((rel) => assetIds.add(rel.target_ref));

  dataset.assets
    .filter((asset) => assetIds.has(asset.id))
    .forEach((asset) => {
      namesSet.add(asset.name);
      asset.x_mitre_platforms.forEach((platform) => namesSet.add(platform));
    });

  const names = Array.from(namesSet);
  names.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  return names;
}

// -----------------------------------------------------------------------------
// ATT&CK Technique Search Helpers

/**
 * Bulk Calculate Map: Tech ID -> Domain Names
 * - Runs on EVERY Technique
 * - Useful for making filters for Tech search construction
 */
function getTechIdToDomainNames(attack: AttackDatasets) {
  const map = new Map<string, readonly string[]>();
  const allTechs = Object.values(attack).flatMap(
    (dataset) => dataset.techniques
  );

  // each Tech has the domain of the ATT&CK file it came from
  allTechs.forEach((tech) =>
    map.set(tech.attackId, [ATTACK_DOMAIN_DISPLAY[tech.fromDomain]])
  );

  return map;
}

/**
 * Bulk Calculate Map: Tech ID -> Data Source Names
 * - Runs on EVERY Technique
 * - Useful for making filters for Tech search construction
 */
function getTechIdToDataSourceNames(attack: AttackDatasets) {
  const map = new Map<string, readonly string[]>();

  // pre-fill [] for each Tech (as some won't have DataSources or rels for them)
  const empty = [] as const;
  const allTechs = Object.values(attack).flatMap(
    (dataset) => dataset.techniques
  );
  allTechs.forEach((tech) => map.set(tech.attackId, empty));

  // make LUT to allow lookup of Tech, DataSrc, and DataComp with id refs
  const stixLUT = new Map<StixId, AttackBase>();
  Object.values(attack).forEach((dataset) => {
    [dataset.techniques, dataset.dataSources, dataset.dataComponents].forEach(
      (list) => {
        list.forEach((item) => {
          stixLUT.set(item.id, item);
        });
      }
    );
  });

  // get DataComp --detects--> Tech relationships
  const allRels = Object.values(attack).flatMap(
    (dataset) => dataset.relationships
  );
  const detectsRels = allRels.filter(
    (rel) =>
      rel.relationship_type === "detects" &&
      rel.source_ref.startsWith("x-mitre-data-component") &&
      rel.target_ref.startsWith("attack-pattern")
  );

  // each relationship
  detectsRels.forEach((rel) => {
    // get the Tech + DataComp
    const tech = stixLUT.get(rel.target_ref) as Technique;
    const dataComp = stixLUT.get(rel.source_ref) as DataComponent;

    // get the DataComp's DataSource
    const dataSrc = stixLUT.get(dataComp.x_mitre_data_source_ref) as DataSource;

    // add DataSource.name under Tech ID
    const techId = tech.attackId;
    map.set(techId, [...(map.get(techId) ?? []), dataSrc.name]);
  });

  // De-dupe DataSource names
  // - As a Tech may have been detected by multiple
  //   DataComps under the same DataSource.
  map.forEach((names, techId) => map.set(techId, [...new Set(names)]));

  return map;
}

/**
 * Bulk Calculate Map: Tech ID -> Tactic Names
 * - Runs on EVERY Technique
 * - Useful for making filters for Tech search construction
 */
function getTechIdToTacticNames(attack: AttackDatasets) {
  const map = new Map<string, readonly string[]>();

  // for each domain [enterprise, mobilem ics]
  Object.values(attack).forEach((dataset) => {
    // make shortname -> Tactic LUT
    const shortnameToTact = new Map<string, Tactic>();
    dataset.tactics.forEach((tact) =>
      shortnameToTact.set(tact.x_mitre_shortname, tact)
    );

    // for domain's techs
    dataset.techniques.forEach((tech) => {
      // get its shortnames
      const shortnames = tech.kill_chain_phases
        .filter((kcp) =>
          (ATTACK_SOURCE_NAMES as readonly string[]).includes(
            kcp.kill_chain_name
          )
        )
        .map((kcp) => kcp.phase_name);

      // map to Tactic names and set
      const tacticNames = shortnames.map(
        (sn) => (shortnameToTact.get(sn) as Tactic).name
      );
      map.set(tech.attackId, tacticNames);
    });
  });

  return map;
}

/**
 * Bulk Calculate Map: Tech ID -> Platform Names
 * - Same platforms as Tech_getPlatformNames(), but without A-Z sort
 * - Runs on EVERY Technique
 * - Useful for making filters for Tech search construction
 */
function getTechIdToPlatformNames(attack: AttackDatasets) {
  const map = new Map<string, readonly string[]>();

  // pre-fill a Tech's own platforms (will be [] for ICS)
  const allTechs = Object.values(attack).flatMap(
    (dataset) => dataset.techniques
  );
  allTechs.forEach((tech) => map.set(tech.attackId, tech.x_mitre_platforms));

  // make a LUT of Techs + Assets to lookup id refs
  const stixLUT = new Map<StixId, AttackBase>();
  Object.values(attack).forEach((dataset) => {
    [dataset.techniques, dataset.assets].forEach((list) => {
      list.forEach((item) => {
        stixLUT.set(item.id, item);
      });
    });
  });

  // get Tech --targets--> Asset relationships
  const allRels = Object.values(attack).flatMap(
    (dataset) => dataset.relationships
  );
  const targetsRels = allRels.filter(
    (rel) =>
      rel.relationship_type === "targets" &&
      rel.source_ref.startsWith("attack-pattern") &&
      rel.target_ref.startsWith("x-mitre-asset")
  );

  // for each targets relationship
  targetsRels.forEach((rel) => {
    // get the Tech and Asset
    const tech = stixLUT.get(rel.source_ref) as Technique;
    const asset = stixLUT.get(rel.target_ref) as Asset;

    // platforms += [Asset.name, Asset.platforms]
    const techId = tech.attackId;
    map.set(techId, [
      ...(map.get(techId) ?? []),
      ...asset.x_mitre_platforms,
      asset.name,
    ]);
  });

  // De-dupe Platforms
  // - A Tech can use multiple Assets that have the same base platforms
  map.forEach((names, techId) => map.set(techId, [...new Set(names)]));

  return map;
}

/**
 * Tech Search Helpers
 * - Under a single export for ease
 * - Each func here runs on ALL Techniques
 * - Useful for making filters for Tech Search Doc creation
 */
export const getTechIdTo = {
  domainNames: getTechIdToDomainNames,
  dataSourceNames: getTechIdToDataSourceNames,
  tacticNames: getTechIdToTacticNames,
  platformNames: getTechIdToPlatformNames,
};
