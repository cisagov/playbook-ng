import { Button, Stack } from "react-bootstrap";
import css from "./TemplateCard.module.css";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { useCallback, useContext, useMemo } from "react";
import { Template } from "@playbook-ng/shared/src/dataset/types";
import { TemplateModalControlContext } from "@/contexts/TemplateModalControlContext";
import { SelectTemplateButton } from "../SelectTemplateButton/SelectTemplateButton";
import { renderMD } from "@playbook-ng/shared/src/base/utils/rendering";
import { getFirstParagraphText } from "@playbook-ng/shared-web/src/code/rendering";
import {
  ttiItemIDs,
  ttiTechIDs,
} from "@playbook-ng/shared/src/playbook/helpers";

export function TemplateCard(args: {
  titleLevel: number;
  template: Template;
  disableMoreInfo?: boolean;
  disableSelectBtn?: boolean;
}) {
  const { titleLevel, template } = args;
  const disableMoreInfo = args.disableMoreInfo ?? false;
  const disableSelectBtn = args.disableSelectBtn ?? false;

  const { open } = useContext(TemplateModalControlContext);
  const openModal = useCallback(() => open(template), [open, template]);

  const itemType = useAppSelector((s) => s.appdata.dataset.item_type);

  const cardLink =
    template.link === null ? null : (
      <a
        className={css.link}
        href={template.link.url}
        target="_blank"
        rel="noreferrer"
      >
        {template.link.text}
      </a>
    );

  const cardIcon =
    template.iconSrc === null ? null : (
      <img
        className={css.icon}
        src={template.iconSrc}
        aria-hidden="true"
        alt=""
      />
    );

  const numTechs = ttiTechIDs(template.tech_to_items).length;
  const numItems = ttiItemIDs(template.tech_to_items).length;

  const firstParagraph = useMemo(() => {
    const md = template.description;
    const html = renderMD(md);
    const para = getFirstParagraphText(html);
    return para;
  }, [template.description]);

  return (
    <section className={css.card}>
      {/* Header */}
      <div className={css.header}>
        {/* Icon */}
        {cardIcon}

        {/* Text */}
        <Stack direction="vertical">
          <span className={css.title} role="heading" aria-level={titleLevel}>
            {template.name}
          </span>

          {cardLink}

          {/* Tech + Miti Counts */}
          <span className={css.tech_miti_counts}>
            ({numTechs})&nbsp;Techniques
            <span className={css.counts_divider}> | </span>
            <wbr />({numItems})&nbsp;{itemType}s
          </span>
        </Stack>
      </div>

      {/* Body */}
      <div>
        {/* Description */}
        <p className={css.description}>{firstParagraph}</p>

        {/* Buttons */}
        <div className={css.button_wrapper}>
          <Button
            variant="link"
            onClick={openModal}
            className={css.info_button}
            disabled={disableMoreInfo}
          >
            More Info...
          </Button>

          <SelectTemplateButton
            template={template}
            disabled={disableSelectBtn}
          />
        </div>
      </div>
    </section>
  );
}
