import { useAddToPlaybook } from "@/hooks/useAddToPlaybook";
import { useInPlaybook } from "@/hooks/useInPlaybook";
import { ButtonNA } from "@playbook-ng/shared-web/src/components/ButtonNA/ButtonNA";
import { Technique } from "@playbook-ng/shared/src/attack/objects";
import { BsPlusSquareFill } from "react-icons/bs";
import css from "./TechAddToBookButton.module.css";

export function TechAddToBookButton(args: { tech: Technique }) {
  const { tech } = args;

  const inPlaybook = useInPlaybook({ tech });
  const addToPlaybook = useAddToPlaybook({ tech });

  return (
    <ButtonNA
      variant="primary"
      className={css.button}
      onClick={addToPlaybook}
      disabled={inPlaybook}
    >
      {inPlaybook ? (
        <>in playbook</>
      ) : (
        <>
          <span className={css.icon}>
            <BsPlusSquareFill className={`bs-svg`} aria-hidden="true" />
          </span>{" "}
          add to playbook
        </>
      )}
    </ButtonNA>
  );
}
