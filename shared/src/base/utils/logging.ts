/**
 * Assists in giving context to the user when displaying error messages
 * - debug: When true, each use of .high/.med/.low will print the full context
 *   - In the format "{H} - {M} - {L}", for existing parts
 *   - This works as a logging facility (albeit verbose) to track progress
 */
export class LoggingContext {
  private h: string | null;
  private m: string | null;
  private l: string | null;
  private debug: boolean;

  constructor(args: { debug?: boolean }) {
    this.h = null;
    this.m = null;
    this.l = null;
    this.debug = args.debug ?? false;
  }

  /**
   * High-Level description of what is happening
   * - clears Med / Low
   */
  high(text: string) {
    this.h = text;
    this.m = null;
    this.l = null;
    if (this.debug) console.log(this.toString());
  }

  /**
   * Medium-Level description of what is happening
   * - clears Low
   */
  med(text: string) {
    this.m = text;
    this.l = null;
    if (this.debug) console.log(this.toString());
  }

  /**
   * Low-Level description of what is happening
   */
  low(text: string) {
    this.l = text;
    if (this.debug) console.log(this.toString());
  }

  /**
   * Returns the "{H} - {M} - {L}" full context message
   */
  toString(): string {
    const parts = [this.h, this.m, this.l];
    const active = parts.filter((p): p is string => p !== null && p.length > 0);
    return active.join(" - ");
  }

  /**
   * Given a caught error,
   * Returns "{H} - {M} - {L} - {Error Text}"
   */
  messageFor(err: unknown): string {
    const msg = `${err}` || "Unknown Error";
    return `${this} - ${msg}`;
  }
}
