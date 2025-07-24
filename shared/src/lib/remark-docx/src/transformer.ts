import {
  convertInchesToTwip,
  Packer,
  Document,
  Paragraph,
  ParagraphChild,
  Table,
  TableRow,
  TableCell,
  TableOfContents,
  TextRun,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  AlignmentType,
  IImageOptions,
  ILevelsOptions,
  FootnoteReferenceRun,
  CheckBox,
  WidthType,
  NumberFormat,
  BorderStyle,
  ShadingType,
  Footer,
  PageNumber,
  TabStopType,
  TabStopPosition,
  IStylesOptions,
  IDocumentBackgroundOptions,
} from "docx";
import type * as mdast from "./models/mdast";
import { invariant } from "./utils";
import { ExportMarks, NO_EXPORT_MARKS, PAGE_BREAK_BEFORE } from "./control";

// -----------------------------------------------------------------------------
// Config

const FONT_NORMAL = "Calibri";
const FONT_CODE = "Consolas";

const QUOTEBLOCK_EDGE_COLOR = "0000AA";

const CODE_TEXT_COLOR = "900000";
const CODE_BACK_SHADE = "eeeeee";

const CODE_PAD_BEFORE = 150;
const CODE_PAD_AFTER = 150;

const HEAD_PAD_BEFORE = 150;
const HEAD_PAD_AFTER = 150;

const PAR_PAD_BEFORE = 150;
const PAR_PAD_AFTER = 150;

const LIST_ITEM_PAD_BEFORE = 75;
const LIST_ITEM_PAD_AFTER = 75;

// applies only to ordered lists
const INDENT_0 = 0.25;

// applies only to ordered lists & quoteblocks
const INDENT_SIZE = 0.5;

// -----------------------------------------------------------------------------

const ORDERED_LIST_REF = "ordered";
const DEFAULT_NUMBERINGS: ILevelsOptions[] = [
  {
    level: 0,
    format: LevelFormat.DECIMAL,
    text: "%1.",
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT_0) },
      },
    },
  },
  {
    level: 1,
    format: LevelFormat.DECIMAL,
    text: "%2.",
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT_0 + INDENT_SIZE * 1) },
      },
    },
  },
  {
    level: 2,
    format: LevelFormat.DECIMAL,
    text: "%3.",
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT_0 + INDENT_SIZE * 2) },
      },
    },
  },
  {
    level: 3,
    format: LevelFormat.DECIMAL,
    text: "%4.",
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT_0 + INDENT_SIZE * 3) },
      },
    },
  },
  {
    level: 4,
    format: LevelFormat.DECIMAL,
    text: "%5.",
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT_0 + INDENT_SIZE * 4) },
      },
    },
  },
  {
    level: 5,
    format: LevelFormat.DECIMAL,
    text: "%6.",
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: { start: convertInchesToTwip(INDENT_0 + INDENT_SIZE * 5) },
      },
    },
  },
];

export type ImageDataMap = { [url: string]: undefined | ImageData };

export type ImageData = {
  image: IImageOptions["data"];
  width: number;
  height: number;
};

export type ImageResolver = (url: string) => Promise<ImageData> | ImageData;

type Decoration = Readonly<{
  [key in (
    | mdast.Emphasis
    | mdast.Strong
    | mdast.Delete
    | mdast.Link
    | mdast.Code
  )["type"]]?: true;
}>;

type ListInfo = Readonly<{
  level: number;
  ordered: boolean;
  checked?: boolean;
  instance?: number;
}>;

type Context = Readonly<{
  deco: Decoration;
  images: ImageDataMap;
  indent: number;
  list?: ListInfo;
}>;

/**
 * A Mutable Context
 *
 * - A global variable scoped to an md->docx conversion session
 * - lastListInstance allows distinguishing ordered lists from one another
 */
type MutContext = {
  lastListInstance: number;
};

/**
 * see IPropertiesOptions of node_modules/docx/build/index.d.ts
 */
