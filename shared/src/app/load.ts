import {
  AttackDataset,
  AttackDatasets,
  AttackDomainPlain,
  AttackFile,
  blank_AttackDataset,
  getTechStatus,
  getTechStatusLut,
  joinTechName,
  new_AttackDataset,
} from "../attack/objects";
import { Dict } from "../base/types";
import {
  Dataset,
  DatasetFile,
  Item,
  ItemEntry,
  MappedTech,
  TechToItemMap,
  Template,
} from "../dataset/types";
import { AppConfig, AppConfigFile } from "./runtime-config/types";
import { AppDataIndex } from "./store/appdata";
import { ajv, schemaCheckers } from "../schema-checkers";
import { isDateValid } from "../base/utils/time";
import {
  DATASET_CUR_SPEC_VERSION,
  DEFAULT_TECH_CONFIDENCE,
} from "../dataset/constants";
import { stringsAreUnique } from "../base/utils/string";
import { difference, stableDedupe } from "../base/utils/set";
import { LoggingContext } from "../base/utils/logging";
import { highestVersion } from "../base/utils/versioning";
import { getDatasetTechToItems } from "../dataset/utils";
import { ttiItemIDs, ttiTechIDs } from "../playbook/helpers";

/**
 * IDs / Versions of What is (to be) Loaded
 *
 * - Each ATT&CK Domain as a key
 *   - null if unloaded
 *   - string of Version if loaded
 * - Always-loaded single Dataset ID + Version
 */
export type ToBeLoaded = {
  attack: {
    [domain in AttackDomainPlain]: string | null;
  };
  dataset: {
    id: string;
    version: string;
  };
};

/**
 * An Adjustment Performed on a Untrusted Technique ID
 *
 * A set of Tech IDs from the user / loaded files cannot be used outright
 *   - They must be "adjusted" first
 *     - Adjusting to what is present + active in the loaded domains of ATT&CK
 */
export type TechAdjustment = { id: string } & (
  | { name: undefined; status: "removed"; reason: "tech is unknown" }
  | { name: string; status: "removed"; reason: "tech is deprecated" }
  | {
      name: string;
      status: "replaced";
      reason: string;
      replacedBy: { id: string; name: string };
    }
  | { name: string; status: "unchanged"; reason: "-" }
  | { name: string; status: "added"; reason: string }
);

/**
 * Load-time Adjustments Performed on Mapped Untrusted Tech IDs
 *
 * item: Item ID     -> adjustments lookup
 * tmpl: Template ID -> adjustments lookup
 */
export type DatasetAdjustments = {
  item: Dict<TechAdjustment[]>;
  tmpl: Dict<TechAdjustment[]>;
};

/**
 * Information on what the App Loaded
 *
 * - Includes ToBeLoaded
 * - Also includes what "adjustments" had to be performed on the Technique IDs,
 *   that are mapped to the Items / Templates within the Dataset, in order to
 *   make them all present + active within the loaded domains of ATT&CK
 */
export type LoadInfo = {
  dataLoaded: ToBeLoaded;
  datasetAdjusts: DatasetAdjustments;
};

/** A blank/unloaded LoadInfo value */
export function initialLoadInfo(): LoadInfo {
  return {
    dataLoaded: {
      attack: {
        enterprise: null,
        mobile: null,
        ics: null,
      },
      dataset: {
        id: "",
        version: "",
      },
    },
    datasetAdjusts: {
      item: {},
      tmpl: {},
    },
  };
}

// index -----------------------------------------------------------------------

/**
 * Get AppDataIndex from unknown data by checking its schema
 *
 * - Error on invalid
 */
function indexCheckSchema(data: unknown): AppDataIndex {
  const check = schemaCheckers.appDataIndex;
  if (check(data)) return data;
  else throw new Error(ajv.errorsText(check.errors));
}

/**
 * Check contents of AppDataIndex and pass it through
 *
 * - Error on invalid
 */
function indexCheckData(data: AppDataIndex): AppDataIndex {
  if (
    data.attack_enterprise.length === 0 &&
    data.attack_mobile.length === 0 &&
    data.attack_ics.length === 0
  )
    throw new Error("no versions of ATT&CK present");

  if (Object.values(data.datasets).flat().length === 0)
    throw new Error("no Datasets present");

  if (!isDateValid(new Date(data.last_updated)))
    throw new Error("last_updated isn't a valid timestamp");

  return data;
}

