import { EditingContext } from "@/contexts/EditingContext";
import { ValSet, ValSetContext } from "@/contexts/ValSetContext";
import { useCallback, useContext, useId } from "react";
import { Label } from "../Label/Label";

/**
 * Select Editor
 *
 * - Allows editing a val: string (of current ValSetContext) with known-limited possible values
 */
export function SelectEditor(args: { options: readonly string[] | string[] }) {
  const { val, set } = useContext(ValSetContext) as ValSet<string>;
  const editing = useContext(EditingContext);

  if (typeof val !== "string") {
    throw new Error(`SelectEditor given non-string val ${val}`);
  }

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => set(e.target.value),
    [set]
  );

  const options = args.options.map((o) => (
    <option key={o} value={o}>
      {o}
    </option>
  ));

  const inputId = useId();

  let inner = null;

  if (editing) {
    inner = (
      <select id={inputId} value={val} onChange={onChange}>
        {options}
      </select>
    );
  } else {
    inner = <span>{val}</span>;
  }

  return (
    <div>
      <div>
        <Label htmlFor={inputId} />
      </div>
      {inner}
    </div>
  );
}
