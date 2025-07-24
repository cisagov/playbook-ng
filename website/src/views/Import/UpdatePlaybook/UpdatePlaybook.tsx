import css from "./UpdatePlaybook.module.css";

import { Playbook } from "@playbook-ng/shared/src/playbook/types";
import { useFinishImportingPlaybook } from "@/hooks/useFinishImportingPlaybook";
import { useCallback, useId, useMemo } from "react";
import { Button, Form, Table } from "react-bootstrap";
import {
  AttackDatasets,
  getTechStatus,
  getTechStatusLut,
} from "@playbook-ng/shared/src/attack/objects";
import {
  Dataset,
  Item,
  ItemEntry,
  TechToItemVal,
} from "@playbook-ng/shared/src/dataset/types";
import { getDatasetTechToItems } from "@playbook-ng/shared/src/dataset/utils";
import { Dict } from "@playbook-ng/shared/src/base/types";
import { DEFAULT_TECH_CONFIDENCE } from "@playbook-ng/shared/src/dataset/constants";
import { getUsedTemplateInfo } from "@playbook-ng/shared/src/playbook/utils/template-info";
import {
  difference,
  stableDedupe,
} from "@playbook-ng/shared/src/base/utils/set";
import {
  adjustTechs,
  hideUnchanged,
  TechAdjustment,
} from "@playbook-ng/shared/src/app/load";
import { getTimeISO } from "@playbook-ng/shared/src/base/utils/time";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { useBool } from "@/hooks/useBool";
import {
  ttiItemIDs,
  ttiTechIDs,
} from "@playbook-ng/shared/src/playbook/helpers";

const IMPORT_STATUSES = [
  "removed",
  "replaced",
  "added",
  "updated",
  "unchanged",
] as const;

type t_ImportStatus = (typeof IMPORT_STATUSES)[number];

interface ItemStatusRow {
  status: t_ImportStatus;
  id: string;
  name?: string;
  oldVersion?: string;
  newVersion?: string;
}

function getItemVersionLUT(playbook: Playbook): Dict<string | undefined> {
  const lookup: Dict<string | undefined> = {};

  Object.values(playbook.tech_to_items)
    .flatMap((val) => val.items)
    .forEach((item) => (lookup[item.id] = item.version));

  return lookup;
}

function calcItemChanges(args: {
  itemLUT: Dict<Item | undefined>;
  oldBook: Playbook;
  newBook: Playbook;
}): ItemStatusRow[] {
  const { itemLUT, oldBook, newBook } = args;

  const oldItemVers = getItemVersionLUT(oldBook);
  const newItemVers = getItemVersionLUT(newBook);

  const allItemIds = stableDedupe([
    ...Object.keys(oldItemVers),
    ...Object.keys(newItemVers),
  ]);

  const rows: ItemStatusRow[] = allItemIds.map((id) => {
    const name = itemLUT[id]?.name;
    const oldVersion = oldItemVers[id];
    const newVersion = newItemVers[id];
    let status: ItemStatusRow["status"] = "unchanged";
    if (typeof newVersion === "undefined") status = "removed";
    else if (typeof oldVersion === "undefined") status = "added";
    else if (oldVersion !== newVersion) status = "updated";
    else status = "unchanged";
    return { status, id, name, oldVersion, newVersion };
  });

  return rows;
}

function update(args: {
  playbook: Playbook;
  attack: AttackDatasets;
  dataset: Dataset;
}): {
  playbook: Playbook;
  itemTable: ItemStatusRow[];
  techTable: TechAdjustment[];
} {
  const { playbook: oldPlaybook, attack, dataset } = args;
  const { tech_to_items: oldTTI, ignored_items: oldIgnoredIds } = oldPlaybook;
  const { template } = getUsedTemplateInfo({ playbook: oldPlaybook, dataset });

  const playbook: Playbook = {
    ...oldPlaybook,
    tech_to_items: {
      unmapped: { confidence: DEFAULT_TECH_CONFIDENCE, items: [] },
    },
    ignored_items: [],
  };

  const statusLut = getTechStatusLut(attack);
  const datasetTTI = getDatasetTechToItems(dataset.items);
  const itemLUT: Dict<Item | undefined> = {};
  dataset.items.forEach((i) => (itemLUT[i.id] = i));

  const validOldItemIds = new Set(
    ttiItemIDs(oldTTI).filter((id) => typeof itemLUT[id] !== "undefined")
  );

  const validOldIgnoredIds = oldIgnoredIds.filter(
    (id) => typeof itemLUT[id] !== "undefined"
  );

  playbook.ignored_items = stableDedupe([
    ...validOldIgnoredIds,
    ...(template?.ignored_items ?? []),
  ]).filter((id) => !validOldItemIds.has(id));
  const newIgnoredIds = new Set(playbook.ignored_items);

  const oldTechIds = ttiTechIDs(oldTTI);
  const templateTechIds = ttiTechIDs(template?.tech_to_items);

  const allTechsIds = stableDedupe([...oldTechIds, ...templateTechIds]);

  for (let techId of allTechsIds) {
    const confidence =
      (oldTTI[techId] as TechToItemVal | undefined)?.confidence ??
      DEFAULT_TECH_CONFIDENCE;
    const status = getTechStatus(statusLut, techId);
    const { type } = status;
    if (type === "active" || type === "revoked") {
      if (type === "revoked") techId = status.by;
      const items = (datasetTTI[techId] ?? []).filter(
        (i) => !newIgnoredIds.has(i.id)
      );
      playbook.tech_to_items[techId] = { confidence, items };
    }
  }

  const newItemIds = new Set(ttiItemIDs(playbook.tech_to_items));

  const lostItems = Array.from(difference(validOldItemIds, newItemIds))
    .map((id) => itemLUT[id]!)
    .map(({ id, version }) => ({ id, version }));

  let templateUnmappedItems: ItemEntry[] = [];
  if (template !== null) {
    templateUnmappedItems = template.tech_to_items.unmapped.items;
  }

  const appBaselineItems = dataset.items
    .filter((i) => i.is_baseline)
    .map(({ id, version }) => ({ id, version }));

  playbook.tech_to_items.unmapped.items = stableDedupe(
    [...lostItems, ...templateUnmappedItems, ...appBaselineItems],
    (item) => item.id
  ).filter((i) => !newIgnoredIds.has(i.id));

  playbook.updated = getTimeISO();

  const { adjusts: techTable } = adjustTechs({
    uncheckedIds: oldTechIds,
    activeIdsToAdd: templateTechIds,
    attack,
  });
  const itemTable = calcItemChanges({
    itemLUT,
    oldBook: oldPlaybook,
    newBook: playbook,
  });

  [itemTable, techTable].forEach((table) => {
    table.sort((a, b) => {
      return (
        IMPORT_STATUSES.indexOf(a.status) - IMPORT_STATUSES.indexOf(b.status)
      );
    });
  });

  return { playbook, itemTable, techTable };
}

