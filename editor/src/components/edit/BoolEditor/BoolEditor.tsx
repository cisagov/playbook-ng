import { EditingContext } from "@/contexts/EditingContext";
import { ValSet, ValSetContext } from "@/contexts/ValSetContext";
import { useCallback, useContext, useId } from "react";
import { Label } from "../Label/Label";

/**
 * Bool Editor
 *
 * Allows editing val: boolean of the current context
 */
export function BoolEditor() {
  const { val, set } = useContext(ValSetContext) as ValSet<boolean>;
  const editing = useContext(EditingContext);

  if (typeof val !== "boolean") {
    throw new Error(`BoolEditor given non-boolean val ${val}`);
  }

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.checked),
    [set]
  );

  const inputId = useId();

  let inner = null;

  if (editing) {
    inner = (
      <input id={inputId} type="checkbox" checked={val} onChange={onChange} />
    );
  } else {
    inner = <span>{val ? "Yes" : "No"}</span>;
  }

  return (
    <div>
      <Label htmlFor={inputId} /> {inner}
    </div>
  );
}
