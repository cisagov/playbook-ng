/**
 * The single Page within the Editor App
 *
 * - Exists within an already-loaded App context
 * - Manages displaying views for unloaded, error, and item states
 * - Manages validation of pasted-in Items
 * - Manages validation of the edited Item before allowing copy-out
 * - Handles accepting + creating wrapping in the Item.content Markdown field
 */

import {
  blankItem,
  EditableItem,
  Item_from_editable,
  Item_to_editable,
  keyToTitle,
} from "@/code/item/editable-view";
import { LoadInfo } from "@/components/LoadInfo/LoadInfo";
import { Item, MappedTech } from "@playbook-ng/shared/src/dataset/types";
import { useCallback, useId, useMemo, useState } from "react";
import { ItemEditor } from "@/components/edit/ItemEditor/ItemEditor";
import { Button, Form, InputGroup, Modal, Stack } from "react-bootstrap";
import css from "./Page.module.css";
import {
  quantity,
  stringsAreUnique,
} from "@playbook-ng/shared/src/base/utils/string";
import { Keyed, unkeyArray } from "@/code/keying";
import { GIT_COMMIT } from "@/code/buildtime-config";
import { LoggingContext } from "@playbook-ng/shared/src/base/utils/logging";
import {
  ajv,
  schemaCheckers,
} from "@playbook-ng/shared/src/schema-checkers.ts";
import { isDateValid } from "@playbook-ng/shared/src/base/utils/time";
import { ModalDialogTrapFocus } from "@playbook-ng/shared-web/src/components/TrapFocus/TrapFocus";
import { escapeMd as esc } from "@playbook-ng/shared/src/base/utils/rendering";

/** Validate a user-pasted Item's schema */
const checkSchema = schemaCheckers.item;

/** Load state of the Item editor */
type State =
  | { name: "unloaded" }
  | { name: "error"; error: string | null }
  | { name: "item"; item: Item };

/** Button that starts a new Item on click */
function LoadNewItem(args: { setItem: (item: Item) => void }) {
  const { setItem } = args;

  const loadNew = useCallback(() => setItem(blankItem()), [setItem]);

  return (
    <div>
      <Button variant="outline-dark" size="sm" onClick={loadNew}>
        New Countermeasure
      </Button>
    </div>
  );
}

/**
 * Input + Button that loads a pasted Item on click
 *
 * - Item.content is more flexible here
 *   - It is normally string
 *   - It also allows string[] here
 *     - This allows manual line-wrapping of the long field within GitHub et al
 *     - string[] is converted to string before schema check
 */
function PasteInItem(args: {
  setError: (error: string | null) => void;
  setItem: (item: Item) => void;
}) {
  const { setError, setItem } = args;

  const inputId = useId();

  const [text, setText] = useState<string>("");

  const textChanged = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value),
    []
  );

  const load = useCallback(() => {
    const ctx = new LoggingContext({});

    try {
      ctx.high("Reading + validating selected Countermeasure");

      ctx.med("Parsing as JSON");
      const item = JSON.parse(text);

      ctx.med("Adjusting content string[] -> string");
      if (typeof item === "object" && !Array.isArray(item) && item !== null) {
        if (Array.isArray(item.content)) {
          let allStrings = true;
          (item.content as unknown[]).forEach((line) => {
            if (typeof line !== "string") {
              allStrings = false;
            }
          });
          if (allStrings) {
            item.content = (item.content as string[]).join("");
          }
        }
      }

      ctx.med("Checking schema");
      if (!checkSchema(item)) {
        const msg = ajv.errorsText(checkSchema.errors);
        throw new Error(msg);
      }

      ctx.med("Checking file content");

      ctx.low("Is .created a valid timestamp?");
      if (!isDateValid(new Date(item.created))) throw new Error("no");

      ctx.low("Is .modified a valid timestamp?");
      if (!isDateValid(new Date(item.modified))) throw new Error("no");

      setItem(item);
    } catch (err) {
      setError(ctx.messageFor(err));
    }
  }, [setError, setItem, text]);

  const inputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && text.length > 0) {
        load();
      }
    },
    [load, text]
  );

  return (
    <div>
      <label htmlFor={inputId}>Paste-In JSON</label>
      <InputGroup>
        <Form.Control
          className={css.paste_in_box}
          size="sm"
          id={inputId}
          placeholder={`{ "id": "CM1234", ... }`}
          value={text}
          onChange={textChanged}
          onKeyDown={inputKeyDown}
          as="textarea"
        />
        <Button
          variant="outline-dark"
          size="sm"
          onClick={load}
          disabled={text.length === 0}
        >
          Load
        </Button>
      </InputGroup>
    </div>
  );
}

/**
 * View that shows when the State is unloaded
 *
 * - Allows starting a blank Item (-> item)
 * - Allows loading a pasted Item (-> item) | (-> error)
 */
