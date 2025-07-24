import { useContext, useMemo } from "react";
import { ItemAndTech } from "@playbook-ng/shared/src/dataset/types";
import { indentMdHeadings } from "@playbook-ng/shared/src/base/utils/rendering";
import { useShortDatasetName } from "@playbook-ng/shared-web/src/hooks/useShortDatasetName";
import { TechItemModalBase } from "@/components/TechItemModalBase/TechItemModalBase";
import { Markdown } from "@playbook-ng/shared-web/src/components/Markdown/Markdown";
import { ItemModalControlContext } from "@/contexts/ItemModalControlContext";
import { ItemAddToBookButton } from "../ItemAddToBookButton/ItemAddToBookButton";

export function ItemModal(args: { itemAndTech: ItemAndTech }) {
  const { itemAndTech } = args;
  const { item, techId: mapUnderId } = itemAndTech;

  const { close } = useContext(ItemModalControlContext);

  const addButtonPresent = mapUnderId === "unmapped";

  const shortDatasetName = useShortDatasetName();

  const md = useMemo(() => indentMdHeadings(item.content, 1), [item.content]);

  return (
    <TechItemModalBase
      id={item.id}
      name={item.name}
      type="item"
      url={item.url}
      datasetName={shortDatasetName}
      onClose={close}
    >
      {/* Add Button */}
      {addButtonPresent ? (
        <div className="d-flex justify-content-end mb-2">
          <ItemAddToBookButton itemAndTech={itemAndTech} />
        </div>
      ) : null}

      {/* MD Content */}
      <Markdown md={md} />
    </TechItemModalBase>
  );
}