// config ----------------------------------------------------------------------

/**
 * Structure to Hold Config Data
 *
 * - user: user.json (preferentially loaded, optional)
 * - defa: default.json (required if fallback)
 */
type Config<T> = {
  user: T;
  defa: T;
};

/**
 * Get Configs from unknown data by checking their schemas
 *
 * - Error if both are invalid
 */
function configCheckSchemas(
  data: Config<unknown>
): Config<AppConfigFile | null> {
  const { user, defa } = data;

  const check = schemaCheckers.appConfigFile;

  const userOk = check(user);
  const userErr = ajv.errorsText(check.errors);

  const defaOk = check(defa);
  const defaErr = ajv.errorsText(check.errors);

  if (userOk && defaOk) return { user, defa };
  else if (!userOk && defaOk) return { defa, user: null };
  else if (userOk && !defaOk) return { user, defa: null };
  else
    throw new Error(
      `both files had invalid schemas: user.json (${userErr}), default.json (${defaErr})`
    );
}

/** Grab either DEV or PROD Config */
function configTrimToAppMode(
  data: Config<AppConfigFile | null>,
  inProd: boolean
): Config<AppConfig | null> {
  const convert = (file: AppConfigFile | null): AppConfig | null => {
    if (file === null) return null;
    if (inProd) return file.prod;
    return file.dev;
  };

  const { user, defa } = data;

  return {
    user: convert(user),
    defa: convert(defa),
  };
}

/**
 * Check contents of both Configs and pass them through
 *
 * - Error if both are invalid
 */
function configCheckDatas(
  data: Config<AppConfig | null>
): Config<AppConfig | null> {
  const { user, defa } = data;

  const anyAttackLoads = (conf: AppConfig | null): boolean => {
    if (conf === null) return false;
    const a = conf.load.attack;
    return a.enterprise || a.mobile || a.ics;
  };

  const userOk = anyAttackLoads(user);
  const defaOk = anyAttackLoads(defa);

  if (userOk && defaOk) return { user, defa };
  else if (!userOk && defaOk) return { defa, user: null };
  else if (userOk && !defaOk) return { user, defa: null };
  else
    throw new Error(
      `both files (user.json, default.json) specified no ATT&CK domains to load`
    );
}

/**
 * Cross-check contents of both Configs against Index and pass them through
 *
 * - Error if both are invalid
 */
function configCheckAgainstIndex(
  data: Config<AppConfig | null>,
  index: AppDataIndex
): Config<AppConfig | null> {
  const { user, defa } = data;

  const getError = (
    conf: AppConfig | null,
    index: AppDataIndex
  ): null | string => {
    if (conf === null) return "config file doesn't exist";

    const confAttack = conf.load.attack;

    if (confAttack.enterprise && index.attack_enterprise.length === 0)
      return "ATT&CK Enterprise specified to load, but no versions available";

    if (confAttack.mobile && index.attack_mobile.length === 0)
      return "ATT&CK Mobile specified to load, but no versions available";

    if (confAttack.ics && index.attack_ics.length === 0)
      return "ATT&CK ICS specified to load, but no versions available";

    const confDataset = conf.load.dataset;

    if (!(index.datasets[confDataset.id] ?? []).includes(confDataset.version))
      return `Dataset id=${confDataset.id} version=${confDataset.version} not available in index`;

    return null;
  };

  const userErr = getError(user, index);
  const userOk = userErr === null;

  const defaErr = getError(defa, index);
  const defaOk = defaErr === null;

  if (userOk && defaOk) return { user, defa };
  else if (!userOk && defaOk) return { defa, user: null };
  else if (userOk && !defaOk) return { user, defa: null };
  else
    throw new Error(
      `both files had issues against index.json: user.json (${userErr}), default.json (${defaErr})`
    );
}

/**
 * Pick Config from user or default
 *
 * - Prefer user
 *   - Use default if user missing
 */
function configPick(data: Config<AppConfig | null>): AppConfig {
  const { user, defa } = data;
  return (user ?? defa) as AppConfig;
}

// attack ----------------------------------------------------------------------

/**
 * Parse AttackFile to AttackDataset
 *
 * - Thin wrapper over new_AttackDataset()
 * - null returns blank_AttackDataset()
 */
function attackParseFile(file: AttackFile | null): AttackDataset {
  if (file === null) return blank_AttackDataset();
  else return new_AttackDataset(file);
}

