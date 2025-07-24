import { t_Automatable } from "@playbook-ng/shared/src/dataset/constants";
import { Item, MappedTech } from "@playbook-ng/shared/src/dataset/types";
import { keyArray, Keyed, unkeyArray } from "../keying";
import {
  getTimeISO,
  timeISO2DMY,
} from "@playbook-ng/shared/src/base/utils/time";
import {
  escapeMd as esc,
  renderMD,
} from "@playbook-ng/shared/src/base/utils/rendering";
import { strCapitalize } from "@playbook-ng/shared/src/base/utils/string";

const H2_REGEX = /^##\s(.+)$/;

function titleToKey(title: string): string {
  const key = title.trim().toLowerCase().replace(/\s+/g, "_");
  return key;
}

export function keyToTitle(key: string): string {
  const title = key.split("_").map(strCapitalize).join(" ");
  return title;
}

function keyToHeading(key: string): string {
  const title = keyToTitle(key);
  const heading = `## ${title}`;
  return heading;
}

const MD_HEADS = [
  // disabled (generated from fields that make it up)
  // | details: string;
  "intended_outcome",
  "introduction",
  "preparation",
  "risks",
  "guidance",
  "references",
] as const;

type MDHead = (typeof MD_HEADS)[number];

export function blankItem(): Item {
  const time = getTimeISO();

  const item: Item = {
    id: "",
    name: "",
    subtype: null,
    url: null,
    content: "",
    version: "1.0",
    created: time,
    modified: time,
    contributors: [],
    technologies: [],
    platforms: [],
    deprecated: null,
    revoked: null,
    ids_before_this: [],
    ids_after_this: [],
    is_baseline: false,
    related_ids: [],
    automatable: "unspecified",
    references: [],
    techniques: [],
  };

  return item;
}

export interface EditableItem {
  id: string;
  name: string;
  subtype: null | string;
  url: null | string;
  content: {
    [Head in MDHead]: string;
  };
  version: string;
  created: string;
  modified: string;
  contributors: Keyed<string>[];
  technologies: Keyed<string>[];
  platforms: Keyed<string>[];
  deprecated: null | { reason: string };
  revoked: null | { reason: string; by_id: string };
  ids_before_this: Keyed<string>[];
  ids_after_this: Keyed<string>[];
  is_baseline: boolean;
  related_ids: Keyed<string>[];
  automatable: t_Automatable;
  techniques: Keyed<MappedTech>[];
  // disabled (generated from MD .content.references)
  // | references: Reference[];
}

function splitMd(md: Item["content"]): EditableItem["content"] {
  // store required content and additionals found
  const head2md: Partial<EditableItem["content"]> & {
    [ExtraHead: string]: string;
  } = {};

  MD_HEADS.forEach((key) => {
    head2md[key] = `No ${keyToTitle(key)} content identified.`;
  });

  // track current header and content lines for it
  let head: string | null = null;
  let headLines: string[] = [];

  // for each line:
  const lines = md.split("\n");
  lines.forEach((line, ind) => {
    const match = line.match(H2_REGEX);

    // new header found
    if (match) {
      // prior header exists -> write saved lines to it
      if (head) {
        head2md[head] = headLines.join("\n").trim();
      }

      // start new header
      headLines = [];
      head = titleToKey(match[1]);
    }

    // new header not found -> save line
    else {
      headLines.push(line);
    }

    // on last line & prior header exists -> write saved lines to it
    if (ind === lines.length - 1 && head) {
      head2md[head] = headLines.join("\n").trim();
    }
  });

  return head2md as EditableItem["content"];
}

function statusLines(edit: EditableItem): string[] {
  const lines: string[] = [];

  const { revoked, deprecated } = edit;

  if (!revoked && !deprecated) {
    lines.push(`* **Status:** Active`);
  } else if (revoked) {
    lines.push(`* **Status:** Revoked`);
    lines.push(`  * **Reason:** ${esc(revoked.reason)}`);
    lines.push(`  * **By ID:** ${esc(revoked.by_id)}`);
  } else if (deprecated) {
    lines.push(`* **Status:** Deprecated`);
    lines.push(`  * **Reason:** ${esc(deprecated.reason)}`);
  }

  return lines;
}

function joinMd(edit: EditableItem): Item["content"] {
  const details = [
    `* **ID:** ${esc(edit.id)}`,
    `* **Version:** ${esc(edit.version)}`,
    `* **Created:** ${esc(timeISO2DMY(edit.created))}`,
    `* **Modified:** ${esc(timeISO2DMY(edit.modified))}`,
    `* **Type:** ${esc(edit.subtype ?? "unspecified")}`,
    ...statusLines(edit),
  ].join("\n");

  const parts = ["## Details", details];

  MD_HEADS.forEach((key) => {
    const sectionMd = edit.content[key];
    parts.push(keyToHeading(key));
    parts.push(sectionMd);
  });

  const md = parts.join("\n\n");
  return md;
}

function parseReferences(edit: EditableItem): Item["references"] {
  // render MD -> HTML as DOM is easier to work with
  const html = renderMD(edit.content.references);
  const div = document.createElement("div");
  div.innerHTML = html;

  const refs: Item["references"] = [];

  // for all <li>s
  const lis = Array.from(div.getElementsByTagName("li"));
  lis.forEach((li) => {
    // ensure only 1 <a> present, get it
    const links = li.getElementsByTagName("a");
    if (links.length !== 1) {
      return;
    }
    const link = links[0];

    // read from link then cull from DOM
    const url = new URL(link.href);
    const source_name = url.host;
    link.remove();

    // get desc without URL text hampering, strip |
    const description = li.innerText.trimStart().replace(/[\s|]+$/, "");

    // add ref
    refs.push({
      source_name,
      description,
      url: url.href,
    });
  });

  return refs;
}

export function Item_to_editable(item: Item): EditableItem {
  const editable: EditableItem = {
    id: item.id,
    name: item.name,
    subtype: item.subtype,
    url: item.url,
    content: splitMd(item.content),
    version: item.version,
    created: item.created,
    modified: item.modified,
    contributors: keyArray(item.contributors),
    technologies: keyArray(item.technologies),
    platforms: keyArray(item.platforms),
    deprecated: item.deprecated,
    revoked: item.revoked,
    ids_before_this: keyArray(item.ids_before_this),
    ids_after_this: keyArray(item.ids_after_this),
    is_baseline: item.is_baseline,
    related_ids: keyArray(item.related_ids),
    automatable: item.automatable,
    techniques: keyArray(item.techniques),
  };

  return editable;
}

export function Item_from_editable(edit: EditableItem): Item {
  const references = parseReferences(edit);

  const item: Item = {
    id: edit.id,
    name: edit.name,
    subtype: edit.subtype,
    url: edit.url,
    content: joinMd(edit),
    version: edit.version,
    created: edit.created,
    modified: edit.modified,
    contributors: unkeyArray(edit.contributors),
    technologies: unkeyArray(edit.technologies),
    platforms: unkeyArray(edit.platforms),
    deprecated: edit.deprecated,
    revoked: edit.revoked,
    ids_before_this: unkeyArray(edit.ids_before_this),
    ids_after_this: unkeyArray(edit.ids_after_this),
    is_baseline: edit.is_baseline,
    related_ids: unkeyArray(edit.related_ids),
    automatable: edit.automatable,
    techniques: unkeyArray(edit.techniques),
    references,
  };

  return item;
}
