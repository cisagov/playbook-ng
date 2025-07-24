import { s_NullOrStringNotBlank } from "../../../base/schema";

/**
 * Used at the end of a header line to signal a page break before it
 * - Only used in DOCX by setting forUseInDocx=true
 * - Is detected and removed by transformer.ts
 */
export const PAGE_BREAK_BEFORE = "--page-break-before--";

/** Allows including markings on exported documents
 * - Markdown : (each) As a paragraph at the end of each Item
 * - Word  Doc: (each) As a footer on each page
 * - Excel Doc: (each) As a row at the top of the sheet
 */
export type ExportMarks = {
  /** Info on contacting CISA, the dataset creator, or a local IR contact */
  contact_info: null | string;

  /** Legal licensing / dataset usage disclaimer */
  disclaimer: null | string;
};

export const s_ExportMarks = {
  type: "object",
  properties: {
    contact_info: s_NullOrStringNotBlank,
    disclaimer: s_NullOrStringNotBlank,
  },
  required: ["contact_info", "disclaimer"],
  additionalProperties: false,
};

export const NO_EXPORT_MARKS: ExportMarks = {
  contact_info: null,
  disclaimer: null,
};