function ItemStatusTable(args: {
  changes: ItemStatusRow[];
  noUnchanged: boolean;
}) {
  const { noUnchanged } = args;
  const changes = hideUnchanged(args.changes, noUnchanged);

  const itemName = useAppSelector((s) => s.appdata.dataset.item_type);

  const rows = changes.map((c) => (
    <tr key={c.id}>
      <td>{c.status}</td>
      <td>{c.id}</td>
      <td>{c.name ?? "unknown"}</td>
      <td>{c.oldVersion ?? "-"}</td>
      <td>{c.newVersion ?? "-"}</td>
    </tr>
  ));

  const table = (
    <Table striped bordered hover className={css.table}>
      <thead>
        <tr>
          <th>Status</th>
          <th>{itemName} ID</th>
          <th>{itemName} Name</th>
          <th>Old Version</th>
          <th>New Version</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </Table>
  );

  return <div className={css.table_wrapper}>{table}</div>;
}

function TechStatusTable(args: {
  changes: TechAdjustment[];
  noUnchanged: boolean;
}) {
  const { noUnchanged } = args;
  const changes = hideUnchanged(args.changes, noUnchanged);

  const rows = changes.map((c) => (
    <tr key={c.id}>
      <td>{c.status}</td>
      <td>{c.reason}</td>
      <td>{c.id}</td>
      <td>{c.name ?? "-"}</td>
    </tr>
  ));

  const table = (
    <Table striped bordered hover className={css.table}>
      <thead>
        <tr>
          <th>Status</th>
          <th>Reason</th>
          <th>Tech ID</th>
          <th>Tech Name</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </Table>
  );

  return <div className={css.table_wrapper}>{table}</div>;
}

export function UpdatePlaybook(args: {
  fileName: string;
  playbook: Playbook;
  onCancel: () => void;
}) {
  const { fileName, onCancel } = args;

  const { attack, dataset } = useAppSelector((s) => s.appdata);

  const { techTable, itemTable, playbook } = useMemo(
    () => update({ playbook: args.playbook, attack, dataset }),
    [args.playbook, attack, dataset]
  );

  const templateInfo = useMemo(
    () => getUsedTemplateInfo({ playbook, dataset }),
    [playbook, dataset]
  );

  const finishImporting = useFinishImportingPlaybook();
  const onImport = useCallback(
    () => finishImporting(playbook),
    [finishImporting, playbook]
  );

  const hideUnchangedRows = useBool(true);
  const checkId = useId();

  const numTechs = ttiTechIDs(playbook.tech_to_items).length;
  const numItems = ttiItemIDs(playbook.tech_to_items).length;

  return (
    <div className={css.root}>
      <section className={css.success_details}>
        <h3>Details</h3>

        <ul>
          <li>
            <strong>Filename:</strong> {fileName}
          </li>
          <li>
            <strong>Title:</strong> {playbook.title}
          </li>
          <li>
            <strong>Version:</strong> {playbook.version}
          </li>
          <li>
            <strong>Template:</strong> {templateInfo.display}
          </li>
        </ul>
      </section>

      <section className={css.success_content}>
        <h3>Content</h3>

        <section className={css.success_content_checks}>
          <h4 className="visually-hidden">Options</h4>
          <Form.Check
            id={checkId}
            label={"Visually hide unchanged rows"}
            checked={hideUnchangedRows.val}
            onChange={hideUnchangedRows.toggle}
          />
        </section>

        {/* techs */}
        <section>
          <h4>Techniques ({numTechs})</h4>
          <TechStatusTable
            changes={techTable}
            noUnchanged={hideUnchangedRows.val}
          />
        </section>

        {/* items */}
        <section>
          <h4>
            {dataset.item_type}s ({numItems})
          </h4>
          <ItemStatusTable
            changes={itemTable}
            noUnchanged={hideUnchangedRows.val}
          />
        </section>
      </section>

      <section className={css.buttons_div}>
        <h3 className="visually-hidden">Finish Import or Cancel</h3>
        <Button onClick={onCancel} variant="outline-danger">
          Cancel
        </Button>
        <Button onClick={onImport}>Import</Button>
      </section>
    </div>
  );
}
