import { RefAttributes } from "react";
import { JSX } from "react/jsx-runtime";
import css from "./InfoTooltip.module.css";
import { OverlayTrigger, Tooltip, TooltipProps } from "react-bootstrap";
import { BsInfoCircle } from "react-icons/bs";

function tooltipOverlay(text: string) {
  const component = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => {
    return <Tooltip {...props}>{text}</Tooltip>;
  };

  return component;
}

export function InfoTooltip(args: { text: string }) {
  const { text } = args;
  return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 250, hide: 400 }}
      overlay={tooltipOverlay(text)}
    >
      <span tabIndex={0} style={{ display: "inline-block" }}>
        <BsInfoCircle className={`${css.tooltip_icon} bs-svg`} />
      </span>
    </OverlayTrigger>
  );
}