export interface DocxOptions {
  title?: string;
  subject?: string;
  creator?: string;
  keywords?: string;
  description?: string;
  lastModifiedBy?: string;
  revision?: number;
  styles?: IStylesOptions;
  background?: IDocumentBackgroundOptions;

  /**
   * Set output type of `VFile.result`. `buffer` is `Promise<Buffer>`. `blob` is `Promise<Blob>`.
   */
  output?: "buffer" | "blob";
  /**
   * **You must set** if your markdown includes images. See example for [browser](https://github.com/inokawa/remark-docx/blob/main/stories/playground.stories.tsx) and [Node.js](https://github.com/inokawa/remark-docx/blob/main/src/index.spec.ts).
   */
  imageResolver?: ImageResolver;

  exportMarks?: ExportMarks;
}

type DocxChild = Paragraph | Table | TableOfContents;
type DocxContent = DocxChild | ParagraphChild;

export interface Footnotes {
  [key: string]: { children: Paragraph[] };
}

// type to define the return value of `convertNodes`
export interface ConvertNodesReturn {
  nodes: DocxContent[];
  footnotes: Footnotes;
}

export const mdastToDocx = async (
  node: mdast.Root,
  {
    output = "buffer",
    title,
    subject,
    creator,
    keywords,
    description,
    lastModifiedBy,
    revision,
    styles,
    background,
    exportMarks,
  }: DocxOptions,
  images: ImageDataMap
): Promise<Buffer | Blob> => {
  exportMarks = exportMarks ?? NO_EXPORT_MARKS;

  const { nodes, footnotes } = convertNodes(
    node.children,
    {
      deco: {},
      images,
      indent: 0,
    },
    {
      lastListInstance: 0,
    }
  );

  // always: page num on right side
  const footerTextRuns = [
    new TextRun("\t"),
    new TextRun({
      children: [PageNumber.CURRENT],
    }),
  ];

  (() => {
    const hasContactInfo = typeof exportMarks.contact_info === "string";
    const hasDisclaimer = typeof exportMarks.disclaimer === "string";

    // if defined: disclaimer info on left side
    // if contactInfo: line break this as it comes after
    if (hasDisclaimer) {
      footerTextRuns.unshift(
        ...[
          new TextRun({
            text: "Disclaimer: ",
            bold: true,
            break: hasContactInfo ? 1 : undefined,
          }),
          new TextRun(exportMarks.disclaimer ?? ""),
        ]
      );
    }

    // if defined: contact info on left side
    if (hasContactInfo) {
      footerTextRuns.unshift(
        ...[
          new TextRun({
            text: "Contact Info: ",
            bold: true,
          }),
          new TextRun(exportMarks.contact_info ?? ""),
        ]
      );
    }
  })();

  const doc = new Document({
    title,
    subject,
    creator,
    keywords,
    description,
    lastModifiedBy,
    revision,
    styles,
    background,
    footnotes,
    sections: [
      {
        children: nodes as DocxChild[],
        properties: {
          page: {
            pageNumbers: {
              start: 1,
              formatType: NumberFormat.DECIMAL,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [
                  {
                    type: TabStopType.RIGHT,
                    position: TabStopPosition.MAX,
                  },
                  {
                    type: TabStopType.LEFT,
                    position: 0,
                  },
                ],
                children: footerTextRuns,
              }),
            ],
          }),
        },
      },
    ],
    numbering: {
      config: [
        {
          reference: ORDERED_LIST_REF,
          levels: DEFAULT_NUMBERINGS,
        },
      ],
    },
  });

  if (output === "buffer") {
    const bufOut = await Packer.toBuffer(doc);
    // feature detection instead of environment detection, but if Buffer exists
    // it's probably Node. If not, return the Uint8Array that JSZip returns
    // when it doesn't detect a Node environment.
    return typeof Buffer === "function" ? Buffer.from(bufOut) : bufOut;
  } else {
    // output === 'blob'
    return Packer.toBlob(doc);
  }
};

