import { ValSet, ValSetContext } from "@/contexts/ValSetContext";
import { useContext } from "react";

/**
 * URL View
 *
 * - When not blank "", created an anchor for the given URL
 *   - Given as val: string (of current ValSetContext)
 */
export function URLView() {
  const { val: url } = useContext(ValSetContext) as ValSet<string>;

  if (typeof url !== "string") {
    throw new Error(`URLView given non-string val ${url}`);
  }

  let view = null;

  if (url !== "") {
    view = (
      <div>
        <a href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
      </div>
    );
  }

  return view;
}
