import { Dict } from "@playbook-ng/shared/src/base/types";
import { Item } from "@playbook-ng/shared/src/dataset/types";
import { createContext } from "react";

/**
 * ID -> Item Lookup
 *
 * - This is to be provided once, towards the top of the DOM
 */
export const ItemLUTContext = createContext<Dict<Item | undefined>>({});
