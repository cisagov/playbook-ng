import { Button } from "react-bootstrap";
import css from "./ButtonNA.module.css";

/** React-Bootstrap Button Props */
type Args = Parameters<typeof Button>[0];

/**
 * React-Bootstrap Button + cursor: not-allowed on disable
 *
 * - **Warning: Should be used carefully**
 *   - Sizing / margins / padding may not always work as expected
 * - Wraps Button with a div to allow setting not-allowed
 * - Passes all props / children to Button
 */
export function ButtonNA(args: Args) {
  const { children, ...props } = args;
  // eslint-disable-next-line react/prop-types
  const disabled = props.disabled ?? false;
  return (
    <div className={`${css.wrapper} ${disabled ? css.disabled : ""}`}>
      <Button {...props}>{children}</Button>
    </div>
  );
}
