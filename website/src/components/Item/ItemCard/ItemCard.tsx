import { Button, Col, Row } from "react-bootstrap";
import css from "./ItemCard.module.css";
import { useCallback, useContext, useMemo } from "react";
import { renderMD } from "@playbook-ng/shared/src/base/utils/rendering";
import { ItemAndTech } from "@playbook-ng/shared/src/dataset/types";
import { getFirstParagraphText } from "@playbook-ng/shared-web/src/code/rendering";
import { useShortDatasetName } from "@playbook-ng/shared-web/src/hooks/useShortDatasetName";
import { BoldMatch } from "@/components/Search/BoldMatch";
import { ItemModalControlContext } from "@/contexts/ItemModalControlContext";
import { ItemAddToBookButton } from "../ItemAddToBookButton/ItemAddToBookButton";

type Match = {
  [K in "id" | "name" | "desc"]: string[];
};

function descUniqueMatches(match: Match): string[] {
  const { id, name, desc } = match;
  const terms = new Set<string>(desc);
  for (const t of id) terms.delete(t);
  for (const t of name) terms.delete(t);
  return Array.from(terms);
}

export function ItemCard(args: { itemAndTech: ItemAndTech; match: Match }) {
  const { itemAndTech, match } = args;
  const { item } = itemAndTech;

  const shortDatasetName = useShortDatasetName();

  const { open } = useContext(ItemModalControlContext);
  const openModal = useCallback(() => open(itemAndTech), [open, itemAndTech]);

  const descOnlyMatches = useMemo(() => descUniqueMatches(match), [match]);

  const firstParagraph = useMemo(() => {
    const md = item.content;
    const html = renderMD(md);
    const para = getFirstParagraphText(html);
    return para;
  }, [item.content]);

  const siteLink =
    item.url === null ? null : (
      <Col className={`text-end ${css.header_link_col}`}>
        <a
          className={css.header_link}
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          View on {shortDatasetName}
        </a>
      </Col>
    );

  return (
    <section className={`${css.card}`}>
      {/* Header */}
      <Row className={css.header}>
        {/* Name (ID) */}
        <Col xs="auto" className={css.title_col}>
          <h4 className={css.title}>
            <BoldMatch text={item.name} search={match.name} /> (
            <BoldMatch text={item.id} search={match.id} />)
          </h4>
        </Col>

        {/* Link */}
        {siteLink}
      </Row>

      {/* Body */}
      <div className={css.body}>
        <Row>
          {/* Desc + More Info */}
          <Col lg={8} className={css.body_text_container}>
            <div className={css.body_text}>
              <p>{firstParagraph}</p>
              {descOnlyMatches.length > 0 ? (
                <p>
                  <strong>Matches:</strong> {descOnlyMatches.join(", ")}
                </p>
              ) : null}
            </div>

            <Button
              variant="link"
              onClick={openModal}
              className={css.more_info_button}
            >
              More Info...
            </Button>
          </Col>

          {/* Add Button */}
          <Col lg={4} className={css.body_buttons}>
            <ItemAddToBookButton itemAndTech={itemAndTech} />
          </Col>
        </Row>
      </div>
    </section>
  );
}
