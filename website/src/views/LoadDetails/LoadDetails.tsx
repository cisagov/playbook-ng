import { useTitle } from "@/hooks/useTitle";
import { Header } from "@/components/Header/Header";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { TechAdjustment } from "@playbook-ng/shared/src/app/load";
import { Dict } from "@playbook-ng/shared/src/base/types";
import css from "./LoadDetails.module.css";
import { Table } from "react-bootstrap";
import { Item, Template } from "@playbook-ng/shared/src/dataset/types";
import { useContext } from "react";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";

function AdjustmentsForX(args: {
  x: Item | Template;
  adjusts: TechAdjustment[];
}) {
  const { x, adjusts } = args;

  const rows = adjusts.map((a) => (
    <tr key={a.id}>
      <td>{a.id}</td>
      <td>{a.name ?? "-"}</td>
      <td>{a.status}</td>
      <td>{a.reason}</td>
    </tr>
  ));

  const table = (
    <Table striped bordered hover className={css.table}>
      <thead>
        <tr>
          <th>Tech ID</th>
          <th>Tech Name</th>
          <th>Status</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </Table>
  );

  return (
    <div className={css.xAdjusts}>
      <h3 className={css.xAdjustsTitle}>
        {x.name} ({x.id})
      </h3>
      <div className={css.table_wrapper}>{table}</div>
    </div>
  );
}

function AdjustmentsForType(args: {
  type: string;
  typeLUT: Dict<Item> | Dict<Template>;
  adjustLUT: Dict<TechAdjustment[]>;
}) {
  const { type, typeLUT, adjustLUT } = args;

  const ids = Object.entries(adjustLUT)
    .filter(([_id, adjusts]) => adjusts.length > 0)
    .map(([id, _adjusts]) => id);

  const anyAdjusted = ids.length > 0;

  return (
    <div className={css.typeAdjusts}>
      <h2 className={css.typeAdjustsTitle}>{type} Adjustments</h2>
      {anyAdjusted ? (
        ids.map((id) => (
          <AdjustmentsForX key={id} x={typeLUT[id]} adjusts={adjustLUT[id]} />
        ))
      ) : (
        <p>No {type}s needed their Technique mappings adjusted.</p>
      )}
    </div>
  );
}

export function LoadDetails() {
  useTitle("Load Details");

  const adjusts = useAppSelector((s) => s.loadinfo.datasetAdjusts);
  const itemName = useAppSelector((s) => s.appdata.dataset.item_type);

  const { itemLUT, templateLUT } = useContext(DataLUTsContext);

  return (
    <>
      <Header
        title="Details on Dataset Loading"
        body={
          <p>
            When loading a Dataset - the mappings of {itemName}s / Templates are
            adjusted for Techniques that are: unknown, deprecated, or revoked.
            <br />
            When Templates have unknown / deprecated Techniques removed, the{" "}
            {itemName}s mapped under those Techniques are placed into Additional{" "}
            {itemName}s.
          </p>
        }
      />

      <AdjustmentsForType
        type={itemName}
        typeLUT={itemLUT}
        adjustLUT={adjusts.item}
      />

      <AdjustmentsForType
        type="Template"
        typeLUT={templateLUT}
        adjustLUT={adjusts.tmpl}
      />
    </>
  );
}
