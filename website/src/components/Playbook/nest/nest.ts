/**
 * Nesting Playbook Entries - Types & Helpers
 * This typing represents the structure of the Playbook Content / JumpToMenu
 *
 *
 * Item -> Techs View
 * ------------------
 * root
 * |   item              (0+)
 * |   |   tech (0+)
 * |   UNMAPPED_TECHS_ID (0-1, hidden in search)
 * |   |   tech (0+)
 * |   |   |
 * L1  L2  L3 <level>
 *
 *
 * Tech -> Items View
 * ------------------
 * root
 * |   tech                (0+)
 * |   |   item (0+)
 * |   ADDITIONAL_ITEMS_ID (0-1, hidden in search)
 * |   |   item (0+)
 * |   |   |
 * L1  L2  L3 <level>
 *
 *
 * IDs
 * ---
 * Each node has an id that is a string[] of length  1,  2, or  3
 * The length corresponds to the level of the node: L1, L2, or L3
 *
 * The array holds the IDs used to progress through the tree to reach that node
 *
 * L1 [root.id]
 * L2 [root.id, middle.id]
 * L3 [root.id, middle.id, last.id]
 *
 * The display ID of the node is the last item in the list.
 * The HTML ID of the node is all list items joined using "_".
 * The parent HTML ID of the node is all list items (but the last) joined using "_".
 *
 * This makes focusing the parent upon child deletion very simple.
 * It also makes determining the parent ID of a child easy.
 *
 *
 * Types by Level
 * --------------
 * L1.type: "root"
 * L2.type: "tech" | "item" | UnmappedTechsId | AdditionalItemsId
 * L3.type: "tech" | "item"
 *
 *
 * Usage in Searching
 * ------------------
 * .matched: Affects presentation of the 'Search matched' banner
 *   .score: Used to sort results, and cull neighborhoods (middle+lasts)
 *           that had no score > 0 in them.
 */

/** L1 Root Node ID */
export const ROOT_ID = "playbook.root";

/** Type: L1 Root Node ID */
type RootId = typeof ROOT_ID;

/** L2 Unmapped Techniques Node ID */
export const UNMAPPED_TECHS_ID = "unmapped-techs";

/** Type: L2 Unmapped Techniques Node ID */
type UnmappedTechsId = typeof UNMAPPED_TECHS_ID;

/** L2 Additional Items Node ID */
export const ADDITIONAL_ITEMS_ID = "additional-items";

/** Type: L2 Additional Items Node ID */
type AdditionalItemsId = typeof ADDITIONAL_ITEMS_ID;

/** L1 Root Node */
export type L1 = {
  id: readonly [RootId];
  type: "root";
  entries: L2[];
};

/** L2 Node Concrete Type */
export type L2 = L2Tech | L2Item | L2UnmappedTechs | L2AdditionalItems;

/** L2 Technique (can have Items) */
export type L2Tech = L2Base & {
  type: "tech";
  entries: L3Item[];
};

/** L2 Item (can have Techs) */
export type L2Item = L2Base & {
  type: "item";
  entries: L3Tech[];
};

/** L2 Unmapped Groups */
export type L2Unmapped = L2UnmappedTechs | L2AdditionalItems;

/** L2 Unmapped Techniques (can have unmapped Techs) */
export type L2UnmappedTechs = L2Base & {
  id: readonly [RootId, UnmappedTechsId];
  type: UnmappedTechsId;
  entries: L3UnmappedTech[];
};

/** L2 Additional Items (can have additional Items) */
export type L2AdditionalItems = L2Base & {
  id: readonly [RootId, AdditionalItemsId];
  type: AdditionalItemsId;
  entries: L3AdditionalItem[];
};

/**
 * L2 Node Shared Base Typing
 *
 * - Fields are more loosely defined
 * - Specific instances of L2 specify exacts
 */
type L2Base = {
  id: readonly [RootId, string];
  name: string;
  type: "tech" | "item" | UnmappedTechsId | AdditionalItemsId;
  score: number;
  matched: boolean;
  entries: L3[];
};

/** L3 Unmapped Nodes */
export type L3Unmapped = L3UnmappedTech | L3AdditionalItem;

/** L3 Unmapped Tech (lives under L2 Unmapped Techs) */
export type L3UnmappedTech = L3Tech & {
  id: readonly [RootId, UnmappedTechsId, string];
};

/** L3 Additional Item (lives under L3 Additional Items) */
export type L3AdditionalItem = L3Item & {
  id: readonly [RootId, AdditionalItemsId, string];
};

/** L3 Concrete Node Type */
export type L3 = L3Tech | L3Item | L3UnmappedTech | L3AdditionalItem;

/** L3 Technique (lives under L2 Item) */
export type L3Tech = L3Base & { type: "tech" };

/** L3 Item (lives under L2 Tech) */
export type L3Item = L3Base & { type: "item" };

/** Common L3 Typing */
type L3Base = {
  id: readonly [RootId, string, string];
  name: string;
  type: "tech" | "item";
  score: number;
  matched: boolean;
};

/** Any of the Nestable Node Types */
export type Any = L1 | L2 | L3;

/**
 * Get Display ID of Node
 *
 * - Last id[] entry is the ID of this Node specifically
 */
export function displayId(node: Any): string {
  return node.id.at(-1) as string;
}

/**
 * Get HTML ID of Node
 *
 * - id[].join("_") gives a unique ID based on hierarchy
 *   - Is unique (assuming an ID isn't reused within a context)
 */
export function htmlId(node: Any): string {
  return node.id.join("_");
}

/** Get Display ID of Node's Parent */
export function parentDisplayId(node: Any): string {
  return node.id.at(-2) as string;
}

/** Get HTML ID of Node's Parent */
export function parentHtmlId(node: Any): string {
  return node.id.slice(0, -1).join("_");
}

/** Check if Node is an L1 Node (root) */
export function isL1(node: Any): node is L1 {
  return node.id.length === 1;
}

/** Check if Node is an L2 Node (Item, Tech, AdditionalItems, UnmappedTechs) */
export function isL2(node: Any): node is L2 {
  return node.id.length === 2;
}

/** Check if Node is an L2 Unmapped Node (AdditionalItems, UnmappedTechs) */
export function isL2Unmapped(node: Any): node is L2Unmapped {
  return (
    isL2(node) &&
    (node.id[1] === UNMAPPED_TECHS_ID || node.id[1] === ADDITIONAL_ITEMS_ID)
  );
}

/** Check if Node is an L3 Node (Item, Tech, AdditionalItem, UnmappedTech) */
export function isL3(node: Any): node is L3 {
  return node.id.length === 3;
}

/** Check if Node is an L3 Unmapped Node (AdditionalItem, UnmappedTech) */
export function isL3Unmapped(node: Any): node is L3Unmapped {
  return (
    isL3(node) &&
    (node.id[1] === UNMAPPED_TECHS_ID || node.id[1] === ADDITIONAL_ITEMS_ID)
  );
}

/** Check if Node is a Tech Node */
export function isTech(node: Any): node is L2Tech | L3Tech | L3UnmappedTech {
  return node.type === "tech";
}

/** Check if Node is an Item Node */
export function isItem(node: Any): node is L2Item | L3Item | L3AdditionalItem {
  return node.type === "item";
}