// dataset ---------------------------------------------------------------------

/**
 * Get DatasetFile from unknown data by checking its schema
 *
 * - Errors on invalid
 */
function datasetCheckSchema(data: unknown): DatasetFile {
  const check = schemaCheckers.datasetFile;
  if (check(data)) return data;
  else throw new Error(ajv.errorsText(check.errors));
}

/**
 * Check content of DatasetFile and pass it through
 *
 * - Errors on invalid
 */
function datasetCheckData(data: DatasetFile): DatasetFile {
  const { item_type } = data;

  const validSpec = DATASET_CUR_SPEC_VERSION;

  if (data.spec_version !== validSpec) {
    throw new Error(
      `Only .spec_version: ${validSpec} supported - got ${data.spec_version} instead`
    );
  }

  if (!stringsAreUnique(data.items.map((i) => i.id)))
    throw new Error(`Collision in ${item_type} IDs`);
  if (!stringsAreUnique(data.templates.map((t) => t.id)))
    throw new Error(`Collision in Template IDs`);

  const itemLUT = new Map<string, Item>();
  data.items.forEach((i) => itemLUT.set(i.id, i));

  // Item checks
  for (const item of data.items) {
    // item.(field).map - uniqueness
    const nameValsPair: [string, string[]][] = [
      ["contributors", item.contributors],
      ["technologies", item.technologies],
      ["platforms", item.platforms],
      ["ids_before_this", item.ids_before_this],
      ["ids_after_this", item.ids_after_this],
      ["related_ids", item.related_ids],
      ["techniques (by tech_id)", item.techniques.map((t) => t.tech_id)],
    ];
    for (const [name, vals] of nameValsPair) {
      if (!stringsAreUnique(vals)) {
        throw new Error(
          `${item_type} ${item.id} has duplicate entries in .${name}`
        );
      }
    }

    // item.revoked - by unknown ID
    if (item.revoked !== null) {
      const { by_id } = item.revoked;
      if (!itemLUT.has(by_id)) {
        throw new Error(
          `${item_type} ${item.id} is revoked by unknown ${item_type} ${by_id}`
        );
      }
    }
  }

  /**
   * Template Checks
   *
   * These checks have been removed as they are handled in
   * a resolution phase during `adjustTemplate()`.
   *
   * Invalid/removed ignored items are not an issue, they just stop being ignored.
   *
   * The actual `tech_to_items` structure is not important, the Technique IDs are.
   * The mapped Items are generated using Tech IDs + Dataset - Ignored.
   *
   * `.ignored_items`
   * - uniqueness
   * - ID validity
   * - ID revoked
   * - ID deprecated
   *
   * `.tech_to_items[tech_id].items`
   * - uniqueness
   * - ID validity
   * - ( using a Tech<->Item mapping that doesn't exist )
   * - ID revoked
   * - ID deprecated
   * - ID in .ignored_items
   */
  const template_checks = () => {};
  template_checks();

  return data;
}

function datasetProcessFile(file: DatasetFile): Dataset {
  const items: Item[] = [];
  const revoked_items: Item[] = [];
  const deprecated_items: Item[] = [];

  for (const item of file.items) {
    if (item.revoked !== null) {
      revoked_items.push(item);
    } else if (item.deprecated !== null) {
      deprecated_items.push(item);
    } else {
      items.push(item);
    }
  }

  const dataset: Dataset = {
    ...file,
    items,
    revoked_items,
    deprecated_items,
  };

  return dataset;
}

/**
 * Conditionally Hide Rows with Status 'unchanged'
 *
 * - When performing loading / import adjustments:
 *   - unchanged rows are great for a verbose view
 *   - unchanged rows aren't useful when trying to display problems only
 *     - As 'unchanged' rows were 'unchanged', because they were fine
 */
export function hideUnchanged<T extends { status: "unchanged" | string }>(
  changes: T[],
  hide: boolean
): T[] {
  if (hide) {
    return changes.filter((c) => c.status !== "unchanged");
  } else {
    return changes;
  }
}

