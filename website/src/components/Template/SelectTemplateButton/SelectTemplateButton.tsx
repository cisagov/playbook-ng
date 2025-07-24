import { Template } from "@playbook-ng/shared/src/dataset/types";
import { Button } from "react-bootstrap";
import css from "./SelectTemplateButton.module.css";
import { useStartTemplatePlaybook } from "@/hooks/useStartTemplatePlaybook";

export function SelectTemplateButton(args: {
  template: Template;
  disabled?: boolean;
}) {
  const { template } = args;
  const startPlaybook = useStartTemplatePlaybook(template);

  const disabled = args.disabled ?? false;

  return (
    <Button className={css.button} disabled={disabled} onClick={startPlaybook}>
      <span className={css.text}>Select Template</span>
    </Button>
  );
}
