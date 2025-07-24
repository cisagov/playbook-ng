const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const isDateValid = (d: unknown): boolean =>
  d instanceof Date && !isNaN(d.valueOf());

/** Returns current time as string(yyyy-MM-ddTHH:mm:ss.sssZ) */
export function getTimeISO(): string {
  return new Date().toISOString();
}

/** Returns hh:mm:ss
 * - Takes: string(yyyy-MM-ddTHH:mm:ss.sssZ), Date, or handles undefined
 */
export function timeISO2HMS(time: string | Date | undefined): string {
  if (typeof time === "undefined") return "unspecified";
  const date = typeof time === "string" ? new Date(time) : time;
  if (!isDateValid(date)) return "invalid";

  const h = date.getUTCHours().toString().padStart(2, "0");
  const m = date.getUTCMinutes().toString().padStart(2, "0");
  const s = date.getUTCSeconds().toString().padStart(2, "0");

  return `${h}:${m}:${s}`;
}

/** Returns dd Month yyyy
 * - Takes: string(yyyy-MM-ddTHH:mm:ss.sssZ), Date, or handles undefined
 */
export function timeISO2DMY(time: string | Date | undefined): string {
  if (typeof time === "undefined") return "unspecified";
  const date = typeof time === "string" ? new Date(time) : time;
  if (!isDateValid(date)) return "invalid";

  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = MONTH_NAMES[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day} ${month} ${year}`;
}
