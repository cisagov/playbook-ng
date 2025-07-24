import { v4 } from "uuid";

/**
 * Type, wrapped to give it a unique key
 *
 * - Single entry of a keyed array
 */
export type Keyed<Type> = { key: string; val: Type };

/**
 * Wraps each entry in an array to give them unique keys
 *
 * - Returns a keyed array
 */
export function keyArray<Type>(arr: Type[]): Keyed<Type>[] {
  return arr.map((val) => ({ key: v4(), val: val }));
}

/**
 * Unwraps an array of wrapped entries (a keyed array)
 *
 * - Returns a normal array
 */
export function unkeyArray<Type>(arr: Keyed<Type>[]): Type[] {
  return arr.map((item) => item.val);
}

/** Actions for transforming / reducing a keyed array */
export type KeyedArrAction<Type> =
  | {
      type: "clear";
    }
  | {
      type: "prepend";
      val: Type;
    }
  | {
      type: "append";
      val: Type;
    }
  | {
      type: "set-item";
      key: string;
      val: Type;
    }
  | {
      type: "del-item";
      key: string;
    }
  | {
      type: "move-up"; // 0 1 <- 2 3
      key: string;
    }
  | {
      type: "move-down"; // 0 1 -> 2 3
      key: string;
    };

/** Transforms a keyed array according to the specified action */
export function keyedArrReducer<Type>(
  current: Keyed<Type>[],
  action: KeyedArrAction<Type>
): Keyed<Type>[] {
  switch (action.type) {
    case "clear": {
      return [];
    }
    case "prepend": {
      const itemNew = { key: v4(), val: action.val };
      return [itemNew, ...current];
    }
    case "append": {
      const itemNew = { key: v4(), val: action.val };
      return [...current, itemNew];
    }
    case "set-item": {
      const itemMod = { key: action.key, val: action.val };
      return current.map((item) => (item.key === action.key ? itemMod : item));
    }
    case "del-item": {
      return current.filter((item) => item.key !== action.key);
    }
    case "move-up": {
      const ind = current.findIndex((item) => item.key === action.key);
      if (ind === 0) return current;

      const clone = current.slice();

      const temp = clone[ind - 1];
      clone[ind - 1] = clone[ind];
      clone[ind] = temp;

      return clone;
    }
    case "move-down": {
      const ind = current.findIndex((item) => item.key === action.key);
      if (ind === current.length - 1) return current;

      const clone = current.slice();

      const temp = clone[ind + 1];
      clone[ind + 1] = clone[ind];
      clone[ind] = temp;

      return clone;
    }
  }
}