/**
 * Adjust an Untrusted Set of Technique IDs
 *
 * Takes in:
 * - **uncheckedIds**
 *   - The untrusted Tech IDs
 *   - Untrusted meaning that such Techniques may:
 *     - Not exist
 *     - Not be loaded
 *     - Be revoked
 *     - Be deprecated
 *   - Will be removed (deprecated, unknown), unchanged (active), or replaced (revoked)
 *     in order to ensure they're usable within the currently loaded ATT&CK domains
 * - **activeIdsToAdd**
 *   - Used for adding trusted (present + active) Tech IDs from Templates
 * - **attack**
 *   - ATT&CK Domain Datasets to adjust Tech IDs to
 *
 * Returns:
 * - **adjusts**
 *   - All adjustments performed in order to trust the Tech IDs
 * - **ids**
 *   - Remaining Tech IDs that are present + active in loaded ATT&CK data
 */
export function adjustTechs(args: {
  uncheckedIds: string[];
  activeIdsToAdd?: string[];
  attack: AttackDatasets;
}): {
  adjusts: TechAdjustment[];
  ids: string[];
} {
  const adjusts: TechAdjustment[] = [];
  const ids: string[] = [];

  const uncheckedIds = new Set(args.uncheckedIds);
  const activeIdsToAdd = (args.activeIdsToAdd ?? []).filter(
    (id) => !uncheckedIds.has(id)
  );

  const { attack } = args;
  const statusLut = getTechStatusLut(attack);

  uncheckedIds.forEach((id) => {
    const status = getTechStatus(statusLut, id);
    const { type } = status;
    const name = joinTechName(status.name);

    if (type === "unknown") {
      adjusts.push({
        id,
        name: undefined,
        status: "removed",
        reason: "tech is unknown",
      });
    } else if (type === "deprecated") {
      adjusts.push({
        id,
        name,
        status: "removed",
        reason: "tech is deprecated",
      });
    } else if (type === "revoked") {
      const newId = status.by;
      const newName = joinTechName(getTechStatus(statusLut, newId).name);
      adjusts.push({
        id,
        name,
        status: "replaced",
        reason: `tech revoked by ${newName} (${newId})`,
        replacedBy: { id: newId, name: newName },
      });
      ids.push(newId);
    } else if (type === "active") {
      adjusts.push({
        id,
        name,
        status: "unchanged",
        reason: "-",
      });
      ids.push(id);
    }
  });

  activeIdsToAdd.forEach((id) => {
    const status = getTechStatus(statusLut, id);
    const name = joinTechName(status.name);
    if (status.type !== "active") {
      throw new Error(
        `activeIdsToAdd contained ID (${id}) that wasn't active (${status.type})`
      );
    }
    adjusts.push({
      id,
      name,
      status: "added",
      reason: "from Template",
    });
    ids.push(id);
  });

  const uniqueIds = stableDedupe(ids);

  return { adjusts, ids: uniqueIds };
}

/**
 * Modify an Item's Tech Mappings by Adjusting Them
 *
 * - **item** is passed through (modified)
 *   - Tech mappings are adjusted to passed **attack** data
 * - **itemAdjusts** table has row **item**.id written to it
 */
function adjustItem(args: {
  item: Item;
  attack: AttackDatasets;
  itemAdjusts: DatasetAdjustments["item"];
}): Item {
  const { item: itemI, attack, itemAdjusts } = args;
  const statusLut = getTechStatusLut(attack);

  const { adjusts } = adjustTechs({
    uncheckedIds: itemI.techniques.map((t) => t.tech_id),
    attack,
  });
  itemAdjusts[itemI.id] = hideUnchanged(adjusts, true);

  const techs: Dict<MappedTech | undefined> = {};

  itemI.techniques.forEach((orig) => {
    let id = orig.tech_id;
    const status = getTechStatus(statusLut, id);
    const { type } = status;

    if (type === "unknown" || type === "deprecated") return;
    else if (type === "revoked") id = status.by;

    const current: MappedTech = {
      tech_id: id,
      content: orig.content,
      details: orig.details,
    };

    const prior = techs[id];
    const priorExists = typeof prior !== "undefined";

    if (priorExists) {
      let content: string | null = `${prior.content ?? ""}\n\n${
        current.content ?? ""
      }`.trim();
      if (content.length === 0) {
        content = null;
      }

      let details: Dict<unknown> | null = {
        ...(prior.details ?? {}),
        ...(current.details ?? {}),
      };
      if (Object.keys(details).length === 0) {
        details = null;
      }

      const combined = { tech_id: id, content, details };

      techs[id] = combined;
    } else {
      techs[id] = current;
    }
  });

  const techniques = Object.values(techs as Dict<MappedTech>);

  const itemO: Item = { ...itemI, techniques };

  return itemO;
}

