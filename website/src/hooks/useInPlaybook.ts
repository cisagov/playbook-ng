import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { Technique } from "@playbook-ng/shared/src/attack/objects";
import {
  ItemAndTech,
  TechToItemVal,
} from "@playbook-ng/shared/src/dataset/types";
import { useMemo } from "react";

/**
 * Returns a bool on if the Tech, (or Item under a Tech), is in the Playbook
 */
export function useInPlaybook(
  args: { tech: Technique } | { itemAndTech: ItemAndTech }
): boolean {
  const cart = useAppSelector((s) => s.playbook.tech_to_items);

  return useMemo(() => {
    if ("tech" in args) {
      return typeof cart[args.tech.attackId] !== "undefined";
    } else {
      const entry = cart[args.itemAndTech.techId] as TechToItemVal | undefined;
      const items = entry?.items ?? [];
      const ids = items.map((i) => i.id);
      return ids.includes(args.itemAndTech.item.id);
    }
  }, [args, cart]);
}
