import { stableDedupe } from "../base/utils/set";
import { TechToItemMap } from "../dataset/types";

export function ttiTechIDs(tti: TechToItemMap | undefined | null): string[] {
  if (typeof tti === "undefined" || tti === null) return [];
  else return Object.keys(tti).filter((id) => id !== "unmapped");
}

export function ttiItemIDs(tti: TechToItemMap | undefined | null): string[] {
  if (typeof tti === "undefined" || tti === null) return [];
  else
    return stableDedupe(
      Object.values(tti)
        .flatMap((val) => val.items)
        .map((item) => item.id)
    );
}
