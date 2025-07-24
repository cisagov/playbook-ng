import css from "./IgnoredItems.module.css";
import {
  useAppDispatch,
  useAppSelector,
} from "@playbook-ng/shared-web/src/store/hooks";
import { quantity } from "@playbook-ng/shared/src/base/utils/string";
import { useCallback, useContext } from "react";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";
import { restoreItem } from "@playbook-ng/shared-web/src/store/playbookSlice";
import { Button } from "react-bootstrap";
import { ButtonCollapsePanel } from "@/components/ButtonCollapsePanel/ButtonCollapsePanel";

function IgnoredEntry(args: { itemId: string }) {
  const { itemId } = args;
  const { itemLUT } = useContext(DataLUTsContext);
  const item = itemLUT[itemId];

  const allItems = useAppSelector((s) => s.appdata.dataset.items);
  const dispatch = useAppDispatch();

  const restore = useCallback(
    () => dispatch(restoreItem({ allItems, itemId })),
    [dispatch, allItems, itemId]
  );

  return (
    <li className={css.list_item}>
      <Button
        variant="outline-primary"
        size="sm"
        className={css.button}
        onClick={restore}
      >
        Un-ignore <strong>{item.id}</strong> {item.name}
      </Button>
    </li>
  );
}

export function IgnoredItems() {
  const itemType = useAppSelector((s) => s.appdata.dataset.item_type);
  const ignored_items = useAppSelector((s) => s.playbook.ignored_items);
  const ignoredIds = ignored_items.slice(0).reverse();
  const qty = ignoredIds.length;

  return (
    <ButtonCollapsePanel
      variant="outline-warning"
      btnText={quantity(qty, `Ignored ${itemType}`)}
    >
      <div className={css.div}>
        <p className={css.para}>
          Ignoring {itemType}s prevents them from appearing in your Playbook.
          <br />A warning will show on the <strong>Add to Playbook</strong>{" "}
          button of ignored {itemType}s.
          <br />
          This is useful for dismissing suggestions inapplicable to your
          environment.
        </p>
        {qty > 0 ? (
          <div className={css.list_wrap}>
            <ul className={css.list}>
              {ignoredIds.map((id) => (
                <IgnoredEntry key={id} itemId={id} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </ButtonCollapsePanel>
  );
}