function UnloadedView(args: {
  setError: (error: string | null) => void;
  setItem: (item: Item) => void;
}) {
  const { setError, setItem } = args;

  return (
    <div>
      <Stack direction="vertical" gap={2}>
        <LoadNewItem setItem={setItem} />
        <strong>or</strong>
        <PasteInItem setError={setError} setItem={setItem} />
      </Stack>
    </div>
  );
}

/**
 * View that shows when the State is error
 *
 * - Displays the error
 * - Clicking the button clears the error (-> unloaded)
 */
function ErrorView(args: { setUnloaded: () => void; error: string | null }) {
  const { setUnloaded, error } = args;

  return (
    <div>
      <h2>Failed Loading Countermeasure</h2>
      <p>
        <strong>Cause:</strong> {error ?? "Unknown error."}
      </p>
      <Button variant="outline-dark" size="sm" onClick={setUnloaded}>
        Ok
      </Button>
    </div>
  );
}

/** Pop-up to confirm clearing the currently-edited Item */
function ClearItemModal(args: {
  shown: boolean;
  close: () => void;
  clear: () => void;
}) {
  const { shown, close, clear } = args;

  return (
    <Modal dialogAs={ModalDialogTrapFocus} show={shown} onHide={close}>
      <Modal.Header className={css.clear_modal_header}>
        <h2>Clear Countermeasure?</h2>
      </Modal.Header>
      <Modal.Body>
        Clearing the Countermeasure will reset all entered information.
        <br />
        Please be sure that you copied from the <strong>
          Copy-Out JSON
        </strong>{" "}
        box first.
        <br />
        Are you sure that you want to clear the current Countermeasure?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-dark" onClick={close}>
          Cancel
        </Button>
        <Button variant="outline-danger" onClick={clear}>
          Clear
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/** Is string empty / whitespace-only? */
function isBlank(str: string): boolean {
  return str.trim() === "";
}

/**
 * Given the EditableItem - give an array of issues preventing saving
 *
 * - If the array.length is 0, the item can be saved / is valid
 */
function issuesPreventingSave(item: EditableItem): string[] {
  const issues: string[] = [];

  // string fields

  const nonBlanks: Array<{
    name: string;
    key: keyof EditableItem;
  }> = [
    { name: "ID", key: "id" },
    { name: "Name", key: "name" },
    { name: "Version", key: "version" },
  ];
  nonBlanks.forEach(({ name, key }) => {
    if (isBlank(item[key] as string)) issues.push(`${name} is blank`);
  });

  // string (/ struct) or null fields

  if (item.subtype !== null && isBlank(item.subtype))
    issues.push("Type is not-null & blank");
  if (item.url !== null && isBlank(item.url))
    issues.push("URL is not-null & blank");
  if (item.deprecated !== null && isBlank(item.deprecated.reason))
    issues.push("Deprecated is non-null but Reason is blank");
  if (
    item.revoked !== null &&
    (isBlank(item.revoked.reason) || isBlank(item.revoked.by_id))
  )
    issues.push("Revoked is non-null but either Reason or By ID are blank");

  // markdown blocks

  Object.entries(item.content).forEach(([key, content]) => {
    if (isBlank(content)) issues.push(`${keyToTitle(key)} is blank`);
  });

  // lists of string (/ struct)

  const lists: Array<{
    name: string;
    key: keyof EditableItem;
    getVal?: (val: unknown | string) => string;
  }> = [
    { name: "Contributors", key: "contributors" },
    { name: "Technologies", key: "technologies" },
    { name: "Platforms", key: "platforms" },
    { name: "Countermeasures Before This", key: "ids_before_this" },
    { name: "Countermeasures After This", key: "ids_after_this" },
    { name: "Related Countermeasures", key: "related_ids" },
    {
      name: "Mapped Techniques",
      key: "techniques",
      getVal: (val: unknown) => (val as MappedTech).tech_id,
    },
  ];
  lists.forEach(({ name, key, getVal }) => {
    getVal = getVal ?? ((val: unknown | string) => val as string);

    const keyed = item[key] as Keyed<unknown>[];
    const unkeyed = unkeyArray(keyed);
    const asStrings: string[] = unkeyed.map(getVal);

    if (!stringsAreUnique(asStrings))
      issues.push(`${name} has duplicate entries`);

    const isItemId = [
      "ids_before_this",
      "ids_after_this",
      "related_ids",
    ].includes(key);

    asStrings.forEach((entry, ind) => {
      if (isBlank(entry)) {
        issues.push(`${name} #${ind + 1} is blank`);
      } else if (isItemId && entry === item.id) {
        issues.push(`${name} #${ind + 1} is the ID currently being edited`);
      }
    });
  });

  return issues;
}

/** Opens a pop-up to confirm clearing of the Item in the editor */
function ClearEditor(args: { setUnloaded: () => void }) {
  const { setUnloaded } = args;

  const [clearModalShown, setClearModalShown] = useState<boolean>(false);
  const openClearModal = useCallback(() => setClearModalShown(true), []);
  const closeClearModal = useCallback(() => setClearModalShown(false), []);

  return (
    <>
      <div>
        <Button variant="outline-danger" size="sm" onClick={openClearModal}>
          Clear Editor
        </Button>
      </div>
      <ClearItemModal
        shown={clearModalShown}
        close={closeClearModal}
        clear={setUnloaded}
      />
    </>
  );
}

/**
 * TS port of coun7er-md-to-json/s_update_cm_dev.py : wrap_content()
 *
 * - Makes Item.content: string ---into--> string[] by manually line wrapping
 * - Does not modify in-place as to respect typing
 * - Returns new content value
 */
function wrapContent(item: Item, width: number): string[] {
  const lines: string[] = [""];
  const parts: string[] = item.content
    .split(/(\W)/)
    .filter((p) => p.length > 0);

  while (parts.length > 0) {
    const curLine = lines[lines.length - 1];
    const curPart = parts[0];

    if (curLine.length + curPart.length > width) {
      lines.push("");
    } else {
      lines[lines.length - 1] = curLine + curPart;
      if (curPart === "\n") {
        lines.push("");
      }
      parts.shift();
    }
  }

  if (item.content !== lines.join("")) {
    throw new Error(`wrapContent() on Item ${item.id} broke equality`);
  }

  return lines;
}

/**
 * A Copy-Out Box for saving Item edits
 *
 * - User can Ctrl-A Ctrl-C within the box to copy the Item's json
 * - The box can disable if the Item is currently invalid
 *   - A list of issues to resolve is then displayed
 *   - Making the Item valid again re-enables the box
 */
function CopyItem(args: { item: EditableItem }) {
  const { item } = args;

  const issues = useMemo(() => issuesPreventingSave(item), [item]);
  const disabled = useMemo(() => issues.length > 0, [issues]);

  const normalItem = useMemo(() => Item_from_editable(item), [item]);

  const json = useMemo(() => {
    if (disabled) {
      return "- issue(s) must be resolved first -";
    } else {
      const content = wrapContent(normalItem, 100);
      const data = { ...normalItem, content };
      return JSON.stringify(data, null, 4);
    }
  }, [disabled, normalItem]);

  const markdown = useMemo(() => {
    if (disabled) {
      return "- issue(s) must be resolved first -";
    } else {
      return `# ${esc(normalItem.name)}\n\n${normalItem.content}`;
    }
  }, [disabled, normalItem]);

  const copyOutJsonId = useId();
  const copyOutMdId = useId();

  return (
    <>
      <div>
        <label htmlFor={copyOutJsonId}>Copy-Out JSON</label>
        <textarea
          className={css.copy_out_box}
          id={copyOutJsonId}
          value={json}
          disabled={disabled}
          readOnly={true}
        />
      </div>
      <strong>or</strong>
      <div>
        <label htmlFor={copyOutMdId}>Copy-Out Markdown</label>
        <textarea
          className={css.copy_out_box}
          id={copyOutMdId}
          value={markdown}
          disabled={disabled}
          readOnly={true}
        />
      </div>

      {issues.length > 0 ? (
        <details>
          <summary>{quantity(issues.length, "Issue")} Left</summary>
          <ul className="mb-0">
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

/**
 * View that shows when the State is item
 *
 * - Displays the Item within an editing interface
 * - Displays a copy-out box to capture edits made
 * - Has a button that clears the item on click (-> unloaded)
 */
function ItemView(args: { setUnloaded: () => void; item: Item }) {
  const { setUnloaded } = args;
  const [item, setItem] = useState<EditableItem>(Item_to_editable(args.item));

  return (
    <div>
      <Stack direction="vertical" gap={2}>
        <ClearEditor setUnloaded={setUnloaded} />
        <strong>or</strong>
        <CopyItem item={item} />
      </Stack>
      <hr />
      <ItemEditor item={item} setItem={setItem} />
    </div>
  );
}

/**
 * Item Editor Page
 *
 * - Has a State and 3 according views (unloaded, item, error)
 * - Has a header showing what ATT&CK domains / Dataset are loaded
 */
export function Page() {
  const [state, setState] = useState<State>({ name: "unloaded" });

  const setUnloaded = useCallback(() => setState({ name: "unloaded" }), []);
  const setError = useCallback(
    (error: string | null) => setState({ name: "error", error }),
    []
  );
  const setItem = useCallback(
    (item: Item) => setState({ name: "item", item }),
    []
  );

  let view = null;

  if (state.name === "unloaded") {
    view = <UnloadedView setError={setError} setItem={setItem} />;
  } else if (state.name === "error") {
    view = <ErrorView setUnloaded={setUnloaded} error={state.error} />;
  } else if (state.name === "item") {
    view = <ItemView setUnloaded={setUnloaded} item={state.item} />;
  }

  return (
    <div className={css.root}>
      <span className="visually-hidden">
        Git Commit Hash: {GIT_COMMIT.SHORT_HASH}
      </span>
      <LoadInfo />
      <h1 className={css.title}>Countermeasure Editor</h1>
      <hr />
      {view}
    </div>
  );
}
