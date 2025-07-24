import { Keyed, KeyedArrAction, keyedArrReducer } from "@/code/keying";
import { EditingContext } from "@/contexts/EditingContext";
import React, { useCallback, useContext, useMemo } from "react";
import { Button } from "react-bootstrap";
import { Data } from "../Data/Data";
import { ValSet, ValSetContext } from "@/contexts/ValSetContext";
import css from "./ListEditor.module.css";
import { BsArrowDown, BsArrowUp, BsTrash } from "react-icons/bs";
import { FieldNamesContext } from "@/contexts/FieldNamesContext";

/**
 * An Item of List Editor (Array of Keyed<T>)
 *
 * - Adds entry number (index + 1) to FieldNamesContext for later labels
 * - Provides list[n] val/set to children to view/edit
 */
function ListEditorItem<T>(args: {
  item: Keyed<T>;
  listDo: (a: KeyedArrAction<T>) => void;
  children: React.ReactNode;
  index: number;
}) {
  const { item, listDo, children, index } = args;
  const { key, val } = item;

  const rootFieldNames = useContext(FieldNamesContext);
  const fieldNames = useMemo(
    () => [...rootFieldNames, `#${index + 1}`],
    [rootFieldNames, index]
  );

  const editing = useContext(EditingContext);

  const set = useCallback(
    (value: T) => listDo({ type: "set-item", key, val: value }),
    [key, listDo]
  );

  const vs = useMemo(() => ({ val, set }), [val, set]);

  const moveUp = useCallback(
    () => listDo({ type: "move-up", key }),
    [key, listDo]
  );

  const moveDown = useCallback(
    () => listDo({ type: "move-down", key }),
    [key, listDo]
  );

  const delItem = useCallback(
    () => listDo({ type: "del-item", key }),
    [key, listDo]
  );

  const buttons = (
    <div className="d-flex ms-2 gap-2">
      <div>
        <Button
          variant="outline-dark"
          size="sm"
          onClick={moveUp}
          aria-label="Move Up"
        >
          <BsArrowUp className="bs-svg" aria-hidden="true" />
        </Button>
        <Button
          variant="outline-dark"
          size="sm"
          onClick={moveDown}
          aria-label="Move Down"
        >
          <BsArrowDown className="bs-svg" aria-hidden="true" />
        </Button>
      </div>
      <div>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={delItem}
          aria-label="Delete"
        >
          <BsTrash className="bs-svg" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );

  return (
    <li>
      <div className={css.item_div}>
        <div>
          <Data vs={vs}>
            <FieldNamesContext.Provider value={fieldNames}>
              {children}
            </FieldNamesContext.Provider>
          </Data>
        </div>
        {editing ? buttons : null}
      </div>
    </li>
  );
}

/**
 * List Editor (Array of Keyed<T>)
 *
 * - Renders children for each entry of list
 *   - Provides according { val, set } context to modify the entry (ListEditorItem assists)
 * - initItem provides a default value when choosing to [Prepend New] or [Append New] entry
 */
export function ListEditor<T>(args: {
  initItem: () => T;
  children: React.ReactNode;
}) {
  const { initItem, children } = args;

  const { val, set } = useContext(ValSetContext) as ValSet<Keyed<T>[]>;
  const editing = useContext(EditingContext);

  if (!Array.isArray(val)) {
    throw new Error(`ListEditor given non-array val ${val}`);
  }

  const listDo = useCallback(
    (a: KeyedArrAction<T>) => set(keyedArrReducer(val, a)),
    [set, val]
  );

  const items = val.map((item, index) => (
    <ListEditorItem key={item.key} item={item} listDo={listDo} index={index}>
      {children}
    </ListEditorItem>
  ));

  const prependNew = useCallback(
    () => set(keyedArrReducer(val, { type: "prepend", val: initItem() })),
    [initItem, set, val]
  );
  const appendNew = useCallback(
    () => set(keyedArrReducer(val, { type: "append", val: initItem() })),
    [initItem, set, val]
  );

  const prependBtn = (
    <Button variant="outline-dark" size="sm" onClick={prependNew}>
      Prepend New
    </Button>
  );
  const appendBtn = (
    <Button variant="outline-dark" size="sm" onClick={appendNew}>
      Append New
    </Button>
  );

  return (
    <div className={css.root}>
      {editing && items.length > 0 ? prependBtn : null}
      <ol>{items}</ol>
      {editing ? appendBtn : null}
    </div>
  );
}
