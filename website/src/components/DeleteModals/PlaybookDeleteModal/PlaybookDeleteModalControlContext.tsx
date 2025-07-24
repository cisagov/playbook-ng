import { createContext } from "react";
import { PlaybookDeleteModalArgs } from "./types";

function notProvided() {
  throw new Error("No PlaybookDeleteModalControlContext Provided");
}

export const PlaybookDeleteModalControlContext = createContext({
  open: (_args: PlaybookDeleteModalArgs) => notProvided(),
  close: () => notProvided(),
});
