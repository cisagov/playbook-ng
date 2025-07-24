import { addAlert } from "@playbook-ng/shared-web/src/store/alertSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "@playbook-ng/shared-web/src/store/hooks";
import {
  addAdditionalItem,
  addTechs,
} from "@playbook-ng/shared-web/src/store/playbookSlice";
import {
  joinTechName,
  Technique,
} from "@playbook-ng/shared/src/attack/objects";
import { ItemAndTech } from "@playbook-ng/shared/src/dataset/types";
import { useCallback } from "react";

/**
 * Returns a func that adds the Tech, (or Item under a Tech), to the Playbook
 */
export function useAddToPlaybook(
  args: { tech: Technique } | { itemAndTech: ItemAndTech }
) {
  const dispatch = useAppDispatch();

  const allItems = useAppSelector((s) => s.appdata.dataset.items);
  const itemType = useAppSelector((s) => s.appdata.dataset.item_type);

  return useCallback(() => {
    if ("tech" in args) {
      const { tech } = args;
      const id = tech.attackId;
      const name = joinTechName(tech.name);

      dispatch(addTechs({ allItems, ids: [id] }));
      dispatch(
        addAlert({
          type: "success",
          message: `Technique ${name} (${id}) was added to the playbook.`,
        })
      );
    } else {
      const { item, techId } = args.itemAndTech;
      if (techId !== "unmapped") {
        return;
      }

      dispatch(addAdditionalItem({ allItems, item }));
      dispatch(
        addAlert({
          type: "success",
          message: `${itemType} ${item.name} (${item.id}) was added to the playbook.`,
        })
      );
    }
  }, [args, dispatch, allItems, itemType]);
}
