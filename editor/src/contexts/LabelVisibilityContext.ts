import { createContext } from "react";

/**
 * Policy for when a Label is Visible
 *
 * These are in relation to EditingContext
 *
 * - **always**: always visible
 * - **view-only**: visible when EditingContext = false
 * - **edit-only**: visible when EditingContext = true
 */
export type LabelVisibility = "always" | "view-only" | "edit-only";

/** Labels inside this context follow its Policy */
export const LabelVisibilityContext = createContext<LabelVisibility>("always");
