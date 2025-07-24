import { ValSet, ValSetContext } from "@/contexts/ValSetContext";
import {
  timeISO2HMS,
  timeISO2DMY,
} from "@playbook-ng/shared/src/base/utils/time";
import { useContext } from "react";

/**
 * Time View
 *
 * - Displays a pretty-date/time for the provided timestring
 *   - Given as val: string (of current ValSetContext)
 */
export function TimeView() {
  const { val } = useContext(ValSetContext) as ValSet<string>;

  if (typeof val !== "string") {
    throw new Error(`TimeView given non-string val ${val}`);
  }

  const dmy = timeISO2DMY(val);
  const hms = timeISO2HMS(val);
  return (
    <div>
      <span>
        {dmy} (<i>{hms}</i>)
      </span>
    </div>
  );
}
