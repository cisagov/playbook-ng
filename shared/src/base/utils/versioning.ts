export function highestVersion(versions: string[]): string | null {
  if (versions.length === 0) {
    return null;
  }

  // for COUN7ER (/base case) - where there is a single NaN version of "latest"
  if (versions.length === 1) {
    return versions[0];
  }

  const indMax = versions
    .map(parseFloat)
    .reduce((indMax, val, ind, arr) => (val > arr[indMax] ? ind : indMax), 0);

  return versions[indMax];
}
