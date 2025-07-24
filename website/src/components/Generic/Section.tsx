export function Section(args: React.ComponentProps<"section">) {
  const { children, ...rest } = args;
  return <section {...rest}>{children}</section>;
}
