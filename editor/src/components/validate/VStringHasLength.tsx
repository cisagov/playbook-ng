import { useCallback } from "react";
import { VResult } from "./ValidateBase/types";
import { ValidateBase } from "./ValidateBase/ValidateBase";

/**
 * Validates that a String has Length
 *
 * - Reads val: string from current context (using ValidateBase)
 * - Displays bad VResult if string is blank ""
 */
export function VStringHasLength() {
  const check = useCallback((str: unknown | string): VResult => {
    if (typeof str !== "string") {
      throw new Error(`VStringHasLength given non-string val ${str}`);
    }

    if (str.trim().length > 0) return null;
    else
      return {
        status: "bad",
        type: "blank",
        message: "nothing entered",
      };
  }, []);

  return <ValidateBase check={check} />;
}
