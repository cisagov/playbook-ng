import { TechIdStatus } from "@playbook-ng/shared/src/attack/objects";
import { Dict } from "@playbook-ng/shared/src/base/types";
import { createContext } from "react";

/**
 * ID -> TechIdStatus Lookup
 *
 * - This is to be provided once, towards the top of the DOM
 */
export const TechStatusLUTContext = createContext<
  Dict<TechIdStatus | undefined>
>({});
