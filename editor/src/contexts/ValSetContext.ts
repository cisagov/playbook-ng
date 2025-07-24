import { createContext } from "react";

/**
 * A val and a set(ter) for T
 *
 * - Basically a useState<T>() interface
 * - Makes modifying upper state easy
 * - val/set are recalculated/reprovided all-over to:
 *   - Access a <Field> of val (object)
 *   - Access each index of val with ListEditor (Array)
 *   - View/Edit val as String/Bool/null/Array/Object
 *   - Gate edits to val behind a confirmation [Accept]/[Cancel] <Block>
 * - ValSetContext is the main use of this
 *   - Data is an alias of ValSetContext.Provider
 */
export type ValSet<T> = {
  val: T;
  set: (val: T) => void;
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const ValSetContext = createContext<ValSet<any>>({
  val: undefined,
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  set: (val: any) => {
    throw new Error(`set(${val}) called outside of ValSetContext`);
  },
});