function mergeItems(a: ItemEntry[], b: ItemEntry[]): ItemEntry[] {
  return stableDedupe([...a, ...b], (item) => item.id);
}

function adjustTemplate(args: {
  template: Template;
  attack: AttackDatasets;
  datasetTTI: Dict<ItemEntry[] | undefined>;
  itemLUT: Dict<Item | undefined>;
  tmplAdjusts: DatasetAdjustments["tmpl"];
}): Template {
  const { template, attack, datasetTTI, itemLUT, tmplAdjusts } = args;
  const { tech_to_items: oldTTI, ignored_items } = template;

  // get old Techs + adjustment report
  const oldTechIds = ttiTechIDs(oldTTI);
  tmplAdjusts[template.id] = hideUnchanged(
    adjustTechs({ attack, uncheckedIds: oldTechIds }).adjusts,
    true
  );

  // oldTTI --> newTTI
  const newTTI: TechToItemMap = {
    unmapped: {
      confidence: DEFAULT_TECH_CONFIDENCE,
      items: [],
    },
  };

  // for each Tech:
  const statusLut = getTechStatusLut(attack);
  for (let techId of oldTechIds) {
    const entryIn = oldTTI[techId];
    const status = getTechStatus(statusLut, techId);
    const { type } = status;

    // active / replaced -> add mapped Items (- ignored)
    if (type === "active" || type === "revoked") {
      if (type === "revoked") techId = status.by;
      newTTI[techId] = {
        confidence: entryIn.confidence,
        items: (datasetTTI[techId] ?? []).filter(
          (i) => !ignored_items.includes(i.id)
        ),
      };
    }
  }

  // any Items missing in new (that are valid) -> add to unmapped
  const oldItemIds = new Set(ttiItemIDs(oldTTI));
  const newItemIds = new Set(ttiItemIDs(newTTI));
  const lostItems = Array.from(difference(oldItemIds, newItemIds))
    .map((id) => itemLUT[id])
    .filter((item) => typeof item !== "undefined")
    .map(({ id, version }) => ({ id, version }));
  newTTI.unmapped.items = mergeItems(newTTI.unmapped.items, lostItems);

  return { ...template, tech_to_items: newTTI };
}

/**
 * Modify a Dataset's Tech Mappings by Adjusting Them
 *
 * - **dataset** is passed through (modified)
 *   - Tech mappings are adjusted to passed **attack** data
 * - Item mapping adjustments are written to **itemAdjusts** table
 * - Template mapping adjustments are written to **tmplAdjusts** table
 */
function datasetAdjustToAttack(args: {
  dataset: Dataset;
  attack: AttackDatasets;
  adjusts: DatasetAdjustments;
}): Dataset {
  const { dataset: dataI, attack, adjusts } = args;

  const itemAdjusts = adjusts.item;
  const tmplAdjusts = adjusts.tmpl;

  const dataO: Dataset = { ...dataI };
  dataO.items = dataO.items.map((item) =>
    adjustItem({ item, attack, itemAdjusts })
  );

  const datasetTTI = getDatasetTechToItems(dataO.items);
  const itemLUT: Dict<Item> = {};
  dataO.items.forEach((i) => (itemLUT[i.id] = i));

  dataO.templates = dataO.templates.map((template) =>
    adjustTemplate({
      template,
      attack,
      datasetTTI,
      itemLUT,
      tmplAdjusts,
    })
  );

  return dataO;
}

// -----------------------------------------------------------------------------

/**
 * All Playbook Resources
 *
 * - A consistent basis of resources loaded for any build target
 *   - Same across API, Website, and Editor
 */
export type Resources = {
  /** Index of available ATT&CK / Other Dataset files */
  index: AppDataIndex;
  /** Config of what to load + other settings */
  config: AppConfig;
  /** What is (to be) Loaded (calc'd from index + config) */
  toLoad: ToBeLoaded;
  /** Loaded ATT&CK Domains */
  attack: AttackDatasets;
  /** Loaded Dataset (Items + Templates) */
  dataset: Dataset;
  /** Adjustments made so Dataset Tech ID mappings exist in loaded ATT&CK data */
  datasetAdjusts: DatasetAdjustments;
};

