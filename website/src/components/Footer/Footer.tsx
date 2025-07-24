import css from "./Footer.module.css";
import { Container } from "react-bootstrap";
import { IN_PROD } from "@/code/buildtime-config";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { Link } from "react-router-dom";
import { useShortDatasetName } from "@playbook-ng/shared-web/src/hooks/useShortDatasetName";
import {
  ATTACK_DOMAIN_DISPLAY,
  AttackDomainPlain,
} from "@playbook-ng/shared/src/attack/objects";

export function Footer() {
  const loaded = useAppSelector((s) => s.loadinfo.dataLoaded);
  const { attack, dataset } = loaded;

  const attackInfo: string[] = [];
  Object.entries(attack).forEach(([domain, version]) => {
    if (version !== null) {
      const name = ATTACK_DOMAIN_DISPLAY[domain as AttackDomainPlain];
      attackInfo.push(`${name} ${version}`);
    }
  });

  const datasetName = useShortDatasetName();
  const datasetInfo = `[${datasetName} ${dataset.version}]`;

  return (
    <footer className={`${css.footer}`}>
      <Container>
        <span>
          <strong>ATT&amp;CK Loaded:</strong> [{attackInfo.join(" | ")}]
        </span>
        <br />
        <span>
          <strong>Dataset Loaded:</strong> {datasetInfo}{" "}
          <Link to="/load-details" className={css.link}>
            See Details &rarr;
          </Link>
        </span>
        {!IN_PROD ? (
          <span>
            <br />
            <Link to="/md-test" className={css.link}>
              MD Render Test
            </Link>
          </span>
        ) : null}
      </Container>
    </footer>
  );
}
