import { useCallback, useMemo, useState } from "react";

export type UsedBool = {
  val: boolean;
  setVal: React.Dispatch<React.SetStateAction<boolean>>;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
};

export function useBool(initial: boolean): UsedBool {
  const [val, setVal] = useState(initial);
  const setTrue = useCallback(() => setVal(true), []);
  const setFalse = useCallback(() => setVal(false), []);
  const toggle = useCallback(() => setVal(!val), [val]);
  return useMemo(
    () => ({ val, setVal, setTrue, setFalse, toggle }),
    [setFalse, setTrue, toggle, val]
  );
}
