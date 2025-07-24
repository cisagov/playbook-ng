import css from "./NullOrEditor.module.css";
import { EditingContext } from "@/contexts/EditingContext";
import { ValSet, ValSetContext } from "@/contexts/ValSetContext";
import { useCallback, useContext, useMemo } from "react";
import { Data } from "../Data/Data";
import { FieldNamesContext } from "@/contexts/FieldNamesContext";
import { BoolEditor } from "../BoolEditor/BoolEditor";

/**
 * Null-or-T Editor
 *
 * - Allows editing a val: null | T (of current ValSetContext)
 * - initVal provides a default T when is-null is unchecked
 *   - val is set null when is-null is checked
 * - Renders children (editor/view for T) when val is not null
 */
export function NullOrEditor<T>(args: {
  initVal: () => T;
  children: React.ReactNode;
}) {
  const { initVal, children } = args;

  const { val: rootVal, set: rootSet } = useContext(
    ValSetContext
  ) as ValSet<null | T>;
  const rootFieldNames = useContext(FieldNamesContext);
  const editing = useContext(EditingContext);

  const isNullVal = useMemo(() => rootVal === null, [rootVal]);

  const isNullSet = useCallback(
    (isNull: boolean) => {
      if (isNull) rootSet(null);
      else rootSet(initVal());
    },
    [initVal, rootSet]
  );

  const isNullFieldNames = useMemo(
    () => [...rootFieldNames, "is null"],
    [rootFieldNames]
  );

  const realVal = useMemo(
    () => (rootVal === null ? initVal() : rootVal),
    [initVal, rootVal]
  );

  const realSet = useCallback((val: T) => rootSet(val), [rootSet]);

  const isNullVS = useMemo(
    () => ({ val: isNullVal, set: isNullSet }),
    [isNullSet, isNullVal]
  );

  const realVS = useMemo(
    () => ({ val: realVal, set: realSet }),
    [realSet, realVal]
  );

  return (
    <div className={editing ? css.root_editing : ""}>
      {editing || isNullVal ? (
        <div className={editing && !isNullVal ? css.null_editing : ""}>
          <FieldNamesContext.Provider value={isNullFieldNames}>
            <Data vs={isNullVS}>
              <BoolEditor />
            </Data>
          </FieldNamesContext.Provider>
        </div>
      ) : null}

      {!isNullVal ? (
        <div>
          <Data vs={realVS}>{children}</Data>
        </div>
      ) : null}
    </div>
  );
}
