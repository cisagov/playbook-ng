import { getTimeISO } from "../../base/utils/time";
import {
  DEFAULT_TECH_CONFIDENCE,
  t_TechConfidence,
} from "../../dataset/constants";
import {
  Dataset,
  Template,
  TechToItemVal,
  Item,
  TechToItemMap,
} from "../../dataset/types";
import { getDatasetTechToItems } from "../../dataset/utils";
import {
  DEFAULT_PLAYBOOK_TITLE,
  PLAYBOOK_CUR_SPEC_VERSION,
} from "../../playbook/constants";
import { Playbook } from "../../playbook/types";
import { Dict } from "../../base/types";
import { stableDedupe } from "../../base/utils/set";

/** Returns an Un-started Blank Playbook */
export function initialPlaybook(): Playbook {
  const time = getTimeISO();
  const state: Playbook = {
    dataset_id: "",
    dataset_version: "",
    title: DEFAULT_PLAYBOOK_TITLE,
    template_used: null,
    version: "0",
    created: time,
    updated: time,
    spec_version: PLAYBOOK_CUR_SPEC_VERSION,
    tech_to_items: {
      unmapped: {
        confidence: DEFAULT_TECH_CONFIDENCE,
        items: [],
      },
    },
    ignored_items: [],
  };
  return state;
}

/** Sets a Playbook's Title */
export function setPlaybookTitle(playbook: Playbook, title: string): Playbook {
  return {
    ...playbook,
    title,
    updated: getTimeISO(),
  };
}

/**
 * Returns a Playbook started from a Template
 *
 * - Techniques from the Template are added
 *   - And the Items those map to
 * - Baseline Items are also added
 */
export function startTemplatePlaybook(args: {
  dataset: Dataset;
  template: Template;
}): Playbook {
  const { dataset, template } = args;

  const pb = initialPlaybook();

  pb.title = `${DEFAULT_PLAYBOOK_TITLE} (${template.name})`;
  pb.dataset_id = dataset.id;
  pb.dataset_version = dataset.version;
  pb.template_used = template.id;
  pb.version = "0";

  const ignoredItemIDs = new Set(template.ignored_items);

  const baselines: TechToItemVal["items"] = dataset.items
    .filter((item) => item.is_baseline && !ignoredItemIDs.has(item.id))
    .map(({ id, version }) => ({ id, version }));

  pb.tech_to_items = {
    ...template.tech_to_items,
    unmapped: {
      confidence: DEFAULT_TECH_CONFIDENCE,
      items: stableDedupe(
        [...template.tech_to_items.unmapped.items, ...baselines],
        (i) => i.id
      ),
    },
  };
  pb.ignored_items = template.ignored_items;

  return pb;
}

/**
 * Returns a Started "Blank" Playbook
 *
 * - Has default contents of baseline Items
 */
export function startBlankPlaybook(dataset: Dataset): Playbook {
  const baselines: TechToItemVal["items"] = dataset.items
    .filter((item) => item.is_baseline)
    .map((item) => ({ id: item.id, version: item.version }));

  const pb = initialPlaybook();

  pb.title = DEFAULT_PLAYBOOK_TITLE;
  pb.dataset_id = dataset.id;
  pb.dataset_version = dataset.version;
  pb.version = "0";
  const time = getTimeISO();
  pb.created = time;
  pb.updated = time;
  pb.tech_to_items.unmapped.items = baselines;

  return pb;
}

/** Alias: initialPlaybook() */
export function closePlaybook(): Playbook {
  return initialPlaybook();
}

/**
 * Add Techniques (by ID) to a Playbook
 *
 * - All Items are required as to calculate the Tech->Item relationships
 */
export function addTechs(
  playbook: Playbook,
  args: {
    allItems: Item[];
    ids: string[];
  }
): Playbook {
  const { allItems, ids } = args;
  const mappedItemsLUT = getDatasetTechToItems(allItems);

  const ignoredItemIds = new Set(playbook.ignored_items);

  const entriesToAdd: Dict<TechToItemVal> = {};
  ids.forEach((techId) => {
    entriesToAdd[techId] = {
      confidence: DEFAULT_TECH_CONFIDENCE,
      items: (mappedItemsLUT[techId] ?? []).filter(
        (i) => !ignoredItemIds.has(i.id)
      ),
    };
  });

  const tech_to_items = {
    ...playbook.tech_to_items,
    ...entriesToAdd,
  };

  return {
    ...playbook,
    tech_to_items,
    updated: getTimeISO(),
  };
}

