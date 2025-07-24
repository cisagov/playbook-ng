export function invariant(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}
