import { useCallback, useContext } from "react";
import { ValidateBase } from "./ValidateBase/ValidateBase";
import { ItemLUTContext } from "@/contexts/ItemLUTContext";
import { VResult } from "./ValidateBase/types";
import { ItemIDContext } from "@/contexts/ItemIDContext";

/**
 * Validates that a String is (an active Item ID, not the edited Item's ID)
 *
 * - Reads val: string from current context (using ValidateBase)
 * - Grabs ID of the currently edited Item
 * - Displays good VResult if Item active/know + not being edited
 *   - Otherwise bad/warn (always displayed)
 */
export function VItemIDActiveNotOpen() {
  const editedItemId = useContext(ItemIDContext);
  const idToItem = useContext(ItemLUTContext);

  const check = useCallback(
    (id: unknown | string): VResult => {
      if (typeof id !== "string") {
        throw new Error(`VItemIDActiveNotOpen given non-string val ${id}`);
      }

      if (id.trim().length === 0) {
        return {
          status: "bad",
          type: "blank",
          message: "nothing entered",
        };
      }

      if (id === editedItemId) {
        return {
          status: "bad",
          type: "opened",
          message: "you are currently editing this",
        };
      }

      const item = idToItem[id];

      if (typeof item === "undefined") {
        return {
          status: "warn",
          type: "unknown",
          message: "may not exist (or might not be loaded)",
        };
      }

      return {
        status: "good",
        type: "active",
        message: item.name,
      };
    },
    [editedItemId, idToItem]
  );

  return <ValidateBase check={check} />;
}
