import { Item, TechToItemMap } from "../../../dataset/types";
import { joinTechName, Technique } from "../../../attack/objects";
import { Playbook } from "../../types";
import { Dict } from "../../../base/types";
import { SaveableFile } from "./types";
import exceljs from "exceljs";
const { Workbook } = exceljs;
import { Worksheet } from "exceljs";
import { ExportMarks } from "../../../lib/remark-docx/src/control";
import { UsedTemplateInfo } from "../template-info";
import { ttiItemIDs } from "../../helpers";

/**
 * Given a worksheet, resizes each column to the width of its widest cell
 */
function autosizeColumns(ws: Worksheet) {
  ws.columns.forEach((column) => {
    // only columns with values
    if (typeof column.values === "undefined") return;

    // ignore missing rows, blank cells -> 0 length
    const sizes = column.values
      .filter((cell) => cell)
      .map((cell) => (cell?.toString() ?? "").length);

    // set widest width with some margin
    const widest = Math.min(80, Math.max(...sizes, 0));
    column.width = widest + 4;
  });
}

/**
 * Given a worksheet and column numbers 1..inf,
 * bolds the specified cells in the last row
 */
function boldCellsInLastRow(ws: Worksheet, cols: number[]) {
  cols.forEach((col) => {
    const cell = ws.getCell(ws.rowCount, col);
    cell.style.font = { ...cell.style.font, bold: true };
  });
}

function buildTechniqueMappings(
  techToItems: TechToItemMap,
  techLut: Dict<Technique>,
  itemType: string,
  ws: Worksheet
) {
  // Write the headers
  ws.addRow([
    "Technique ID",
    "Technique Name",
    "Confidence",
    `Mapped ${itemType}s`,
  ]);
  boldCellsInLastRow(ws, [1, 2, 3, 4]);

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
    ws.addRow([tech.attackId, name, ttiVal.confidence, itemIdList]);
  });

  // Unmapped Items
  const unmappedItemIdList = techToItems.unmapped.items
    .map((i) => i.id)
    .join(", ");
  ws.addRow(["-", `(Additional ${itemType}s)`, "-", unmappedItemIdList]);
}

function buildItems(
  itemIds: string[],
  itemLut: Dict<Item>,
  itemType: string,
  ws: Worksheet
) {
  // Write header
  ws.addRow([`${itemType} ID`, `${itemType} Name`]);
  boldCellsInLastRow(ws, [1, 2]);

  // Write Item IDs/Names
  itemIds.forEach((id) => {
    const item = itemLut[id];
    const { name } = item;
    ws.addRow([id, name]);
  });
}

function buildMetadata(
  playbook: Playbook,
  templateInfo: UsedTemplateInfo,
  ws: Worksheet
) {
  const meta = [
    ["Title", playbook.title],
    ["Template", templateInfo.display],
    ["Created", playbook.created],
    ["Updated", playbook.updated],
    ["Version", playbook.version],
  ];
  meta.forEach((row) => {
    ws.addRow(row);
    boldCellsInLastRow(ws, [1]);
  });
}

export async function exportXlsx(
  playbook: Playbook,
  techLut: Dict<Technique>,
  itemLut: Dict<Item>,
  itemType: string,
  exportMarks: ExportMarks,
  templateInfo: UsedTemplateInfo
): Promise<SaveableFile> {
  // Version increment on export
  playbook = {
    ...playbook,
    version: (parseInt(playbook.version, 10) + 1).toString(),
  };

  // get all items (including Additional/unmapped)
  const itemIds = ttiItemIDs(playbook.tech_to_items);

  // Create workbook and template + item sheets
  const workbook = new Workbook();
  const mainSheet = workbook.addWorksheet("Playbook (minimal)");
  const itemSheet = workbook.addWorksheet(`${itemType}s`);

  // Add Header + Metadata
  mainSheet.addRow(["PlaybookNG Playbook"]);
  boldCellsInLastRow(mainSheet, [1]);
  (() => {
    const hasContactInfo = typeof exportMarks.contact_info === "string";
    const hasDisclaimer = typeof exportMarks.disclaimer === "string";
    // spacer before section
    if (hasContactInfo || hasDisclaimer) {
      mainSheet.addRow([]);
    }
    // contact info
    if (hasContactInfo) {
      mainSheet.addRow(["Contact Info", exportMarks.contact_info]);
      boldCellsInLastRow(mainSheet, [1]);
    }
    // disclaimer
    if (hasDisclaimer) {
      mainSheet.addRow(["Disclaimer", exportMarks.disclaimer]);
      boldCellsInLastRow(mainSheet, [1]);
    }
  })();
  mainSheet.addRow([]);
  buildMetadata(playbook, templateInfo, mainSheet);
  mainSheet.addRow([]);

  // Build the technique -> item mappings table
  buildTechniqueMappings(playbook.tech_to_items, techLut, itemType, mainSheet);

  // Build the items -> name table
  buildItems(itemIds, itemLut, itemType, itemSheet);

  // Clean-up sheet column widths
  autosizeColumns(mainSheet);
  autosizeColumns(itemSheet);

  // Write file
  const buffer = await workbook.xlsx.writeBuffer();
  const data = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });
  const { title, version } = playbook;
  const filename = `playbook_${title
    .toLowerCase()
    .replaceAll(" ", "_")}_v${version}.xlsx`;
  return { data, filename };
}
