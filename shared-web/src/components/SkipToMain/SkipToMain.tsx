import { useCallback } from "react";
import { Button } from "react-bootstrap";
import css from "./SkipToMain.module.css";

/**
 * Skip-link Button
 *
 * - Focuses the specified ID on click
 * - Is visually hidden unless focused
 */
export function SkipToMain(args: { focusId: string }) {
  const { focusId } = args;

  const doSkip = useCallback(
    () => document.getElementById(focusId)?.focus(),
    [focusId]
  );

  return (
    <Button
      variant="link"
      size="sm"
      onClick={doSkip}
      className={`${css.skip_to_main} visually-hidden-focusable`}
    >
      Skip to Main Content
    </Button>
  );
}
