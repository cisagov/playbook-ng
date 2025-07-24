import { useCallback, useContext } from "react";
import { BaseDeleteModal } from "../BaseDeleteModal";
import { PlaybookDeleteModalArgs } from "./types";
import {
  useAppDispatch,
  useAppSelector,
} from "@playbook-ng/shared-web/src/store/hooks";
import { playbookDelete } from "@playbook-ng/shared-web/src/store/playbookSlice";
import { PlaybookDeleteModalControlContext } from "./PlaybookDeleteModalControlContext";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";
import { joinTechName } from "@playbook-ng/shared/src/attack/objects";
import { quantity } from "@playbook-ng/shared/src/base/utils/string";

export function PlaybookDeleteModal(args: PlaybookDeleteModalArgs) {
  const { callback, ...payload } = args;

  const { close } = useContext(PlaybookDeleteModalControlContext);
  const dispatch = useAppDispatch();
  const confirm = useCallback(() => {
    dispatch(playbookDelete(payload));
  }, [dispatch, payload]);

  const itemType = useAppSelector((s) => s.appdata.dataset.item_type);
  const { type } = payload;

  let title = "";
  let body = null;

  switch (type) {
    case "close-playbook":
      title = "Clear Playbook";
      body = <PlaybookMsg />;
      break;
    case "remove-tech":
      title = "Remove Technique";
      body = <TechMsg id={payload.id} />;
      break;
    case "remove-additional-item":
      title = `Remove Additional ${itemType}`;
      body = <AdditionalItemMsg id={payload.id} />;
      break;
    case "ignore-item":
      title = `Ignore ${itemType}`;
      body = <IgnoreItemMsg id={payload.id} />;
      break;
    default:
      throw new Error(`Unknown PlaybookDeletePayload.type '${type}'`);
  }

  return (
    <BaseDeleteModal
      title={title}
      close={close}
      confirm={confirm}
      callback={callback}
    >
      {body}
    </BaseDeleteModal>
  );
}

function AdditionalItemMsg(args: { id: string }) {
  const { id } = args;

  const { itemLUT } = useContext(DataLUTsContext);
  const item = itemLUT[id];
  const itemType = useAppSelector((s) => s.appdata.dataset.item_type);

  return (
    <p>
      Are you sure that you want to remove additional {itemType}
      <br />
      <strong>
        {item.name} ({item.id})
      </strong>
      ?
    </p>
  );
}

function IgnoreItemMsg(args: { id: string }) {
  const { id } = args;

  const { itemLUT } = useContext(DataLUTsContext);
  const item = itemLUT[id];
  const itemType = useAppSelector((s) => s.appdata.dataset.item_type);

  return (
    <p>
      Are you sure that you want to remove and ignore {itemType}
      <br />
      <strong>
        {item.name} ({item.id})
      </strong>
      ?
    </p>
  );
}

function TechMsg(args: { id: string }) {
  const { id } = args;

  const { itemLUT, techLUT } = useContext(DataLUTsContext);
  const tech = techLUT[id];
  const techName = joinTechName(tech.name);
  const techToItems = useAppSelector((s) => s.playbook.tech_to_items);
  const items = techToItems[id].items.map((i) => itemLUT[i.id]);
  const itemType = useAppSelector((s) => s.appdata.dataset.item_type);

  return (
    <>
      <p>
        Are you sure that you want to remove Technique
        <br />
        <strong>
          {techName} ({id})
        </strong>
        ?
      </p>
      {items.length > 0 ? (
        <>
          <span>
            This will also remove its{" "}
            {quantity(items.length, `mapped ${itemType}`)}:
          </span>
          <ul>
            {items.map((i) => (
              <li key={i.id}>
                <strong>
                  {i.name} ({i.id})
                </strong>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

function PlaybookMsg() {
  return (
    <p>
      <strong>Clearing the Playbook will reset all entered information.</strong>
      <br />
      If you wish to save your data, please choose one of the export options.
      <br />
      Are you sure that you want to clear your current Playbook?
    </p>
  );
}
