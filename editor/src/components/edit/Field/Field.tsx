import { ValSetContext } from "@/contexts/ValSetContext";
import { useCallback, useContext, useMemo } from "react";
import { Data } from "../Data/Data";
import { FieldNamesContext } from "@/contexts/FieldNamesContext";

/**
 * Allows seleting a Field of a Data ValSetContext
 *
 * Within a ValSetContext where val is an object, this:
 * - Provides a new context where:
 *   - val is val[f]
 *   - set sets val[f]
 *
 * Takes the current FieldNamesContext and provides a new one of [...names, f]
 *
 * **WARNING**: Cannot be used when val is an Array, instead use ListEditor
 */
export function Field(args: { children: React.ReactNode; f: string }) {
  const { children, f } = args;
  const { val: rootVal, set: rootSet } = useContext(ValSetContext);

  const rootFieldNames = useContext(FieldNamesContext);
  const fieldNames = useMemo(() => [...rootFieldNames, f], [rootFieldNames, f]);

  if (
    typeof rootVal !== "object" ||
    Array.isArray(rootVal) ||
    rootVal === null
  ) {
    throw new Error(`Field given non-object val ${rootVal}`);
  }

  const val = useMemo(() => rootVal[f], [rootVal, f]);
  const set = useCallback(
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    (valNext: any) => rootSet({ ...rootVal, [f]: valNext }),
    [rootSet, rootVal, f]
  );

  const vs = useMemo(() => ({ val, set }), [val, set]);

  return (
    <Data vs={vs}>
      <FieldNamesContext.Provider value={fieldNames}>
        {children}
      </FieldNamesContext.Provider>
    </Data>
  );
}
