import { indentMdHeadings } from "@playbook-ng/shared/src/base/utils/rendering";
import { Template } from "@playbook-ng/shared/src/dataset/types";
import { templateExtendedDesc } from "@playbook-ng/shared/src/dataset/utils";
import { useMemo } from "react";
import { SelectTemplateButton } from "../SelectTemplateButton/SelectTemplateButton";
import { Markdown } from "@playbook-ng/shared-web/src/components/Markdown/Markdown";
import css from "./TemplateModalContent.module.css";

export function TemplateModalContent(args: {
  template: Template;
  disableSelectBtn?: boolean;
}) {
  const { template } = args;
  const disableSelectBtn = args.disableSelectBtn ?? false;

  const md = useMemo(() => {
    const desc = templateExtendedDesc(template);
    return indentMdHeadings(desc, 2);
  }, [template]);

  return (
    <div>
      <div className={css.select_btn_wrapper}>
        <SelectTemplateButton template={template} disabled={disableSelectBtn} />
      </div>
      <Markdown md={md} />
    </div>
  );
}
