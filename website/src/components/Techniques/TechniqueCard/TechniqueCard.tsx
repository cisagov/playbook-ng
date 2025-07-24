import css from "./TechniqueCard.module.css";
import { useCallback, useContext, useMemo } from "react";
import { Button, Row, Col } from "react-bootstrap";
import { Technique } from "@playbook-ng/shared/src/attack/objects";
import { getfirstSentenceText } from "@playbook-ng/shared-web/src/code/rendering";
import { BoldMatch } from "@/components/Search/BoldMatch";
import { TechModalControlContext } from "@/contexts/TechModalControlContext";
import { TechAddToBookButton } from "../TechAddToBookButton/TechAddToBookButton";

type Match = {
  [K in "id" | "baseName" | "name" | "desc"]: string[];
};

function descUniqueMatches(match: Match): string[] {
  const { id, baseName, name, desc } = match;
  const terms = new Set<string>(desc);
  for (const t of id) terms.delete(t);
  for (const t of baseName) terms.delete(t);
  for (const t of name) terms.delete(t);
  return Array.from(terms);
}

export function TechniqueCard(args: { tech: Technique; match: Match }) {
  const { tech, match } = args;

  const { open } = useContext(TechModalControlContext);
  const openModal = useCallback(() => open(tech), [open, tech]);

  const descOnlyMatches = useMemo(() => descUniqueMatches(match), [match]);

  const descSnippet = useMemo(
    () => getfirstSentenceText(tech.description),
    [tech.description]
  );

  return (
    <section className={css.card}>
      {/* Header */}
      <Row className={css.header}>
        {/* Tech Name (Tech ID) */}
        <Col xs="auto" className={css.title_col}>
          {tech.name.base !== null ? (
            <>
              <span className={css.pre_title}>
                <BoldMatch text={tech.name.base} search={match.baseName} />
              </span>
              <br />
            </>
          ) : null}
          <h4 className={css.title}>
            <BoldMatch text={tech.name.self} search={match.name} /> (
            <BoldMatch text={tech.attackId} search={match.id} />)
          </h4>
        </Col>

        {/* View on Att&ck link */}
        <Col className={`text-end ${css.header_link_col}`}>
          <a
            className={css.header_link}
            href={tech.attackUrl}
            target="_blank"
            rel="noreferrer"
          >
            View on ATT&amp;CK
          </a>
        </Col>
      </Row>

      {/* Body */}
      <div className={css.body}>
        <Row>
          <Col lg={8} className={css.body_text_container}>
            {/* Description */}
            <div className={css.body_text}>
              <p>{descSnippet}</p>
              {descOnlyMatches.length > 0 ? (
                <p>
                  <strong>Matches:</strong> {descOnlyMatches.join(", ")}
                </p>
              ) : null}
            </div>
            {/* More Info... */}
            <Button
              className={css.more_info_button}
              variant="link"
              onClick={openModal}
            >
              More Info...
            </Button>
          </Col>
          <Col lg={4} className={css.body_buttons}>
            <TechAddToBookButton tech={tech} />
          </Col>
        </Row>
      </div>
    </section>
  );
}
