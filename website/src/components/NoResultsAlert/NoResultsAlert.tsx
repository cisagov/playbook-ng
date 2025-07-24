import { Alert } from "react-bootstrap";
import css from "./NoResultsAlert.module.css";
import { BsExclamationTriangleFill } from "react-icons/bs";

export function NoResultsAlert(args: { className?: string }) {
  const cn = args.className ?? "";

  return (
    <Alert variant="warning" className={`${css.alert} ${cn}`}>
      <BsExclamationTriangleFill className={`bs-svg`} aria-hidden="true" />{" "}
      <strong>Searching / filtering yielded no results</strong>
    </Alert>
  );
}
