import { createContext } from "react";

/**
 * Currently Edited Item'd ID
 *
 * - This is to be provided once, towards the top of the DOM
 */
export const ItemIDContext = createContext<string>("");
