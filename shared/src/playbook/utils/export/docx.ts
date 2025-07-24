// typing
import { Dict } from "../../../base/types";
import { Item } from "../../../dataset/types";
import { Technique } from "../../../attack/objects";
import { Playbook } from "../../../playbook/types";

// md of playbook
import { renderMdExport } from "./md";

// md -> docx -> blob
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { default as docx } from "../../../lib/remark-docx/src/plugin";
import { SaveableFile } from "./types";
import { ExportMarks } from "../../../lib/remark-docx/src/control";
import { UsedTemplateInfo } from "../template-info";
import { ImageData } from "../../../lib/remark-docx/src/transformer";

/**
 * See shared/src/lib/remark-docx/src/transformer.ts : buildImage
 *
 * Resolves any URL to fixed STUB data
 */
function imageResolver(_url: string): ImageData {
  return {
    image: "Rendering Images not Supported",
    width: 0,
    height: 0,
  };
}

async function mdToDocxBlob(md: string, exportMarks: ExportMarks) {
  const mdToDocxProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use([[docx, { output: "blob", exportMarks, imageResolver }]]);
  const doc = await mdToDocxProcessor.process(md);
  return doc.result as Blob;
}

export async function exportDocx(
  playbook: Playbook,
  techLut: Dict<Technique>,
  itemLut: Dict<Item>,
  itemType: string,
  exportMarks: ExportMarks,
  templateInfo: UsedTemplateInfo
): Promise<SaveableFile> {
  playbook = {
    ...playbook,
    version: (parseInt(playbook.version, 10) + 1).toString(),
  };

  // render content
  const md = renderMdExport(
    playbook,
    techLut,
    itemLut,
    itemType,
    true,
    exportMarks,
    templateInfo
  );
  const data = await mdToDocxBlob(md, exportMarks);

  // build filename
  const { title, version } = playbook;
  const filename = `playbook_${title
    .toLowerCase()
    .replaceAll(" ", "_")}_v${version}.docx`;

  return { data, filename };
}
