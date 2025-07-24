import { Technique } from "@playbook-ng/shared/src/attack/objects";
import { createContext } from "react";

function notProvided() {
  throw new Error("No TechModalControlContext Provided");
}

export const TechModalControlContext = createContext({
  open: (_t: Technique) => notProvided(),
  close: () => notProvided(),
});
