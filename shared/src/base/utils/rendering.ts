import { Tokens, marked } from "marked";
import DOMPurify from "dompurify";
import { ExtRef } from "../../attack/objects";
import { Reference } from "../../dataset/types";

const mdRenderer = new marked.Renderer();

// links -> open in new tab
const linkRenderer = mdRenderer.link;
mdRenderer.link = (link: Tokens.Link): string => {
  // Setup Reference
  // markedjs: https://github.com/markedjs/marked/issues/655
  // DOMPurify: https://github.com/cure53/DOMPurify/issues/317
  const html = linkRenderer.call(mdRenderer, link);
  return html.replace(/^<a /, '<a target="_blank" rel="noreferrer" ');
};

// tables -> add BS classes to display properly
mdRenderer.table = ({ header, rows }: Tokens.Table): string => {
  const headerInners = header.map((cell) =>
    mdRenderer.parser.parseInline(cell.tokens)
  );
  const headerThs = headerInners.map((inner) => `<th>${inner}</th>`);
  const headerRow = `<tr>${headerThs.join("")}</tr>`;

  const bodyRows = rows.map((row) => {
    const rowInners = row.map((cell) =>
      mdRenderer.parser.parseInline(cell.tokens)
    );
    const rowTds = rowInners.map((inner) => `<td>${inner}</td>`);
    const bodyRow = `<tr>${rowTds.join("")}</tr>`;
    return bodyRow;
  });

  const h = `<div><table class="table table-striped table-bordered table-hover">
    <thead>${headerRow}</thead>
    <tbody>${bodyRows.join("")}</tbody>
  </table></div>`;

  return h;
};

/**
 * Renders (Citation: xyz)s into links (MD -> MD) within a block
 *
 * ## refs Logic
 * - **Reference[] | ExtRef[]**: use these to render present (Citation: xyz)s
 * - **false**                 : remove (Citation: xyz)s from the text
 */
export function renderCitations(
  md: string,
  refs: Reference[] | ExtRef[] | false
): string {
  const numbering = {
    last: 0,
    lookup: new Map<string, number>(),
  };

  const getNum = (name: string) => {
    if (numbering.lookup.has(name)) {
      return numbering.lookup.get(name);
    } else {
      numbering.last += 1;
      numbering.lookup.set(name, numbering.last);
      return numbering.last;
    }
  };

  md = md.replace(
    /\(Citation: *(.+?) *\)/g,
    (_citeText: string, citeSourceName: string) => {
      const escapedName = escapeMd(citeSourceName);

      if (refs === false) {
        return "";
      }

      const ref = refs.find((ref) => ref.source_name.trim() === citeSourceName);

      if (ref === undefined) {
        return `**(Citation: no references with source name "${escapedName}")**`;
      }

      const num = getNum(ref.source_name);

      // return MD link
      if (typeof ref.url === "string") {
        return `<sup>[\\[${num}\\]](${ref.url})</sup>`;
      }

      // no-url on ref
      return `<sup>\\[${num}: ${escapedName}\\]</sup>`;
    }
  );

  return md;
}

/** render MD -> HTML */
export function renderMD(md: string): string {
  // is empty
  if (md.trim().length === 0) {
    return "<p><em>has no content</em></p>";
  }

  // render md -> html
  const renderedHTML = marked.parse(md, {
    async: false,
    renderer: mdRenderer,
  });

  // sanitize html (allow target="_blank")
  const sanitizedHTML = DOMPurify.sanitize(renderedHTML, {
    ADD_ATTR: ["target"],
  });

  return sanitizedHTML;
}

/**
 * Escapes all characters that have meaning in MD
 * - Useful for including user-provided plaintext in MD
 */
export function escapeMd(txt: string): string {
  return txt.replace(/([\\`*_{}[\]<>()#+\-!|])/g, "\\$1");
}

/**
 * Indents all headings in MD string 'by' given amount
 */
export function indentMdHeadings(md: string, by: number): string {
  const prefix = "#".repeat(by);
  return md.replace(
    /^(#+) +([^ ].*)$/gm,
    (_m: string, hashes: string, title: string) => {
      title = title.trim();
      const newHashes = `${prefix}${hashes}`;

      // indented heading is <= H6 -> use new hashes
      if (newHashes.length <= 6) {
        return `${newHashes} ${title}`;
      }

      // indented heading is > H6 (invalid) -> replace with bolding and > marks
      else {
        const overBy = newHashes.length - 6;
        return `${"\\> ".repeat(overBy)}**${title}**\n\n`;
      }
    }
  );
}
