// Pulled-From:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
//
// License:
// https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license
//
// License Type:
// MIT / CC0

export function isSuperset<T>(set: Set<T>, subset: Set<T>): boolean {
  for (const elem of subset) {
    if (!set.has(elem)) {
      return false;
    }
  }
  return true;
}

export function union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const _union = new Set(setA);
  for (const elem of setB) {
    _union.add(elem);
  }
  return _union;
}

export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const _intersection = new Set<T>();
  for (const elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem);
    }
  }
  return _intersection;
}

export function symmetricDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const _difference = new Set(setA);
  for (const elem of setB) {
    if (_difference.has(elem)) {
      _difference.delete(elem);
    } else {
      _difference.add(elem);
    }
  }
  return _difference;
}

export function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const _difference = new Set(setA);
  for (const elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}

// -----------------------------------------------------------------------------
// Personal Additions

export function setsAreEqual<T>(a: Set<T>, b: Set<T>): boolean {
  return a.size === b.size && b.size === union<T>(a, b).size;
}

export function stableDedupe<T>(values: T[], keyOf?: (val: T) => string): T[] {
  const seen = new Set<string>();
  return values
    .map((val) => {
      const key = typeof val === "string" ? val : keyOf!(val);
      if (seen.has(key)) {
        return null;
      } else {
        seen.add(key);
        return val;
      }
    })
    .filter((val): val is T => val !== null);
}
