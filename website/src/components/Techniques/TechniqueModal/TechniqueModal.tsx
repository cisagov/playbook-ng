import css from "./TechniqueModal.module.css";
import { Row, Col } from "react-bootstrap";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import {
  Technique,
  Tactic,
  Tech_getTactics,
  AttackRelationship,
  ExtRef,
  Tech_getBaseAndSubs,
  Tech_getProcedureBreakdown,
} from "@playbook-ng/shared/src/attack/objects";
import { renderCitations } from "@playbook-ng/shared/src/base/utils/rendering";
import { TechItemModalBase } from "@/components/TechItemModalBase/TechItemModalBase";
import { TechAndSubButtons } from "./TechAndSubButtons/TechAndSubButtons";
import { Markdown } from "@playbook-ng/shared-web/src/components/Markdown/Markdown";
import { TechMetaDataBox } from "../TechMetaDataBox/TechMetaDataBox";
import { TechModalControlContext } from "@/contexts/TechModalControlContext";
import { TechAddToBookButton } from "../TechAddToBookButton/TechAddToBookButton";

function TacticButton(args: {
  tactic: Tactic;
  active: boolean;
  setActive: (tactic: Tactic) => void;
}) {
  const { tactic, active, setActive } = args;
  const activeClass = active ? css.selected_list_item : "";
  const makeActive = useCallback(() => setActive(tactic), [setActive, tactic]);

  return (
    <button
      type="button"
      className={`${css.tactic_list_item} ${activeClass}`}
      disabled={active}
      aria-current={active}
      onClick={makeActive}
    >
      {tactic.name}
    </button>
  );
}

function TacticInfo(args: { tact: Tactic }) {
  const { tact } = args;
  const descMD = useMemo(
    () => renderCitations(tact.description, tact.external_references),
    [tact.description, tact.external_references]
  );

  return (
    <>
      <div className={css.tactic_content_title_row}>
        <h4 className={css.tactic_content_title}>
          <span className="visually-hidden">Current Tactic:</span> {tact.name} (
          {tact.attackId})
        </h4>
      </div>
      <div className={css.tactic_content_link_row}>
        <a
          className={css.tactic_content_link}
          href={tact.attackUrl}
          target="_blank"
          rel="noreferrer"
        >
          View on ATT&amp;CK
        </a>
      </div>
      <Markdown md={descMD} />
    </>
  );
}

function TheAssociatedTactics(args: { tech: Technique }) {
  const { tech } = args;
  const attack = useAppSelector((s) => s.appdata.attack);
  const tactics = useMemo(() => Tech_getTactics(attack, tech), [attack, tech]);

  const [activeTact, setActiveTact] = useState<Tactic>(tactics[0]);
  useEffect(() => setActiveTact(tactics[0]), [tactics]);

  return (
    <Col xs={12} className={css.technique_modal_section}>
      <Row className={css.section_header}>
        <Col xs={12} className={css.section_title_col}>
          <h3 className={css.section_title}>Associated Tactics</h3>
        </Col>
      </Row>
      <Row className={css.section_content}>
        <Col xs={12} lg={3} className={css.tactic_list}>
          <h4 className="visually-hidden">Pick a Tactic</h4>
          {tactics.map((tact) => (
            <TacticButton
              key={tact.id}
              tactic={tact}
              active={activeTact.id === tact.id}
              setActive={setActiveTact}
            />
          ))}
        </Col>
        <Col xs={12} lg={9} className={css.tactic_content}>
          <TacticInfo tact={activeTact} />
        </Col>
      </Row>
    </Col>
  );
}

