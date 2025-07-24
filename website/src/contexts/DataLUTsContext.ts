import { Technique } from "@playbook-ng/shared/src/attack/objects";
import { Dict } from "@playbook-ng/shared/src/base/types";
import { Item, Template } from "@playbook-ng/shared/src/dataset/types";
import { createContext } from "react";

export type DataLUTs = {
  techLUT: Dict<Technique>;
  itemLUT: Dict<Item>;
  templateLUT: Dict<Template>;
};

export const DataLUTsContext = createContext<DataLUTs>({
  techLUT: {},
  itemLUT: {},
  templateLUT: {},
});
