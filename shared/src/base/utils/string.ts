export function strCapitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function stringsAreUnique(strings: string[]): boolean {
  return new Set(strings).size === strings.length;
}

/**
 * Returns `1 itemName` or `N itemNames` to make the UI more English
 *
 * Only works with s endings, no -es, -ies, etc
 */
export function quantity(qty: number, itemName: string): string {
  const s = qty === 1 ? "" : "s";
  return `${qty} ${itemName}${s}`;
}
