import { Dict } from "@playbook-ng/shared/src/base/types";
import { useMemo } from "react";

export function useLUT<T>(objs: Array<T>, key: keyof T): Dict<T> {
  return useMemo(() => {
    const lut: Dict<T> = {};

    objs.forEach((o) => (lut[o[key] as string] = o));

    return lut;
  }, [objs, key]);
}