export function TechniqueModal(args: { tech: Technique }) {
  const { tech } = args;
  const { close, open } = useContext(TechModalControlContext);

  const attack = useAppSelector((s) => s.appdata.attack);

  const techNeighbors = useMemo(
    () => Tech_getBaseAndSubs(attack, tech),
    [attack, tech]
  );
  const baseTechAndSubs: Technique[] = [
    techNeighbors.base,
    ...techNeighbors.subs,
  ];

  // if tech IS a sub-tech or HAS sub-techs
  const showTechTree = techNeighbors.subs.length > 0;

  const descMD = useMemo(
    () => renderCitations(tech.description, tech.external_references),
    [tech.description, tech.external_references]
  );

  return (
    <TechItemModalBase
      id={tech.attackId}
      name={tech.name}
      type="tech"
      url={tech.attackUrl}
      datasetName="ATT&CK"
      onClose={close}
    >
      <Row>
        {/* Description + Add + Metadata */}
        <Col xs={12} className={css.technique_modal_section}>
          <Row className={css.section_header}>
            <Col xs={12} lg={4} className={css.technique_modal_add_button_col}>
              <TechAddToBookButton tech={tech} />
            </Col>
          </Row>
          <Row className={css.section_content}>
            <Col xs={12} lg={8} className={css.description_section}>
              <h3 className={`${css.section_title} mb-3`}>Description</h3>
              <Markdown md={descMD} />
            </Col>
            <Col xs={12} lg={4} className={css.description_section_metadata}>
              <h3 className="visually-hidden">Metadata</h3>
              <TechMetaDataBox
                tech={tech}
                subtechsMode="count"
                tacticsMode="count"
              />
            </Col>
          </Row>
        </Col>

        {/* Tech + Subs */}
        {showTechTree ? (
          <Col xs={12} className={css.technique_modal_section}>
            <Row className={css.section_header}>
              <Col xs={12} className={css.section_title_col}>
                <h3 className={css.section_title}>
                  Technique & Sub-Techniques
                </h3>
              </Col>
            </Row>
            <Row className={css.section_content}>
              <Col lg={12} className={css.technique_and_subtechniques_section}>
                <TechAndSubButtons
                  techs={baseTechAndSubs}
                  activeId={tech.attackId}
                  onClick={open}
                />
              </Col>
            </Row>
          </Col>
        ) : null}
        <TheAssociatedTactics tech={tech} />
        <TheProcedureExamples tech={tech} />
      </Row>
    </TechItemModalBase>
  );
}

function TheProcedureExamples(args: { tech: Technique }) {
  const { tech } = args;
  const attack = useAppSelector((s) => s.appdata.attack);
  const examples = useMemo(() => {
    const procedures = Tech_getProcedureBreakdown(attack, tech);
    return [
      ...procedures.tool,
      ...procedures.malware,
      ...procedures.group,
      ...procedures.campaign,
    ];
  }, [attack, tech]);

  return (
    <Col xs={12} className={css.technique_modal_section}>
      <Row className={css.section_header}>
        <Col xs={12} className={css.section_title_col}>
          <h3 className={css.section_title}>Procedure Examples</h3>
        </Col>
      </Row>
      {examples.length ? (
        <Row className={css.section_content}>
          <Col lg={12} className={css.examples_section} role="table">
            <Row className={css.example_row_header} role="row">
              <Col lg={8} role="columnheader" aria-sort="none">
                <p>Description</p>
              </Col>
              <Col lg={4} role="columnheader" aria-sort="none">
                <p>Source(s)</p>
              </Col>
            </Row>
            {examples.map((ex) => (
              <UsageExampleRow example={ex} key={ex.id} />
            ))}
          </Col>
        </Row>
      ) : (
        "No Examples Found"
      )}
    </Col>
  );
}

function getExampleCitations(
  ex: AttackRelationship
): { text: string; url?: string }[] {
  const citations: { text: string; url?: string }[] = [];
  ex.external_references?.forEach((ext_ref: ExtRef) => {
    citations.push({
      text: ext_ref.source_name,
      url: ext_ref.url,
    });
  });
  return citations;
}

function UsageExampleRow(args: { example: AttackRelationship }) {
  const { example } = args;

  const descMD = useMemo(
    () => renderCitations(example.description, false),
    [example.description]
  );

  return (
    <Row className={css.example_row} role="row">
      <Col xs={12} lg={8} className={css.example_description_col} role="cell">
        <Markdown md={descMD} />
      </Col>
      <Col xs={12} lg={4} className={css.example_sources} role="cell">
        {getExampleCitations(example).map((citation) => {
          return (
            <a
              key={example.id + citation.text}
              className={css.example_source}
              href={citation.url}
              target="_blank"
              rel="noreferrer"
            >
              {citation.text}
            </a>
          );
        })}
      </Col>
    </Row>
  );
}
