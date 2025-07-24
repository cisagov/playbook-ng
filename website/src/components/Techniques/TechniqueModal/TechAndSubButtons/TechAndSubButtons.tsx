import { Technique } from "@playbook-ng/shared/src/attack/objects";
import { useCallback } from "react";
import { Button, Stack } from "react-bootstrap";
import { BsCaretRightFill } from "react-icons/bs";
import css from "./TechAndSubButtons.module.css";

function SwitchTechButton(args: {
  tech: Technique;
  isSelected: boolean;
  onClick: (tech: Technique) => void;
}) {
  const { tech, isSelected, onClick } = args;

  const handleClick = useCallback(() => onClick(tech), [onClick, tech]);

  return (
    <Button
      className={css.button}
      onClick={handleClick}
      disabled={isSelected}
      aria-current={isSelected}
      variant="link"
    >
      <Stack direction="horizontal" className={css.stack}>
        <span className={css.id} aria-label={tech.attackId}>
          {isSelected ? (
            <BsCaretRightFill className={`bs-svg`} aria-hidden={true} />
          ) : null}
          {tech.attackId.split(".").at(-1)}
        </span>
        <span className={css.name}>{tech.name.self}</span>
      </Stack>
    </Button>
  );
}

export function TechAndSubButtons(args: {
  techs: Technique[];
  activeId: string;
  onClick: (tech: Technique) => void;
}) {
  const { techs, activeId, onClick } = args;
  return (
    <ol className={css.list}>
      {techs.map((t) => (
        <li key={t.attackId} className={css.list_item}>
          <SwitchTechButton
            tech={t}
            isSelected={t.attackId === activeId}
            onClick={onClick}
          />
        </li>
      ))}
    </ol>
  );
}
