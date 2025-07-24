import css from "./TechIdExtractor.module.css";
import {
  joinTechName,
  Technique,
} from "@playbook-ng/shared/src/attack/objects";
import { Button, Col, Form, Row, Stack } from "react-bootstrap";
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { BsInfoCircleFill } from "react-icons/bs";
import {
  useAppDispatch,
  useAppSelector,
} from "@playbook-ng/shared-web/src/store/hooks";
import { adjustTechs } from "@playbook-ng/shared/src/app/load";
import { addTechs } from "@playbook-ng/shared-web/src/store/playbookSlice";
import { addAlert } from "@playbook-ng/shared-web/src/store/alertSlice";
import { quantity } from "@playbook-ng/shared/src/base/utils/string";
import {
  intersection,
  stableDedupe,
} from "@playbook-ng/shared/src/base/utils/set";
import { TechModalControlContext } from "@/contexts/TechModalControlContext";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";
import { ttiTechIDs } from "@playbook-ng/shared/src/playbook/helpers";
import { ButtonCollapsePanel } from "@/components/ButtonCollapsePanel/ButtonCollapsePanel";

/**
 * Technique ID Regex - Case Insensitive
 *
 * - Match group 0 should be uppercased after in order to lookup Technique in LUT
 */
const TECH_ID_P = /T[0-9]{4}(?:\.[0-9]{3})?/gi;

type TechEntry = {
  name?: string;
  tech?: Technique;
  was?: {
    id: string;
    name: string;
  };
};

type EntryLUT = Map<string, TechEntry>;

function H2Inline(args: { children: React.ReactNode }) {
  const { children } = args;
  return <h2 className={css.h2_inline}>{children}</h2>;
}

/** Technique ID Extractor */
export function TechIdExtractor() {
  return (
    <ButtonCollapsePanel btnWrap={H2Inline} btnText="Technique ID Extractor">
      <Body />
    </ButtonCollapsePanel>
  );
}

/**
 * Technique ID Extractor - Body
 *
 * - Holds user-inputted text state
 * - Contains panels for Input and Results
 */
function Body() {
  const [text, setText] = useState<string>("");

  const ids = Array.from(text.matchAll(TECH_ID_P)).map((m) =>
    m[0].toUpperCase()
  );

  return (
    <Row className={css.root}>
      {/* About */}
      <Col xs={12}>
        <p>Locate Techniques by pasting text that contains IDs.</p>
      </Col>

      {/* Input */}
      <Col xs={12} md={6}>
        <InputPane {...{ text, setText }} />
      </Col>

      {/* Results */}
      <Col xs={12} md={6}>
        <ResultsPane ids={ids} />
      </Col>
    </Row>
  );
}

/**
 * Technique ID Extractor - Input Pane
 */
function InputPane(args: { text: string; setText: (text: string) => void }) {
  const { text, setText } = args;

  const updateText = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value),
    [setText]
  );

  const clearText = useCallback(() => setText(""), [setText]);

  const headerId = useId();

  return (
    <div>
      {/* Header */}
      <h3 id={headerId}>Paste Text Here</h3>

      {/* Input */}
      <textarea
        className={css.textarea}
        aria-labelledby={headerId}
        value={text}
        onChange={updateText}
      />

      {/* Clear */}
      {text.length > 0 ? (
        <Button
          className={css.clear_text_button}
          variant="outline-dark"
          size="sm"
          onClick={clearText}
        >
          Clear Text
        </Button>
      ) : null}
    </div>
  );
}

function ResultsPane(args: { ids: string[] }) {
  const attack = useAppSelector((s) => s.appdata.attack);
  const cartTTI = useAppSelector((s) => s.playbook.tech_to_items);
  const cartSet = useMemo(() => new Set(ttiTechIDs(cartTTI)), [cartTTI]);

  const { techLUT } = useContext(DataLUTsContext);

  const ids = stableDedupe(args.ids);

  const { adjusts } = adjustTechs({ uncheckedIds: ids, attack });

  const unknown: EntryLUT = new Map();
  const deprecated: EntryLUT = new Map();
  const carted: EntryLUT = new Map();
  const addable: EntryLUT = new Map();

  adjusts.forEach((adj) => {
    const { status, reason } = adj;

    if (status === "removed") {
      const { id } = adj;

      if (reason === "tech is unknown") {
        unknown.set(id, {});
      } else if (reason === "tech is deprecated") {
        const { name } = adj;
        deprecated.set(id, { name });
      }
    } else if (status === "unchanged") {
      const { id } = adj;
      const tech = techLUT[id];

      if (cartSet.has(id)) {
        // add if not present
        if (!carted.get(id)) {
          carted.set(id, {});
        }
      } else {
        // add if not present
        if (!addable.get(id)) {
          addable.set(id, { tech });
        }
      }
    } else if (status === "replaced") {
      const id = adj.replacedBy.id;
      const tech = techLUT[id];
      const was = { id: adj.id, name: adj.name };

      if (cartSet.has(id)) {
        const entry = carted.get(id);

        // add if not present
        if (!entry) {
          carted.set(id, { was });
        }

        // set was if present
        else {
          entry.was = was;
        }
      } else {
        const entry = addable.get(id);

        // add if not present
        if (!entry) {
          addable.set(id, { tech, was });
        }

        // set was if present
        else {
          entry.was = was;
        }
      }
    }
  });

  return (
    <div className={css.results_pane}>
      <h3>Located IDs</h3>

      {ids.length === 0 ? <span>No IDs Found</span> : null}

      {unknown.size > 0 ? (
        <Unaddables groupName="Unknown" entryLUT={unknown} />
      ) : null}

      {deprecated.size > 0 ? (
        <Unaddables groupName="Deprecated" entryLUT={deprecated} />
      ) : null}

      {carted.size > 0 ? (
        <Unaddables groupName="Already in Cart" entryLUT={carted} />
      ) : null}

      {addable.size > 0 ? <Addables entryLUT={addable} /> : null}
    </div>
  );
}

