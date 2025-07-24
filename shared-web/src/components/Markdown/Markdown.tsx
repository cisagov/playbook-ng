import css from "./Markdown.module.css";
import { renderMD } from "@playbook-ng/shared/src/base/utils/rendering";
import { useMemo } from "react";

/**
 * Renders a Markdown String
 *
 * - A single place for:
 *   - Dealing with dangerouslySetInnerHTML / sanitization
 *   - Ensuring consistency in MD rendering
 */
export function Markdown(args: { md: string; className?: string }) {
  const { md, className } = args;

  const html = useMemo(() => ({ __html: renderMD(md) }), [md]);

  const c = useMemo(() => `${css.root} ${className ?? ""}`.trim(), [className]);

  return <div className={c} dangerouslySetInnerHTML={html} />;
}
