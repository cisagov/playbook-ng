import { Item, TechToItemMap } from "../../../dataset/types";
import { joinTechName, Technique } from "../../../attack/objects";
import { Playbook } from "../../../playbook/types";
import {
  escapeMd as esc,
  indentMdHeadings,
} from "../../../base/utils/rendering";
import { Dict } from "../../../base/types";
import { SaveableFile } from "./types";
import {
  ExportMarks,
  PAGE_BREAK_BEFORE,
} from "../../../lib/remark-docx/src/control";
import { UsedTemplateInfo } from "../template-info";
import { ttiItemIDs } from "../../helpers";
import { templateExtendedDesc } from "../../../dataset/utils";

/**
 * Lists content of all Items in playbook
 */
function buildItems(
  itemIds: string[],
  itemLut: Dict<Item>,
  itemType: string,
  forUseInDocx: boolean,
  exportMarks: ExportMarks
) {
  const pageBreak = forUseInDocx ? PAGE_BREAK_BEFORE : "";

  const contact = forUseInDocx
    ? ""
    : typeof exportMarks.contact_info === "string"
      ? `#### Contact Info\n\n${esc(exportMarks.contact_info)}\n\n`
      : "";

  const disclaimer = forUseInDocx
    ? ""
    : typeof exportMarks.disclaimer === "string"
      ? `#### Disclaimer\n\n${esc(exportMarks.disclaimer)}\n\n`
      : "";

  let md = `## ${esc(itemType)}s${pageBreak}\n\n`;
  for (const [index, itemId] of itemIds.entries()) {
    const item = itemLut[itemId];
    const header = `### ${esc(item.id)} : ${esc(item.name)}${
      index > 0 ? pageBreak : ""
    }`;
    const content = indentMdHeadings(item.content, 2);
    md += `${header}\n\n${content}\n\n${contact}${disclaimer}`;
  }
  return md;
}

/**
 * Builds introduction with Title + Metadata + Template Info
 */
function buildIntro(playbook: Playbook, templateInfo: UsedTemplateInfo) {
  const header = "# Playbook-NG Playbook\n\n";
  const meta = [
    `**Title**: ${esc(playbook.title)}`,
    `**Template**: ${esc(templateInfo.display)}`,
    `**Created**: ${esc(playbook.created)}`,
    `**Updated**: ${esc(playbook.updated)}`,
    `**Version**: ${esc(playbook.version)}`,
  ].join("  \n");
  let templateSection = "";
  if (templateInfo.status === "template used") {
    const { template } = templateInfo;
    const content = indentMdHeadings(templateExtendedDesc(template), 2);
    templateSection = `\n\n## Template: ${esc(templateInfo.display)}\n\n${content}`;
  }
  return `${header}${meta}${templateSection}\n\n`;
}

/**
 * Builds table showing Techniques and their mapped Items
 */
function buildTechniqueMappings(
  techToItems: TechToItemMap,
  techLut: Dict<Technique>,
  itemType: string
) {
  const tableHeader = `## Techniques & Mappings\n\n|**Technique**|**Confidence**|**Mapped ${esc(
    itemType
  )}s**|\n|---|---|---|\n`;
  let tableEntries = "";

  // Techs with Items
  Object.entries(techToItems).forEach(([techId, ttiVal]) => {
    // unmapped Items processed later
    if (techId === "unmapped") {
      return;
    }
    const itemIds = ttiVal.items.map((item) => item.id);
    const tech = techLut[techId];
    const name = joinTechName(tech.name);
    const itemIdList = itemIds.join(", ");
    tableEntries += `|${esc(tech.attackId)}: ${esc(name)}|${esc(
      ttiVal.confidence
    )}|${esc(itemIdList)}|\n`;
  });

  // Unmapped Items
  const unmappedItemIdList = techToItems.unmapped.items
    .map((i) => i.id)
    .join(", ");
  tableEntries += `|(Additional ${esc(itemType)}s)|\\-|${esc(
    unmappedItemIdList
  )}|\n`;

  return `${tableHeader}${tableEntries}\n`;
}

/**
 * Builds a Markdown view of the Playbook
 */
export function renderMdExport(
  playbook: Playbook,
  techLut: Dict<Technique>,
  itemLut: Dict<Item>,
  itemType: string,
  forUseInDocx: boolean,
  exportMarks: ExportMarks,
  templateInfo: UsedTemplateInfo
): string {
  // get all items (including Additional/unmapped)
  const itemIds = ttiItemIDs(playbook.tech_to_items);

  // build
  const intro = buildIntro(playbook, templateInfo);
  const tech_table = buildTechniqueMappings(
    playbook.tech_to_items,
    techLut,
    itemType
  );
  const items = buildItems(
    itemIds,
    itemLut,
    itemType,
    forUseInDocx,
    exportMarks
  );
  return `${intro}${tech_table}${items}`;
}

/**
 * Builds and saves a Markdown view of the Playbook
 */
export function exportMd(
  playbook: Playbook,
  techLut: Dict<Technique>,
  itemLut: Dict<Item>,
  itemType: string,
  exportMarks: ExportMarks,
  templateInfo: UsedTemplateInfo
): SaveableFile {
  // version increment on save
  playbook = {
    ...playbook,
    version: (parseInt(playbook.version, 10) + 1).toString(),
  };

  // render content
  const md_content = renderMdExport(
    playbook,
    techLut,
    itemLut,
    itemType,
    false,
    exportMarks,
    templateInfo
  );
  const data = new Blob([md_content], { type: "text/markdown;charset=utf-8" });

  // build filename
  const { version, title } = playbook;
  const filename = `playbook_${title
    .toLowerCase()
    .replaceAll(" ", "_")}_v${version}.md`;

  return { data, filename };
}
