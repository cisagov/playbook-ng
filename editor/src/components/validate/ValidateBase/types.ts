/**
 * A Validation Result
 *
 * Returned by a check function passed to ValidateBase.
 *
 * - null means nothing should be displayed
 * - status sets the stoplight color of the displayed text
 *   - **good**: green
 *   - **warn**: yellow
 *   - **bad**: red
 * - the status value is included invisibly for screen readers
 * - displayed as "**type** | message"
 */
export type VResult = null | {
  status: "good" | "warn" | "bad";
  type: string;
  message: string;
};
