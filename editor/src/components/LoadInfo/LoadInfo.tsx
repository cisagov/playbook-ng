import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import css from "./LoadInfo.module.css";
import { useShortDatasetName } from "@playbook-ng/shared-web/src/hooks/useShortDatasetName";
import {
  ATTACK_DOMAIN_DISPLAY,
  AttackDomainPlain,
} from "@playbook-ng/shared/src/attack/objects";

/**
 * Displays Names / Versions of Loaded Datasets
 *
 * - Domain + Version of each loaded ATT&CK dataset
 * - Name + Version of the Item Dataset
 */
export function LoadInfo() {
  const loaded = useAppSelector((s) => s.loadinfo.dataLoaded);

  const attackEntries: string[] = [];
  Object.entries(loaded.attack).forEach(([domain, version]) => {
    if (version !== null) {
      const name = ATTACK_DOMAIN_DISPLAY[domain as AttackDomainPlain];
      attackEntries.push(`${name} ${version}`);
    }
  });
  const attackInfo = attackEntries.join(" | ");

  const datasetName = useShortDatasetName();
  const datasetInfo = `${datasetName} ${loaded.dataset.version}`;

  return (
    <div className={css.root}>
      <span className={css.attack}>
        [<strong>ATT&CK</strong> {attackInfo}]
      </span>
      <br />
      <span className={css.dataset}>
        [<strong>Dataset</strong> {datasetInfo}]
      </span>
    </div>
  );
}
