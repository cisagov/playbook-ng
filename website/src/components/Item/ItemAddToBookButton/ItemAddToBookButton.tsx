import { ItemAndTech } from "@playbook-ng/shared/src/dataset/types";
import css from "./ItemAddToBookButton.module.css";
import { ButtonNA } from "@playbook-ng/shared-web/src/components/ButtonNA/ButtonNA";
import { useAddToPlaybook } from "@/hooks/useAddToPlaybook";
import { useInPlaybook } from "@/hooks/useInPlaybook";
import { BsPlusSquareFill } from "react-icons/bs";
import { useIsIgnored } from "@/hooks/useIsIgnored";

export function ItemAddToBookButton(args: { itemAndTech: ItemAndTech }) {
  const { itemAndTech } = args;

  const inPlaybook = useInPlaybook({ itemAndTech });
  const addToPlaybook = useAddToPlaybook({ itemAndTech });

  const isIgnored = useIsIgnored(itemAndTech.item.id);
  const variant = isIgnored ? "warning" : "primary";

  return (
    <ButtonNA
      variant={variant}
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
          <br />
          {isIgnored ? (
            <span className={css.ignored_text}>(also un-ignores this)</span>
          ) : null}
        </>
      )}
    </ButtonNA>
  );
}