const convertNodes = (
  nodes: mdast.Content[],
  ctx: Context,
  mCtx: MutContext
): ConvertNodesReturn => {
  const results: DocxContent[] = [];
  const footnotes: Footnotes = {};
  for (const node of nodes) {
    switch (node.type) {
      case "paragraph":
        results.push(buildParagraph(node, ctx, mCtx));
        break;
      case "heading":
        results.push(buildHeading(node, ctx, mCtx));
        break;
      case "thematicBreak":
        results.push(buildThematicBreak(node));
        break;
      case "blockquote":
        results.push(...buildBlockquote(node, ctx, mCtx));
        break;
      case "list":
        results.push(...buildList(node, ctx, mCtx));
        break;
      case "listItem":
        invariant(false, "unreachable");
        break;
      case "table":
        results.push(buildTable(node, ctx, mCtx));
        break;
      case "tableRow":
        invariant(false, "unreachable");
        break;
      case "tableCell":
        invariant(false, "unreachable");
        break;
      case "html":
        results.push(buildHtml(node));
        break;
      case "code":
        results.push(buildCode(node));
        break;
      case "yaml":
        // unimplemented
        break;
      case "toml":
        // unimplemented
        break;
      case "definition":
        // unimplemented
        break;
      case "footnoteDefinition":
        footnotes[node.identifier] = buildFootnoteDefinition(node, ctx, mCtx);
        break;
      case "text":
        results.push(buildText(node.value, ctx.deco));
        break;
      case "emphasis":
      case "strong":
      case "delete": {
        const { type, children } = node;
        const { nodes } = convertNodes(
          children,
          {
            ...ctx,
            deco: { ...ctx.deco, [type]: true },
          },
          mCtx
        );
        results.push(...nodes);
        break;
      }
      case "inlineCode":
        // transform to text for now
        results.push(
          buildText(node.value, {
            ...ctx.deco,
            code: true,
          })
        );
        break;
      case "break":
        results.push(buildBreak(node));
        break;
      case "link":
        results.push(buildLink(node, ctx, mCtx));
        break;
      case "image":
        results.push(buildImage(node, ctx.images));
        break;
      case "linkReference":
        // unimplemented
        break;
      case "imageReference":
        // unimplemented
        break;
      case "footnoteReference":
        // do we need context here?
        results.push(buildFootnoteReference(node));
        break;
      case "math":
        // unimplemented
        break;
      case "inlineMath":
        // unimplemented
        break;
      default:
        invariant(false, "unreachable");
        break;
    }
  }
  return {
    nodes: results,
    footnotes,
  };
};

const buildParagraph = (
  { children }: mdast.Paragraph,
  ctx: Context,
  mCtx: MutContext
) => {
  const list = ctx.list;
  const { nodes } = convertNodes(children, ctx, mCtx);

  if (list && list.checked != null) {
    nodes.unshift(
      new CheckBox({
        checked: list.checked,
        checkedState: { value: "2611" },
        uncheckedState: { value: "2610" },
      })
    );
  }
  return new Paragraph({
    border:
      ctx.indent === 0
        ? undefined
        : {
            left: {
              style: BorderStyle.SINGLE,
              color: QUOTEBLOCK_EDGE_COLOR,
              size: 12,
              space: 2,
            },
          },
    spacing: {
      before:
        typeof ctx.list === "undefined" ? PAR_PAD_BEFORE : LIST_ITEM_PAD_BEFORE,
      after:
        typeof ctx.list === "undefined" ? PAR_PAD_AFTER : LIST_ITEM_PAD_AFTER,
    },
    children: nodes,
    indent:
      ctx.indent > 0
        ? {
            start: convertInchesToTwip(INDENT_SIZE * ctx.indent),
          }
        : undefined,
    ...(list &&
      (list.ordered
        ? {
            numbering: {
              reference: ORDERED_LIST_REF,
              level: list.level,
              instance: ctx.list.instance,
            },
          }
        : {
            bullet: {
              level: list.level,
            },
          })),
  });
};

