import {
  useAppDispatch,
  useAppSelector,
} from "@playbook-ng/shared-web/src/store/hooks";
import css from "./TechMetaDataBox.module.css";
import {
  ATTACK_DOMAIN_DISPLAY,
  Tech_getPlatformNames,
  Tech_getSubTechs,
  Tech_getTactics,
  Technique,
} from "@playbook-ng/shared/src/attack/objects";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { Form } from "react-bootstrap";
import { useCallback, useId, useMemo } from "react";
import { timeISO2DMY } from "@playbook-ng/shared/src/base/utils/time";
import {
  t_TechConfidence,
  TECH_CONFIDENCE_LEVELS,
} from "@playbook-ng/shared/src/dataset/constants";
import { setTechConfidence } from "@playbook-ng/shared-web/src/store/playbookSlice";
import { TechToItemVal } from "@playbook-ng/shared/src/dataset/types";

/** **ID:** {tech.attackId} ({tech.url} link optional) */
function ID(args: { tech: Technique; hasLink?: boolean }) {
  const { tech } = args;
  const hasLink = args.hasLink ?? false;

  const iconLink = (
    <a
      href={tech.attackUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`View ${tech.attackId} on Attack`}
    >
      <BsBoxArrowUpRight className={`bs-svg ms-1`} aria-hidden={true} />
    </a>
  );

  return (
    <>
      <strong className={css.label}>ID:</strong> {tech.attackId}
      {hasLink ? <> {iconLink}</> : null}
    </>
  );
}

/** **Sub-Techniques:** # | name, name, .. */
function SubTechniques(args: { tech: Technique; mode: "names" | "count" }) {
  const { tech, mode } = args;
  const attack = useAppSelector((s) => s.appdata.attack);
  const subs = useMemo(() => Tech_getSubTechs(attack, tech), [attack, tech]);
  const display = useMemo(() => {
    if (mode === "names")
      return (
        subs.map((s) => `${s.name.self} (${s.attackId})`).join(", ") || "None"
      );
    else if (mode === "count") return subs.length || "None";
    else return "-";
  }, [mode, subs]);
  return (
    <>
      <strong className={css.label}>Sub-Techniques:</strong> {display}
    </>
  );
}

/** **Tactics:** # | name, name, .. */
function Tactics(args: { tech: Technique; mode: "names" | "count" }) {
  const { tech, mode } = args;
  const attack = useAppSelector((s) => s.appdata.attack);
  const tactics = useMemo(() => Tech_getTactics(attack, tech), [attack, tech]);
  const display = useMemo(() => {
    if (mode === "names")
      return (
        tactics.map((t) => `${t.name} (${t.attackId})`).join(", ") || "None"
      );
    else if (mode === "count") return tactics.length || "None";
    else return "-";
  }, [mode, tactics]);
  return (
    <>
      <strong className={css.label}>Tactics:</strong> {display}
    </>
  );
}

/** **Platforms:** name, name, .. */
function Platforms(args: { tech: Technique }) {
  const { tech } = args;
  const attack = useAppSelector((s) => s.appdata.attack);
  const platforms = useMemo(
    () => Tech_getPlatformNames(attack, tech),
    [attack, tech]
  );
  const display = useMemo(() => platforms.join(", ") || "None", [platforms]);
  return (
    <>
      <strong className={css.label}>Platforms:</strong> {display}
    </>
  );
}

/** **Domain:** name */
function Domain(args: { tech: Technique }) {
  const { tech } = args;
  const display = ATTACK_DOMAIN_DISPLAY[tech.fromDomain];
  return (
    <>
      <strong className={css.label}>Domain:</strong> {display}
    </>
  );
}

/** **Version:** x.y */
function Version(args: { tech: Technique }) {
  const { tech } = args;
  const display = tech.x_mitre_version;
  return (
    <>
      <strong className={css.label}>Version:</strong> {display}
    </>
  );
}

/** **Created:** dd Month yyyy */
function Created(args: { tech: Technique }) {
  const { tech } = args;
  const display = useMemo(() => timeISO2DMY(tech.created), [tech]);
  return (
    <>
      <strong className={css.label}>Created:</strong> {display}
    </>
  );
}

/** **Modified:** dd Month yyyy */
function Modified(args: { tech: Technique }) {
  const { tech } = args;
  const display = useMemo(() => timeISO2DMY(tech.modified), [tech]);
  return (
    <>
      <strong className={css.label}>Modified:</strong> {display}
    </>
  );
}

/** **Technique Confidence Level:** [ Suspected v ] */
function ConfidenceLevelSelect(args: { tech: Technique }) {
  const { tech } = args;

  const dispatch = useAppDispatch();
  const selectId = useId();

  const tti = useAppSelector((s) => s.playbook.tech_to_items);

  const confidence = useMemo(() => {
    const entry = tti[tech.attackId] as TechToItemVal | undefined;
    if (typeof entry === "undefined")
      throw new Error(
        `ConfidenceLevelSelect used with Tech ${tech.attackId} not in playbook`
      );
    return entry.confidence;
  }, [tech.attackId, tti]);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = tech.attackId;
      const confidence = e.target.value as t_TechConfidence;
      dispatch(setTechConfidence({ id, confidence }));
    },
    [dispatch, tech.attackId]
  );

  return (
    <Form>
      <Form.Label htmlFor={selectId} className={css.label}>
        Technique Confidence Level:
      </Form.Label>
      <Form.Select
        id={selectId}
        className={css.confidence_select}
        onChange={onChange}
        value={confidence}
      >
        {TECH_CONFIDENCE_LEVELS.map((cl) => (
          <option key={`confidence-${cl}`} value={cl}>
            {cl}
          </option>
        ))}
      </Form.Select>
    </Form>
  );
}

/**
 * A Technique Metadata Box
 *
 * Returns border-wrapped unstyled list of data about tech
 * - Displaying the ATT&CK Link / Confidence Selector are optional
 * - SubTech / Tactic displays are configurable
 *
 * Output:
 * - ID            : Tnnnn(.nnn) (ATT&CK link ?) <- hasLink
 * - Sub-Techniques: # | name, name, ..          <- subtechsMode
 * - Tactics       : # | name, name, ..          <- tacticsMode
 * - Platforms     : name, name, ..
 * - Domain        : name
 * - Version       : x.y
 * - Created       : dd Month yyyy
 * - Modified      : dd Month yyyy
 * - (Technique Confidence Level: [ Suspected v] ?) <- hasConfidence
 */
export function TechMetaDataBox(args: {
  tech: Technique;
  hasLink?: boolean;
  hasConfidence?: boolean;
  subtechsMode: Parameters<typeof SubTechniques>[0]["mode"];
  tacticsMode: Parameters<typeof Tactics>[0]["mode"];
}) {
  const { tech, subtechsMode, tacticsMode } = args;

  const hasLink = args.hasLink ?? false;
  const hasConfidence = args.hasConfidence ?? false;

  return (
    <ul className={css.list}>
      <li>
        <ID tech={tech} hasLink={hasLink} />
      </li>
      <li>
        <SubTechniques tech={tech} mode={subtechsMode} />
      </li>
      <li>
        <Tactics tech={tech} mode={tacticsMode} />
      </li>
      <li>
        <Platforms tech={tech} />
      </li>
      <li>
        <Domain tech={tech} />
      </li>
      <li>
        <Version tech={tech} />
      </li>
      <li>
        <Created tech={tech} />
      </li>
      <li>
        <Modified tech={tech} />
      </li>
      {hasConfidence ? (
        <li>
          <ConfidenceLevelSelect tech={tech} />
        </li>
      ) : null}
    </ul>
  );
}
