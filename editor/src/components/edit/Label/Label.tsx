import { EditingContext } from "@/contexts/EditingContext";
import css from "./Label.module.css";
import { FieldNamesContext } from "@/contexts/FieldNamesContext";
import { useContext, useMemo } from "react";
import { LabelVisibilityContext } from "@/contexts/LabelVisibilityContext";

/** Prettifies parts of the dynamic label with proper casing */
const REPLACE = new Map([
  ["id", "ID"],
  ["ids", "IDs"],
  ["url", "URL"],
]);

/**
 * A Label for an Input
 *
 * - Used by each of the XYZEditor components
 * - Switches between label and span using EditingContext
 * - Adjusts visibility
 *   - to meet policy of LabelVisibilityContext
 *   - in relation to EditingContext
 * - Is dynamically named by the Field(s) taken to get here
 */
export function Label(args: { htmlFor?: string }) {
  const { htmlFor } = args;

  const visibility = useContext(LabelVisibilityContext);
  const fieldNames = useContext(FieldNamesContext);
  const editing = useContext(EditingContext);

  const text = useMemo(() => {
    const names = fieldNames.map((name) =>
      name
        .split("_")
        .map((part) => REPLACE.get(part) ?? part)
        .join(" ")
    );
    return names.join(" - ");
  }, [fieldNames]);

  let inner = null;

  if (editing && typeof htmlFor === "string") {
    inner = (
      <label htmlFor={htmlFor} className={css.label}>
        {text}
      </label>
    );
  } else {
    inner = <span className={css.label}>{text}</span>;
  }

  const shown =
    visibility === "always" ||
    (visibility === "view-only" && !editing) ||
    (visibility === "edit-only" && editing);

  return shown ? <span>{inner}:</span> : null;
}
