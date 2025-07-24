import {
  joinTechName,
  Technique,
} from "@playbook-ng/shared/src/attack/objects";
import css from "./CartEntry.module.css";
import { Button } from "react-bootstrap";
import { BsInfoCircleFill, BsTrashFill } from "react-icons/bs";
import { Item, ItemAndTech } from "@playbook-ng/shared/src/dataset/types";
import { ReactNode, useCallback, useContext, useMemo } from "react";
import { ItemModalControlContext } from "@/contexts/ItemModalControlContext";
import { TechModalControlContext } from "@/contexts/TechModalControlContext";
import { PlaybookDeleteModalControlContext } from "@/components/DeleteModals/PlaybookDeleteModal/PlaybookDeleteModalControlContext";

type EntryType = "tech" | "item";

export function TechCartEntry(args: { tech: Technique; items?: Item[] }) {
  const { tech, items } = args;
  const name = useMemo(() => joinTechName(tech.name), [tech.name]);

  const { open } = useContext(TechModalControlContext);
  const openModal = useCallback(() => open(tech), [open, tech]);

  const { open: bookDelete } = useContext(PlaybookDeleteModalControlContext);

  const openDelete = useCallback(
    () => bookDelete({ type: "remove-tech", id: tech.attackId }),
    [bookDelete, tech]
  );

  return (
    <CartEntryTemplate
      id={tech.attackId}
      name={name}
      type="tech"
      openModal={openModal}
      deleteEntry={openDelete}
    >
      {items ? (
        <ul className={css.tech_item_list}>
          {items.map((item) => (
            <li key={item.id}>
              <ItemCartEntry itemAndTech={{ techId: tech.attackId, item }} />
            </li>
          ))}
        </ul>
      ) : null}
    </CartEntryTemplate>
  );
}

export function ItemCartEntry(args: { itemAndTech: ItemAndTech }) {
  const { itemAndTech } = args;
  const { item, techId } = itemAndTech;

  const { open } = useContext(ItemModalControlContext);
  const openModal = useCallback(() => open(itemAndTech), [open, itemAndTech]);

  const { open: bookDelete } = useContext(PlaybookDeleteModalControlContext);

  const openDelete = useCallback(
    () => bookDelete({ type: "remove-additional-item", id: item.id }),
    [bookDelete, item.id]
  );

  const deleteEntry = techId === "unmapped" ? openDelete : undefined;

  return (
    <CartEntryTemplate
      id={item.id}
      name={item.name}
      type="item"
      openModal={openModal}
      deleteEntry={deleteEntry}
    />
  );
}

function CartEntryTemplate(args: {
  id: string;
  name: string;
  type: EntryType;
  openModal?: () => void;
  deleteEntry?: () => void;
  children?: ReactNode;
}) {
  const { id, name, type, openModal, deleteEntry, children } = args;

  const containerClass =
    type === "tech" ? css.container_tech_style : css.container_item_style;

  return (
    <div className={`${css.entry_container} ${containerClass}`}>
      <div className={css.entry_header}>
        {/* Label */}
        <div>
          <span className={css.cart_item_text}>
            {name} ({id})
          </span>
        </div>

        {/* Open / Delete Buttons */}
        <div className={css.entry_button_wrapper}>
          {openModal ? (
            <Button
              variant="primary"
              className={css.entry_button}
              onClick={openModal}
              aria-label={`More info on ${name} ${id}`}
            >
              <BsInfoCircleFill className={`bs-svg`} aria-hidden="true" />
            </Button>
          ) : null}
          {deleteEntry ? (
            <Button
              variant="outline-primary"
              className={css.entry_button}
              onClick={deleteEntry}
              aria-label={`Delete ${name} ${id}`}
            >
              <BsTrashFill className={`bs-svg`} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>

      {typeof children !== "undefined" ? <div>{children}</div> : null}
    </div>
  );
}
