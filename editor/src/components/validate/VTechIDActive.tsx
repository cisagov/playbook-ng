import { useCallback, useContext } from "react";
import { ValidateBase } from "./ValidateBase/ValidateBase";
import { VResult } from "./ValidateBase/types";
import { TechStatusLUTContext } from "@/contexts/TechStatusLUTContext";
import {
  getTechStatus,
  joinTechName,
} from "@playbook-ng/shared/src/attack/objects";

/**
 * Validates that a Technique ID is Active
 *
 * - Reads val: string from current context (using ValidateBase)
 * - Checks val against Tech Status lookup (from context)
 * - Displays status of Tech ID (blank, active, revoked, deprecated, unknown)
 */
export function VTechIDActive() {
  const idToStatus = useContext(TechStatusLUTContext);

  const check = useCallback(
    (id: unknown | string): VResult => {
      if (typeof id !== "string") {
        throw new Error(`VTechIDActive given non-string val ${id}`);
      }

      if (id.trim().length === 0) {
        return {
          status: "bad",
          type: "blank",
          message: "nothing entered",
        };
      }

      const status = getTechStatus(idToStatus, id);
      const { type } = status;
      const name = joinTechName(status.name);

      switch (type) {
        case "active":
          return {
            status: "good",
            type,
            message: name,
          };
        case "revoked":
          return {
            status: "warn",
            type,
            message: `replace with ${status.by}`,
          };
        case "deprecated":
          return {
            status: "bad",
            type,
            message: "please remove",
          };
        case "unknown":
          return {
            status: "warn",
            type,
            message: "may not exist (or might not be loaded)",
          };
      }
    },
    [idToStatus]
  );

  return <ValidateBase check={check} />;
}
