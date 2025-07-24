import {
  renderMD,
  renderCitations,
} from "@playbook-ng/shared/src/base/utils/rendering";

export function getfirstSentenceText(md: string): string {
  const endIndex = md.search(/(\.(\s|\())|.$/) + 1;
  const sentence = md.substring(0, endIndex);
  const sentenceNoCite = renderCitations(sentence, false);
  const html = renderMD(sentenceNoCite);
  const text = htmlToText(html);
  return text;
}

export function getFirstParagraphText(h: string) {
  const d = document.createElement("div");
  d.innerHTML = h;
  const p = d.getElementsByTagName("p")[0] as HTMLParagraphElement | undefined;
  return p?.textContent || p?.innerText || "";
}

export function htmlToText(h: string) {
  const d = document.createElement("div");
  d.innerHTML = h;
  return d.textContent || d.innerText || "";
}
