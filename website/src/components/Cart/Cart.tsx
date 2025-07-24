import css from "./Cart.module.css";
import { TechCartEntry, ItemCartEntry } from "./CartEntry/CartEntry";
import { Button } from "react-bootstrap";
import { useCallback, useContext, useMemo, useRef } from "react";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { useNavigate } from "react-router-dom";
import { BsCaretLeftFill, BsCaretRightFill } from "react-icons/bs";
import { quantity } from "@playbook-ng/shared/src/base/utils/string";
import { InfoTooltip } from "../Tooltip/InfoTooltip";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";
import { OnPlaybook } from "../DeleteModals/PlaybookDeleteModal/OnPlaybook";
import { ttiTechIDs } from "@playbook-ng/shared/src/playbook/helpers";

function ButtonsItems(args: { allItemsType: string }) {
  const { allItemsType } = args;

  const navigate = useNavigate();
  const goToItems = useCallback(() => navigate("/items"), [navigate]);

  return (
    <div className={css.cart_header_button_rows}>
      <div className={css.cart_header_button_row_single}>
        <Button
          variant="outline-primary"
          className={css.cart_header_button}
          onClick={goToItems}
        >
          <BsCaretRightFill className={`bs-svg`} aria-hidden="true" />{" "}
          {allItemsType}s
        </Button>
      </div>
    </div>
  );
}

function ButtonsTechsAndReview() {
  const navigate = useNavigate();
  const goToTechs = useCallback(() => navigate("/techniques"), [navigate]);
  const goToReview = useCallback(() => navigate("/playbook"), [navigate]);

  return (
    <div className={css.cart_header_button_rows}>
      <div className={css.cart_header_button_row}>
        <Button
          variant="outline-primary"
          className={css.cart_header_button}
          onClick={goToTechs}
        >
          <BsCaretLeftFill className={`bs-svg`} aria-hidden="true" /> Techniques
        </Button>

        <Button
          variant="outline-primary"
          className={css.cart_header_button}
          onClick={goToReview}
        >
          <BsCaretRightFill className={`bs-svg`} aria-hidden="true" /> Review
        </Button>
      </div>
    </div>
  );
}

export function Cart(args: { nav: "Items >" | "< Techs | Review >" }) {
  const { nav } = args;

  const allItemsType = useAppSelector((s) => s.appdata.dataset.item_type);
  const datasetItems = useAppSelector((s) => s.appdata.dataset.items);
  const tech_to_items = useAppSelector((s) => s.playbook.tech_to_items);

  const numOfExistingBaselines = useMemo(() => {
    return datasetItems.filter((item) => item.is_baseline).length;
  }, [datasetItems]);

  const techsHeader = useRef<HTMLHeadingElement>(null);
  const focusTechsHeader = useCallback(
    (keyboard: boolean) =>
      techsHeader.current?.focus({ preventScroll: !keyboard }),
    []
  );

  const itemsHeader = useRef<HTMLHeadingElement>(null);
  const focusItemsHeader = useCallback(
    (keyboard: boolean) =>
      itemsHeader.current?.focus({ preventScroll: !keyboard }),
    []
  );

  /** All Technique IDs in the Cart */
  const cartTechIds = ttiTechIDs(tech_to_items);

  const { techLUT, itemLUT } = useContext(DataLUTsContext);

  const additionalCartItemIds = tech_to_items.unmapped.items.map(
    (item) => item.id
  );

  // header buttons
  let buttons = null;
  if (nav === "Items >") buttons = <ButtonsItems {...{ allItemsType }} />;
  else if (nav === "< Techs | Review >") buttons = <ButtonsTechsAndReview />;

  return (
    <div className={css.cart_container}>
      {/* header */}
      <div>
        {/* title */}
        <div className={css.cart_header_title_row}>
          <h2 className={css.cart_header_title}>Playbook Cart</h2>
        </div>

        {/* Buttons */}
        {buttons}
      </div>

      {/* body */}
      <div className={css.cart_content}>
        {/* Techniques + Mapped Items */}
        <div>
          <h3 className={css.cart_item_count} tabIndex={-1} ref={techsHeader}>
            {quantity(cartTechIds.length, "Technique")} + Mappings
          </h3>
          <OnPlaybook removeTech={focusTechsHeader}>
            {cartTechIds.map((techId) => {
              const tech = techLUT[techId];
              const items = tech_to_items[techId].items.map(
                ({ id }) => itemLUT[id]
              );
              return <TechCartEntry key={techId} tech={tech} items={items} />;
            })}
          </OnPlaybook>
        </div>

        <hr />

        {/* Additional Items / Baselines */}
        <div>
          <h3 className={css.cart_item_count} tabIndex={-1} ref={itemsHeader}>
            {quantity(
              additionalCartItemIds.length,
              `Additional ${allItemsType}`
            )}

            {/* tooltip describing why items are in their new cart */}
            {numOfExistingBaselines > 0 ? (
              <>
                {" "}
                <InfoTooltip
                  text={`Carts start with an always-recommended baseline set of ${allItemsType}s`}
                />
              </>
            ) : null}
          </h3>
          <OnPlaybook removeAdditionalItem={focusItemsHeader}>
            {additionalCartItemIds.map((itemId) => (
              <ItemCartEntry
                key={itemId}
                itemAndTech={{
                  techId: "unmapped",
                  item: itemLUT[itemId],
                }}
              />
            ))}
          </OnPlaybook>
        </div>
      </div>
    </div>
  );
}
