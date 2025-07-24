import { Technique } from "@playbook-ng/shared/src/attack/objects";
import { ItemAndTech } from "@playbook-ng/shared/src/dataset/types";
import { useMemo, useState } from "react";
import { TechniqueModal } from "../Techniques/TechniqueModal/TechniqueModal";
import { ItemModal } from "../Item/ItemModal/ItemModal";
import { TechModalControlContext } from "@/contexts/TechModalControlContext";
import { ItemModalControlContext } from "@/contexts/ItemModalControlContext";

export function GlobalTechOrItemModal(args: { children: React.ReactNode }) {
  const { children } = args;

  const [tech, setTech] = useState<null | Technique>(null);
  const [item, setItem] = useState<null | ItemAndTech>(null);

  const techControl = useMemo(
    () => ({
      open: (t: Technique) => setTech(t),
      close: () => setTech(null),
    }),
    []
  );

  const itemControl = useMemo(
    () => ({
      open: (it: ItemAndTech) => setItem(it),
      close: () => setItem(null),
    }),
    []
  );

  return (
    <TechModalControlContext.Provider value={techControl}>
      <ItemModalControlContext.Provider value={itemControl}>
        {children}
        {tech ? (
          <TechniqueModal tech={tech} />
        ) : item ? (
          <ItemModal itemAndTech={item} />
        ) : null}
      </ItemModalControlContext.Provider>
    </TechModalControlContext.Provider>
  );
}
