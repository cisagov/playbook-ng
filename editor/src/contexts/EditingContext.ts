import { createContext } from "react";

/**
 * Specifies if the Region is Currently Being Edited
 *
 * Region meaning Block - that which sets this context
 */
export const EditingContext = createContext<boolean>(false);
