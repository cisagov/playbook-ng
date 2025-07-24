import { EditingContext } from "@/contexts/EditingContext";
import { ValSetContext } from "@/contexts/ValSetContext";
import { useCallback, useContext, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import { Data } from "../Data/Data";
import css from "./Block.module.css";

/**
 * An Editing Region
 *
 * Allows editing a local copy of the current val, only setting when done
 *
 * - Has an H2 title
 * - Has [Edit], [Accept]+[Cancel] controls
 * - Provides EditingContext to children (view / edit components)
 * - When viewing
 *   - Passes root val context down
 * - When editing
 *   - Passes local copy of root val (taken at start of editing)
 *   - Passes set function for local val
 *   - On [Accept], sets root val to modified local val
 */
export function Block(args: { title: string; children: React.ReactNode }) {
  const { title, children } = args;

  const { val: rootVal, set: rootSet } = useContext(ValSetContext);
  const [val, set] = useState(rootVal);
  const [editing, setEditing] = useState<boolean>(false);

  const beginEdit = useCallback(() => {
    if (val !== rootVal) {
      set(rootVal);
    }
    setEditing(true);
  }, [val, rootVal]);

  const cancelEdit = useCallback(() => {
    if (val !== rootVal) {
      set(rootVal);
    }
    setEditing(false);
  }, [val, rootVal]);

  const acceptEdit = useCallback(() => {
    if (rootVal !== val) {
      rootSet(val);
    }
    setEditing(false);
  }, [rootVal, rootSet, val]);

  let buttons = null;
  if (editing) {
    buttons = (
      <>
        <Button variant="outline-danger" size="sm" onClick={cancelEdit}>
          Cancel
        </Button>
        <Button variant="outline-success" size="sm" onClick={acceptEdit}>
          Accept
        </Button>
      </>
    );
  } else {
    buttons = (
      <Button variant="outline-dark" size="sm" onClick={beginEdit}>
        Edit
      </Button>
    );
  }

  const vs = useMemo(
    () => ({ val: editing ? val : rootVal, set }),
    [editing, val, rootVal]
  );

  return (
    <section className={css.root}>
      <div className="d-flex flex-wrap gap-2 mb-2">
        <h2 className={css.title}>{title}</h2>
        {buttons}
      </div>
      <EditingContext.Provider value={editing}>
        <Data vs={vs}>{children}</Data>
      </EditingContext.Provider>
    </section>
  );
}
