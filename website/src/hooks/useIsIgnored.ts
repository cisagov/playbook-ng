import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { useMemo } from "react";

export function useIsIgnored(itemId: string) {
  const ignoredIds = useAppSelector((s) => s.playbook.ignored_items);
  const isIgnored = useMemo(
    () => ignoredIds.includes(itemId),
    [ignoredIds, itemId]
  );
  return isIgnored;
}
