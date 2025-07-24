import {
  LabelVisibility,
  LabelVisibilityContext,
} from "@/contexts/LabelVisibilityContext";

/**
 * Sets config / policy contexts for Label(s)
 *
 * - Currently only sets visibility policy
 */
export function LabelConfig(args: {
  children: React.ReactNode;
  visibility: LabelVisibility;
}) {
  const { children, visibility } = args;

  return (
    <LabelVisibilityContext.Provider value={visibility}>
      {children}
    </LabelVisibilityContext.Provider>
  );
}
