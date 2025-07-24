import { useContext } from "react";
import css from "./ValidateBase.module.css";
import { ValSet, ValSetContext } from "@/contexts/ValSetContext";
import { VResult } from "./types";

/** good / warn / bad Status */
type Status = NonNullable<VResult>["status"];

/**
 * Map Status to Stoplight
 * - **good**: green
 * - **warn**: yellow
 * - **bad**: red
 */
const STYLE_LUT: Record<Status, string> = {
  good: css.good,
  warn: css.warn,
  bad: css.bad,
};

/**
 * A Base for Inline Validation Components
 *
 * - Reads val: T from current context
 * - Validates val using check function
 * - Displays returned VResult to user
 *
 * **WARNING**: This has no mechanism to prevent the user from using
 * values that have 'failed' validation, rather, this serves to offer
 * rich inline validation feedback as they use the editor.
 */
export function ValidateBase<T>(args: { check: (val: T) => VResult }) {
  const check = args.check;
  const { val } = useContext(ValSetContext) as ValSet<T>;

  const result = check(val);

  if (result === null) {
    return null;
  } else {
    const { status, type, message } = result;
    const style = STYLE_LUT[status];

    return (
      <div className={`${css.status} ${style}`}>
        <strong>
          <span className="visually-hidden">{status}:</span> {type}
        </strong>{" "}
        | {message}
      </div>
    );
  }
}