type HeadingLevelType =
  | typeof HeadingLevel.TITLE
  | typeof HeadingLevel.HEADING_1
  | typeof HeadingLevel.HEADING_2
  | typeof HeadingLevel.HEADING_3
  | typeof HeadingLevel.HEADING_4
  | typeof HeadingLevel.HEADING_5
  | typeof HeadingLevel.HEADING_6;

const scanHeadingForPageBreak = (
  node: mdast.Heading | mdast.PhrasingContent
): boolean => {
  // eslint-disable-next-line -- need to access field that is known absent on subtypes
  const children: mdast.PhrasingContent[] = (node as any).children ?? [];

  // text -> true if present
  if (node.type === "text" && node.value.includes(PAGE_BREAK_BEFORE)) {
    node.value = node.value.replace(PAGE_BREAK_BEFORE, "");
    return true;
  }

  // 0+ kids -> true if any kid is true
  else {
    const located: boolean = children
      .map((child) => scanHeadingForPageBreak(child))
      .some((found) => found);
    return located;
  }
};

const buildHeading = (node: mdast.Heading, ctx: Context, mCtx: MutContext) => {
  let headLevel: HeadingLevelType;
  switch (node.depth) {
    case 1:
      headLevel = HeadingLevel.TITLE;
      break;
    case 2:
      headLevel = HeadingLevel.HEADING_1;
      break;
    case 3:
      headLevel = HeadingLevel.HEADING_2;
      break;
    case 4:
      headLevel = HeadingLevel.HEADING_3;
      break;
    case 5:
      headLevel = HeadingLevel.HEADING_4;
      break;
    case 6:
      headLevel = HeadingLevel.HEADING_5;
      break;
  }
  const pageBreakBefore = scanHeadingForPageBreak(node);
  const { nodes } = convertNodes(node.children, ctx, mCtx);
  return new Paragraph({
    spacing: {
      before: HEAD_PAD_BEFORE,
      after: HEAD_PAD_AFTER,
    },
    pageBreakBefore,
    heading: headLevel,
    children: nodes,
  });
};

const buildThematicBreak = (_: mdast.ThematicBreak) => {
  return new Paragraph({
    thematicBreak: true,
  });
};

const buildBlockquote = (
  { children }: mdast.Blockquote,
  ctx: Context,
  mCtx: MutContext
) => {
  const { nodes } = convertNodes(
    children,
    { ...ctx, indent: ctx.indent + 1 },
    mCtx
  );
  return nodes;
};

const buildList = (
  { children, ordered, start: _start, spread: _spread }: mdast.List,
  ctx: Context,
  mCtx: MutContext
) => {
  const list: ListInfo = {
    level: ctx.list ? ctx.list.level + 1 : 0,
    ordered: !!ordered,
    // eslint-disable-next-line -- it thinks ordered is already boolean, but it's null/undef-able
    instance: !!ordered ? ++mCtx.lastListInstance : undefined,
  };
  return children.flatMap((item) => {
    return buildListItem(
      item,
      {
        ...ctx,
        list,
      },
      mCtx
    );
  });
};

const buildListItem = (
  { children, checked, spread: _spread }: mdast.ListItem,
  ctx: Context,
  mCtx: MutContext
) => {
  const { nodes } = convertNodes(
    children,
    {
      ...ctx,
      ...(ctx.list && { list: { ...ctx.list, checked: checked ?? undefined } }),
    },
    mCtx
  );
  return nodes;
};

type AlignmentTypeType =
  | typeof AlignmentType.START
  | typeof AlignmentType.CENTER
  | typeof AlignmentType.END
  | typeof AlignmentType.BOTH
  | typeof AlignmentType.MEDIUM_KASHIDA
  | typeof AlignmentType.DISTRIBUTE
  | typeof AlignmentType.NUM_TAB
  | typeof AlignmentType.HIGH_KASHIDA
  | typeof AlignmentType.LOW_KASHIDA
  | typeof AlignmentType.THAI_DISTRIBUTE
  | typeof AlignmentType.LEFT
  | typeof AlignmentType.RIGHT
  | typeof AlignmentType.JUSTIFIED;

