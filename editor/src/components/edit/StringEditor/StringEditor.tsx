import { EditingContext } from "@/contexts/EditingContext";
import { ValSet, ValSetContext } from "@/contexts/ValSetContext";
import { useCallback, useContext, useId } from "react";
import { Label } from "../Label/Label";

/**
 * String Editor
 *
 * - Allows editing a val: string (of current ValSetContext)
 */
export function StringEditor(args: { view?: React.FC }) {
  const { val, set } = useContext(ValSetContext) as ValSet<string>;
  const editing = useContext(EditingContext);

  if (typeof val !== "string") {
    throw new Error(`StringEditor given non-string val ${val}`);
  }

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value),
    [set]
  );

  const inputId = useId();

  let inner = null;

  // editing
  if (editing) {
    inner = (
      <input
        id={inputId}
        className="w-100"
        type="text"
        value={val}
        onChange={onChange}
      />
    );
  }

  // view (arg provided)
  else if (args.view) {
    inner = <args.view />;
  }

  // view (internal basic)
  else {
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