export interface FileGetter {
  index: () => Promise<unknown>;
  config: () => Promise<{
    user: unknown;
    defa: unknown;
  }>;
  attack: (
    domain: string,
    version: string | null,
    cached: boolean
  ) => Promise<AttackFile | null>;
  dataset: (
    id: string,
    version: string,
    last_updated: AppDataIndex["last_updated"],
    cached: boolean
  ) => Promise<unknown>;
}

/**
 * Load All Playbook Resources
 *
 * - Use provided FileGetter to resolve desired resource files
 * - Load DEV or PROD config according to inProd
 */
export async function loadAppResources(
  fileGetter: FileGetter,
  inProd: boolean
): Promise<Resources> {
  const r: Partial<Resources> = {};
  const ctx = new LoggingContext({});

  try {
    ctx.high("Reading index.json file of loadable ATT&CK + Other datasets");
    r.index = await (async () => {
      ctx.med("GET-ing file");
      const file = await fileGetter.index();

      ctx.med("Checking file's schema");
      const index0 = indexCheckSchema(file);

      ctx.med("Checking file's contents");
      const index1 = indexCheckData(index0);

      return index1;
    })();

    ctx.high(
      "Reading runtime-config/*.json of what datasets to load + other settings"
    );
    r.config = await (async () => {
      const index = r.index!;

      ctx.med("GET-ing files");
      const files = await fileGetter.config();

      ctx.med("Checking file schemas");
      const config0 = configCheckSchemas(files);

      ctx.med("Picking prod or dev from files based on app mode");
      const config1 = configTrimToAppMode(config0, inProd);

      ctx.med("Checking contents");
      const config2 = configCheckDatas(config1);

      ctx.med("Comparing against index.json");
      const config3 = configCheckAgainstIndex(config2, index);

      ctx.med("Picking either user.json or default.json");
      const config4 = configPick(config3);

      return config4;
    })();

    ctx.high("Using index + config to determine what will be loaded");
    r.toLoad = (() => {
      const index = r.index!;
      const config = r.config!;

      const confAttack = config.load.attack;
      const confDataset = config.load.dataset;

      const toLoad: ToBeLoaded = {
        attack: {
          enterprise: confAttack.enterprise
            ? highestVersion(index.attack_enterprise)
            : null,
          mobile: confAttack.mobile
            ? highestVersion(index.attack_mobile)
            : null,
          ics: confAttack.ics ? highestVersion(index.attack_ics) : null,
        },
        dataset: confDataset,
      };

      return toLoad;
    })();

    ctx.high("Loading specified ATT&CK domains");
    r.attack = await (async () => {
      const toLoad = r.toLoad!;

      const domains: Array<keyof ToBeLoaded["attack"]> = [
        "enterprise",
        "mobile",
        "ics",
      ];

      const output: Partial<AttackDatasets> = {};

      for (let i = 0; i < domains.length; i++) {
        const domain = domains[i];
        const version = toLoad.attack[domain];

        ctx.med(domain);

        ctx.low(`GET-ing version=${version}`);
        const file = await fileGetter.attack(domain, version, inProd);
        ctx.low(`Parsing version=${version}`);
        const data = attackParseFile(file);

        output[domain] = data;
      }

      return output as AttackDatasets;
    })();

    const loadDataset = r.toLoad!.dataset;
    ctx.high(
      `Loading specified Dataset id=${loadDataset.id} version=${loadDataset.version}`
    );
    r.dataset = await (async () => {
      ctx.med("GET-ing file");
      const { id, version } = loadDataset;
      const last_updated = r.index!.last_updated;
      const file = await fileGetter.dataset(id, version, last_updated, inProd);

      ctx.med("Checking schema");
      const dataset0 = datasetCheckSchema(file);

      ctx.med("Checking data integrity");
      const dataset1 = datasetCheckData(dataset0);

      ctx.med("Processing out revocations / deprecations");
      const dataset2 = datasetProcessFile(dataset1);

      ctx.med("Adjusting mappings to ATT&CK");
      const attack = r.attack!;
      const adjusts: DatasetAdjustments = { item: {}, tmpl: {} };
      const dataset = datasetAdjustToAttack({
        dataset: dataset2,
        attack,
        adjusts,
      });

      r.datasetAdjusts = adjusts;
      return dataset;
    })();
  } catch (err) {
    throw new Error(ctx.messageFor(err));
  }

  return r as Resources;
}
