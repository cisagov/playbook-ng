import { ItemAndTech } from "@playbook-ng/shared/src/dataset/types";
import { createContext } from "react";

function notProvided() {
  throw new Error("No ItemModalControlContext Provided");
}

export const ItemModalControlContext = createContext({
  open: (_it: ItemAndTech) => notProvided(),
  close: () => notProvided(),
});
