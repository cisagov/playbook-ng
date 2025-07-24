import { useCallback, useMemo } from "react";
import { ValidateBase } from "./ValidateBase/ValidateBase";
import { Keyed } from "@/code/keying";
import { VResult } from "./ValidateBase/types";

/**
 * Validates that an Array has no Duplicates
 *
 * - Reads val: Array of Keyed<T> from current context (using ValidateBase)
 * - If defined: subVal is used to compare on a sub-field of T
 * - Displays warning VResult if array has duplicate entries
 */
export function VListNoDuplicates<T>(args: { subVal?: (val: T) => string }) {
  const subVal = useMemo(() => args.subVal ?? ((val: T) => val), [args.subVal]);

  const check = useCallback(
    (list: unknown | Keyed<T>[]): VResult => {
      if (!Array.isArray(list)) {
        throw new Error(`VListNoDuplicates given non-array val ${list}`);
      }

      const set = new Set(list.map((item) => subVal(item.val)));

      if (list.length !== set.size) {
        return {
          status: "warn",
          type: "duplicates",
          message: "there are duplicate entries",
        };
      } else {
        return null;
      }
    },
    [subVal]
  );

  return <ValidateBase check={check} />;
}
