import { createContext } from "react";

/**
 * Names of Fields Used to Reach a Point
 *
 * - Starts as []
 * - Each usage of a <Field f=name> extends this as [...arr, name]
 * - <Label>s use this context to dynamically generate a description/name
 */
export const FieldNamesContext = createContext<string[]>([]);
