import { EditingContext } from "@/contexts/EditingContext";
import { ValSet, ValSetContext } from "@/contexts/ValSetContext";
import { useCallback, useContext, useEffect, useId, useRef } from "react";
import { Tab, Tabs } from "react-bootstrap";
import css from "./MDEditor.module.css";
import { Label } from "../Label/Label";
import { Markdown } from "@playbook-ng/shared-web/src/components/Markdown/Markdown";

/** A Smart textarea that Auto-Sizes Height */
function AutosizeTextArea(args: { id: string }) {
  const { id } = args;

  const { val, set } = useContext(ValSetContext) as ValSet<string>;

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => set(e.target.value),
    [set]
  );

  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "inherit";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [val]);

  return (
    <textarea
      id={id}
      className={css.textarea}
      ref={ref}
      value={val}
      onChange={onChange}
    />
  );
}

/**
 * Markdown Editor
 *
 * - Allows editing / rendering markdown val: string (of current ValSetContext)
 * - In editing mode, allows switching between editor + MD preview
 */
export function MDEditor() {
  const { val } = useContext(ValSetContext) as ValSet<string>;
  const editing = useContext(EditingContext);

  if (typeof val !== "string") {
    throw new Error(`MDEditor given non-string val ${val}`);
  }

  const inputId = useId();
  const tabsId = useId();

  const viewer = <Markdown md={val} />;

  let inner = null;

  if (editing) {
    inner = (
      <Tabs id={tabsId} defaultActiveKey="edit">
        <Tab eventKey="edit" title="Markdown" className={css.tab}>
          <Label htmlFor={inputId} />
          <AutosizeTextArea id={inputId} />
        </Tab>
        <Tab eventKey="view" title="Preview" className={css.tab}>
          {viewer}
        </Tab>
      </Tabs>
    );
  } else {
    inner = viewer;
  }

  return <div>{inner}</div>;
}
