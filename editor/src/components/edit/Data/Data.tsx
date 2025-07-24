import { ValSet, ValSetContext } from "@/contexts/ValSetContext";

/** Alias of ValSetContext.Provider */
export function Data<T>(args: { vs: ValSet<T>; children: React.ReactNode }) {
  const { vs, children } = args;
  return <ValSetContext.Provider value={vs}>{children}</ValSetContext.Provider>;
}
