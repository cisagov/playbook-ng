import css from "./Home.module.css";
import { Row, Col, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  BsExclamationTriangleFill,
  BsFileEarmarkArrowUpFill,
  BsJournals,
  BsPencilFill,
} from "react-icons/bs";
import { useCallback } from "react";
import { useTitle } from "@/hooks/useTitle";
import { Header } from "@/components/Header/Header";
import { usePlaybookOpen } from "@/hooks/usePlaybookOpen";
import { useStartNewPlaybook } from "@/hooks/useStartNewPlaybook";
import { Section } from "@/components/Generic/Section";
import { useImportPlaybook } from "@/hooks/useImportPlaybook";
import { ButtonNA } from "@playbook-ng/shared-web/src/components/ButtonNA/ButtonNA";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";

export function Home() {
  useTitle("Home");
  const playbookOpen = usePlaybookOpen();
  const warningOn = useAppSelector((s) => s.sessconf.playbookStatusWarningEn);

  return (
    <>
      <Header
        title="Rapid Remediation Playbooks at Your Fingertips"
        body={
          <p>
            Playbook-NG enables IR teams to quickly turn observed behaviors into
            remediation plans
          </p>
        }
      />
      <Row className={css.choices_row}>
        <PlaybookOpenWarning show={playbookOpen && warningOn} />

        <Col as={Section} xs={12} md={4} className={css.choice_col}>
          <NewPlaybook />
        </Col>

        <Col as={Section} xs={12} md={4} className={css.choice_col}>
          <FromTemplate />
        </Col>

        <Col as={Section} xs={12} md={4} className={css.choice_col}>
          <ImportExisting />
        </Col>
      </Row>
    </>
  );
}

function PlaybookOpenWarning(args: { show: boolean }) {
  const { show } = args;

  const navigate = useNavigate();
  const goToReview = useCallback(() => navigate("/playbook"), [navigate]);

  if (!show) {
    return null;
  }
  return (
    <Alert variant="warning" className={css.playbook_open_alert}>
      <div>
        <BsExclamationTriangleFill className={`bs-svg`} aria-hidden="true" />{" "}
        The current Playbook must be cleared or exported before starting a new
        one
      </div>
      <Button variant="primary" size="sm" onClick={goToReview}>
        Go to Playbook
      </Button>
    </Alert>
  );
}

function NewPlaybook() {
  const playbookOpen = usePlaybookOpen();
  const warningOn = useAppSelector((s) => s.sessconf.playbookStatusWarningEn);
  const startNewPlaybook = useStartNewPlaybook();

  return (
    <>
      <div className={css.choice_icon}>
        <BsPencilFill className={`bs-svg`} aria-hidden="true" />
      </div>
      <h2 className={css.choice_label}>start a new playbook</h2>
      <p className={css.choice_description}>
        <span className={css.choice_desc_em}>
          Start from a completely clean slate.
        </span>{" "}
        Build a new playbook based on the ATT&amp;CK Techniques that you&apos;ve
        observed in your own environment or are aware of based on cyber threat
        intelligence.
      </p>
      <ButtonNA
        disabled={playbookOpen && warningOn}
        variant="primary"
        className={css.choice_button}
        onClick={startNewPlaybook}
      >
        start from scratch
      </ButtonNA>
    </>
  );
}

function FromTemplate() {
  const playbookOpen = usePlaybookOpen();
  const warningOn = useAppSelector((s) => s.sessconf.playbookStatusWarningEn);
  const navigate = useNavigate();
  const gotoTemplatesPage = useCallback(
    () => navigate("/templates"),
    [navigate]
  );

  return (
    <>
      <div className={css.choice_icon}>
        <BsJournals className={`bs-svg`} aria-hidden="true" />
      </div>
      <h2 className={css.choice_label}>browse common templates</h2>
      <p className={css.choice_description}>
        <span className={css.choice_desc_em}>
          Browse our evolving library of common cyber attacks.
        </span>{" "}
        Templates provide a pre-built mapping of ATT&CK Techniques to
        countermeasures for a particular type of threat, such as Ransomware.
      </p>
      <ButtonNA
        disabled={playbookOpen && warningOn}
        variant="primary"
        className={css.choice_button}
        onClick={gotoTemplatesPage}
      >
        create from a template
      </ButtonNA>
    </>
  );
}

function ImportExisting() {
  const playbookOpen = usePlaybookOpen();
  const warningOn = useAppSelector((s) => s.sessconf.playbookStatusWarningEn);
  const importBtnOnClick = useImportPlaybook();

  return (
    <>
      <div className={css.choice_icon}>
        <BsFileEarmarkArrowUpFill className={`bs-svg`} aria-hidden="true" />
      </div>
      <h2 className={css.choice_label}>import existing playbook</h2>
      <p className={css.choice_description}>
        <span className={css.choice_desc_em}>
          Continue working on an existing playbook.
        </span>{" "}
        Existing playbooks built with PlaybookNG can be loaded and updated as
        needed.
      </p>
      <ButtonNA
        disabled={playbookOpen && warningOn}
        variant="primary"
        className={css.choice_button}
        onClick={importBtnOnClick}
      >
        import existing
      </ButtonNA>
    </>
  );
}