function Unaddables(args: { groupName: string; entryLUT: EntryLUT }) {
  const { groupName, entryLUT } = args;

  const items = Array.from(entryLUT, ([id, entry]) => {
    const hasName = typeof entry.name !== "undefined";
    const hasWas = typeof entry.was !== "undefined";
    return (
      <li key={id}>
        <strong>{id}</strong>
        {hasName ? <>: {entry.name}</> : null}
        {hasWas ? <> (revokes {entry.was?.id})</> : null}
      </li>
    );
  });

  return (
    <div>
      <h4>{groupName}</h4>
      <ul>{items}</ul>
    </div>
  );
}

function Addables(args: { entryLUT: EntryLUT }) {
  const dispatch = useAppDispatch();
  const allItems = useAppSelector((s) => s.appdata.dataset.items);

  const { entryLUT } = args;

  const [picks, setPicks] = useState(() => new Set<string>());

  useEffect(() => {
    const validIds = new Set(entryLUT.keys());

    const newPicks = intersection(picks, validIds);

    if (newPicks.size !== picks.size) {
      setPicks(newPicks);
    }
  }, [entryLUT, picks]);

  const toggle = useCallback(
    (id: string) => {
      const newPicks = new Set(picks);

      if (newPicks.has(id)) {
        newPicks.delete(id);
      } else {
        newPicks.add(id);
      }

      setPicks(newPicks);
    },
    [picks]
  );

  const selectAll = useCallback(() => {
    const newPicks = new Set(entryLUT.keys());

    setPicks(newPicks);
  }, [entryLUT]);

  const selectNone = useCallback(() => {
    const newPicks = new Set<string>();

    setPicks(newPicks);
  }, []);

  const addSelected = useCallback(() => {
    const qty = picks.size;

    const ids = Array.from(entryLUT.keys()).filter((id) => picks.has(id));

    dispatch(addTechs({ allItems, ids }));
    dispatch(
      addAlert({
        type: "success",
        message: `Added ${quantity(qty, "Technique")} to the playbook.`,
      })
    );
  }, [allItems, dispatch, entryLUT, picks]);

  const items = Array.from(entryLUT, ([id, entry]) => {
    return (
      <li key={id} className={css.addable_tech_list_item}>
        <AddableTech entry={entry} selected={picks.has(id)} toggle={toggle} />
      </li>
    );
  });

  return (
    <div>
      <h4>Add-Able</h4>

      <ul className={css.addable_tech_list}>{items}</ul>

      <Stack direction="horizontal" gap={2} className={css.addable_buttons}>
        <Button variant="outline-dark" size="sm" onClick={selectAll}>
          Select All
        </Button>
        <Button variant="outline-dark" size="sm" onClick={selectNone}>
          Select None
        </Button>
        {picks.size > 0 ? (
          <Button variant="outline-primary" size="sm" onClick={addSelected}>
            Add Selected
          </Button>
        ) : null}
      </Stack>
    </div>
  );
}

function AddableTech(args: {
  entry: TechEntry;
  selected: boolean;
  toggle: (id: string) => void;
}) {
  const { entry, selected, toggle } = args;
  const tech = entry.tech!;

  const { open } = useContext(TechModalControlContext);
  const openModal = useCallback(() => open(tech), [open, tech]);

  const toggleSelected = useCallback(
    () => toggle(tech.attackId),
    [toggle, tech.attackId]
  );

  const checkId = useId();

  const hasWas = typeof entry.was !== "undefined";

  const label = (
    <>
      <strong>{tech.attackId}</strong>: {joinTechName(tech.name)}
      {hasWas ? (
        <>
          <br />
          (revokes {entry.was?.id})
        </>
      ) : null}
    </>
  );

  return (
    <Stack direction="horizontal" className={css.addable_tech}>
      <Form.Check className={css.addable_tech_check}>
        <Form.Check.Input
          type="checkbox"
          id={checkId}
          checked={selected}
          onChange={toggleSelected}
        />
        <Form.Check.Label
          className={css.addable_tech_check_label}
          htmlFor={checkId}
        >
          {label}
        </Form.Check.Label>
      </Form.Check>
      <Button
        className={css.addable_tech_button}
        aria-label={`Open ${tech.attackId} details`}
        variant="primary"
        size="sm"
        onClick={openModal}
      >
        <BsInfoCircleFill className={`bs-svg`} aria-hidden="true" />
      </Button>
    </Stack>
  );
}
