import { Template } from "@playbook-ng/shared/src/dataset/types";
import { createContext } from "react";

function notProvided() {
  throw new Error("No TemplateModalControlContext Provided");
}

export const TemplateModalControlContext = createContext({
  open: (_t: Template) => notProvided(),
  close: () => notProvided(),
});