/** Remove a Technique (by ID) from a Playbook */
export function removeTech(playbook: Playbook, techId: string): Playbook {
  if (techId === "unmapped") return playbook;

  const { [techId]: _, ...ttiMap } = playbook.tech_to_items;

  return {
    ...playbook,
    tech_to_items: ttiMap as TechToItemMap,
    updated: getTimeISO(),
  };
}

/**
 * Set Playbook using a file
 *
 * - **WARNING**: File should be schema + content validated first (Import Page)
 */
export function setPlaybook(file: Playbook): Playbook {
  return {
    ...file,
  };
}

/** Update the Confidence Level of a Technique (by ID) in a Playbook */
export function setTechConfidence(
  playbook: Playbook,
  args: {
    id: string;
    confidence: t_TechConfidence;
  }
): Playbook {
  const { id, confidence } = args;

  if (id === "unmapped") return playbook;

  const entry = {
    ...playbook.tech_to_items[id],
    confidence,
  };

  const tech_to_items = {
    ...playbook.tech_to_items,
    [id]: entry,
  };

  return {
    ...playbook,
    tech_to_items,
    updated: getTimeISO(),
  };
}

/** Add an Item to a Playbook (under Additional Items) */
export function addAdditionalItem(
  playbook: Playbook,
  args: {
    allItems: Item[];
    item: Item;
  }
): Playbook {
  const { allItems, item } = args;
  playbook = restoreItem(playbook, { allItems, itemId: item.id });

  const entry: TechToItemVal["items"][number] = {
    id: item.id,
    version: item.version,
  };

  const items = [...playbook.tech_to_items.unmapped.items, entry];

  return {
    ...playbook,
    tech_to_items: {
      ...playbook.tech_to_items,
      unmapped: {
        ...playbook.tech_to_items.unmapped,
        items,
      },
    },
    updated: getTimeISO(),
  };
}

/** Remove an Item from a Playbook (from Additional Items) */
export function removeAdditionalItem(
  playbook: Playbook,
  itemId: string
): Playbook {
  const items = playbook.tech_to_items.unmapped.items.filter(
    (i) => i.id !== itemId
  );

  return {
    ...playbook,
    tech_to_items: {
      ...playbook.tech_to_items,
      unmapped: {
        ...playbook.tech_to_items.unmapped,
        items,
      },
    },
    updated: getTimeISO(),
  };
}

export function ignoreItem(playbook: Playbook, itemId: string): Playbook {
  const tech_to_items = Object.fromEntries(
    Object.entries(playbook.tech_to_items).map(([techId, entry]) => {
      const items = entry.items.filter((i) => i.id !== itemId);
      return [techId, { ...entry, items }];
    })
  ) as TechToItemMap;

  const ignored_items = Array.from(
    new Set([...playbook.ignored_items, itemId])
  );

  return {
    ...playbook,
    updated: getTimeISO(),
    tech_to_items,
    ignored_items,
  };
}

export function restoreItem(
  playbook: Playbook,
  args: {
    allItems: Item[];
    itemId: string;
  }
): Playbook {
  const { allItems, itemId } = args;
  const mappedItemsLUT = getDatasetTechToItems(allItems);

  const tech_to_items = Object.fromEntries(
    Object.entries(playbook.tech_to_items).map(([techId, entry]) => {
      if (techId === "unmapped") return [techId, entry];

      const mappedItems = mappedItemsLUT[techId] ?? [];

      const targetItemIds = new Set([...entry.items.map((i) => i.id), itemId]);

      const items = mappedItems.filter((i) => targetItemIds.has(i.id));

      return [techId, { ...entry, items }];
    })
  ) as TechToItemMap;

  const ignored_items = playbook.ignored_items.filter((id) => id !== itemId);

  return {
    ...playbook,
    updated: getTimeISO(),
    tech_to_items,
    ignored_items,
  };
}
