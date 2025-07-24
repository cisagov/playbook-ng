import { ItemIDContext } from "@/contexts/ItemIDContext";
import { ItemLUTContext } from "@/contexts/ItemLUTContext";
import { TechStatusLUTContext } from "@/contexts/TechStatusLUTContext";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { getTechStatusLut } from "@playbook-ng/shared/src/attack/objects";
import { Dict } from "@playbook-ng/shared/src/base/types";
import { Item } from "@playbook-ng/shared/src/dataset/types";
import { useMemo } from "react";

/**
 * Provides Multiple Tech / Item Helper Contexts
 *
 * This is to be used once, towards the root of a DOM
 *
 * - TechStatusLUTContext: ID -> TechIdStatus lookup
 * - ItemLUTContext: ID -> Item lookup
 * - ItemIDContext: ID of the Item currently being edited
 */
export function ProvideTechItemLUTs(args: {
  editedItemId: string;
  children: React.ReactNode;
}) {
  const { editedItemId, children } = args;

  const attack = useAppSelector((s) => s.appdata.attack);
  const items = useAppSelector((s) => s.appdata.dataset.items);

  const techStatusLUT = useMemo(() => getTechStatusLut(attack), [attack]);

  const itemLUT = useMemo(() => {
    const lut: Dict<Item | undefined> = {};
    items.forEach((i) => (lut[i.id] = i));
    return lut;
  }, [items]);

  return (
    <TechStatusLUTContext.Provider value={techStatusLUT}>
      <ItemLUTContext.Provider value={itemLUT}>
        <ItemIDContext.Provider value={editedItemId}>
          {children}
        </ItemIDContext.Provider>
      </ItemLUTContext.Provider>
    </TechStatusLUTContext.Provider>
  );
}
