import css from "./ButtonCollapsePanel.module.css";
import { useBool } from "@/hooks/useBool";
import { useId } from "react";
import { Button, Collapse } from "react-bootstrap";
import { BsChevronDown, BsChevronRight } from "react-icons/bs";

function PassThrough(args: { children: React.ReactNode }) {
  const { children } = args;
  return children;
}

export function ButtonCollapsePanel(args: {
  btnWrap?: (args: { children: React.ReactNode }) => React.ReactNode;
  btnText: React.ReactNode;
  children: React.ReactNode;
  variant?: string;
}) {
  const { btnText, children } = args;
  const variant = args.variant ?? "outline-primary";

  const ButtonWrapper = args.btnWrap ?? PassThrough;

  // v-- button click controls this - instantly updates collapse
  const expanded = useBool(false);
  // v-- collapse callbacks update button appearance
  const btnExpanded = useBool(false);

  const bodyId = useId();

  return (
    <div className={css.root}>
      <ButtonWrapper>
        <Button
          variant={variant}
          className={`${css.header_btn} ${btnExpanded.val ? css.open : ""}`}
          onClick={expanded.toggle}
          aria-controls={bodyId}
          aria-expanded={expanded.val}
          active={btnExpanded.val}
        >
          {btnText}{" "}
          {expanded.val ? (
            <BsChevronDown className={`bs-svg`} aria-hidden="true" />
          ) : (
            <BsChevronRight className={`bs-svg`} aria-hidden="true" />
          )}
        </Button>
      </ButtonWrapper>

      <Collapse
        className={css.collapse}
        in={expanded.val}
        onEnter={btnExpanded.setTrue}
        onExited={btnExpanded.setFalse}
      >
        <div id={bodyId}>
          <div className={css.body}>{children}</div>
        </div>
      </Collapse>
    </div>
  );
}