const buildTable = (
  { children, align }: mdast.Table,
  ctx: Context,
  mCtx: MutContext
) => {
  const cellAligns: AlignmentTypeType[] | undefined = align?.map((a) => {
    switch (a) {
      case "left":
        return AlignmentType.LEFT;
      case "right":
        return AlignmentType.RIGHT;
      case "center":
        return AlignmentType.CENTER;
      default:
        return AlignmentType.LEFT;
    }
  });

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: children.map((r) => {
      return buildTableRow(r, ctx, mCtx, cellAligns);
    }),
  });
};

const buildTableRow = (
  { children }: mdast.TableRow,
  ctx: Context,
  mCtx: MutContext,
  cellAligns: AlignmentTypeType[] | undefined
) => {
  return new TableRow({
    children: children.map((c, i) => {
      return buildTableCell(c, ctx, mCtx, cellAligns?.[i]);
    }),
  });
};

const buildTableCell = (
  { children }: mdast.TableCell,
  ctx: Context,
  mCtx: MutContext,
  align: AlignmentTypeType | undefined
) => {
  const { nodes } = convertNodes(children, ctx, mCtx);
  return new TableCell({
    children: [
      new Paragraph({
        alignment: align,
        children: nodes,
      }),
    ],
  });
};

const buildHtml = ({ value }: mdast.Html) => {
  // transform to text for now
  return new Paragraph({
    children: [buildText(value, {})],
  });
};

const buildCode = ({ value, lang: _lang, meta: _meta }: mdast.Code) => {
  return new Paragraph({
    spacing: {
      before: CODE_PAD_BEFORE,
      after: CODE_PAD_AFTER,
    },
    shading: {
      fill: "ffffff",
      color: CODE_BACK_SHADE,
      type: ShadingType.SOLID,
    },
    border: {
      top: { style: BorderStyle.SINGLE, size: 1, space: 2 },
      bottom: { style: BorderStyle.SINGLE, size: 1, space: 2 },
      left: { style: BorderStyle.SINGLE, size: 1, space: 2 },
      right: { style: BorderStyle.SINGLE, size: 1, space: 2 },
    },
    children: value.split("\n").map(
      (lineText, index) =>
        new TextRun({
          text: lineText,
          break: index === 0 ? undefined : 1,
          font: { name: FONT_CODE },
          color: CODE_TEXT_COLOR,
        })
    ),
  });
};

const buildText = (text: string, deco: Decoration) => {
  return new TextRun({
    text,
    bold: deco.strong,
    italics: deco.emphasis,
    strike: deco.delete,
    style: deco.link ? "Hyperlink" : undefined,
    color: deco.code ? CODE_TEXT_COLOR : undefined,
    font: {
      name: deco.code ? FONT_CODE : FONT_NORMAL,
    },
  });
};

const buildBreak = (_: mdast.Break) => {
  return new TextRun({ text: "", break: 1, font: { name: FONT_NORMAL } });
};

const buildLink = (
  { children, url, title: _title }: mdast.Link,
  ctx: Context,
  mCtx: MutContext
) => {
  const { nodes } = convertNodes(
    children,
    {
      ...ctx,
      deco: { ...ctx.deco, link: true },
    },
    mCtx
  );
  return new ExternalHyperlink({
    link: url,
    children: nodes,
  });
};

/**
 * See shared/src/playbook/utils/export/docx.ts : imageResolver
 *
 * Returns a TextRun warning in-place of actually rendering images
 */
const buildImage = (_img: mdast.Image, _imgDataMap: ImageDataMap) => {
  return new TextRun({
    text: "Rendering Images not Supported",
    bold: true,
  });
};

const buildFootnoteDefinition = (
  { children }: mdast.FootnoteDefinition,
  ctx: Context,
  mCtx: MutContext
) => {
  return {
    children: children.map((node) => {
      const { nodes } = convertNodes([node], ctx, mCtx);
      return nodes[0] as Paragraph;
    }),
  };
};

const buildFootnoteReference = ({ identifier }: mdast.FootnoteReference) => {
  // do we need Context?
  return new FootnoteReferenceRun(parseInt(identifier));
};
