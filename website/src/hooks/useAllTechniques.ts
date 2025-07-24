import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import {
  AttackDataset,
  Technique,
} from "@playbook-ng/shared/src/attack/objects";
import { useMemo } from "react";

export function useAllTechniques(): Technique[] {
  const attack = useAppSelector((s) => s.appdata.attack);

  return useMemo(() => {
    return Object.values(attack).flatMap(
      (dom: AttackDataset) => dom.techniques
    );
  }, [attack]);
}
