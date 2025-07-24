import { Item, ItemEntry, Template } from "./types";
import { Dict } from "../base/types";
import { escapeMd as esc } from "../base/utils/rendering";

export function getDatasetTechToItems(
  allItems: Item[]
): Dict<ItemEntry[] | undefined> {
  const lut: Dict<ItemEntry[]> = {};
  allItems.forEach((item) => {
    const entry = { id: item.id, version: item.version };
    item.techniques.forEach((tech) => {
      const techId = tech.tech_id;
      if (typeof lut[techId] === "undefined") lut[techId] = [entry];
      else lut[techId].push(entry);
    });
  });
  return lut;
}

export function templateExtendedDesc(t: Template): string {
  const parts: string[] = [];
  parts.push(`# Details`);
  parts.push(`\n\n- **ID:** ${esc(t.id)}`);
  if (t.link !== null) {
    parts.push(`\n- **Link:** [${t.link.url}](${t.link.url})`);
    if (t.link.url !== t.link.text)
      parts.push(`\n- **Link Text:** ${esc(t.link.text)}`);
  }
  parts.push(`\n\n# Description`);
  parts.push(`\n\n${t.description.trim()}`);
  return parts.join("");
}
