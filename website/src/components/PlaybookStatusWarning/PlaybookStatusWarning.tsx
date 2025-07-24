import { usePlaybookOpen } from "@/hooks/usePlaybookOpen";
import {
  useAppDispatch,
  useAppSelector,
} from "@playbook-ng/shared-web/src/store/hooks";
import { setPlaybookStatusWarningEn } from "@playbook-ng/shared-web/src/store/sessconfSlice";
import { useEffect } from "react";
import { Alert, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import css from "./PlaybookStatusWarning.module.css";
import { ModalDialogTrapFocus } from "@playbook-ng/shared-web/src/components/TrapFocus/TrapFocus";
import { BsExclamationTriangleFill } from "react-icons/bs";

/**
 * Playbook is Open|Closed Warning
 *
 * - Include this on any pages depending on the Playbook being open or closed
 *   - Specify if we expect it to be open or closed
 *   - **WARNING**: This does not prevent the page from using the unexpected state
 * - This will pop a full-page modal if the Playbook state isn't as expected
 *   - For unexpectedly open PBs -> Link to review page + mention how to close one
 *   - For unexpectedly closed PBs -> Link to home page + mention how to open one
 */
export function PlaybookStatusWarning(args: {
  /** Usage: the ${pageName} page... */
  pageName: string;

  /** T: cart loaded / started, F: no cart */
  expectOpen: boolean;
}) {
  const dispatch = useAppDispatch();

  const playbookOpen = usePlaybookOpen();

  // warning can be disabled before dispatch()ing to an invalid state
  // for the current page and navigate()ing away (state is valid for target page)
  const warningEnabled = useAppSelector(
    (s) => s.sessconf.playbookStatusWarningEn
  );
  const shouldWarn = warningEnabled && args.expectOpen !== playbookOpen;

  // warning automatically enables itself after re-render (after page transition)
  useEffect(() => {
    if (!warningEnabled) dispatch(setPlaybookStatusWarningEn(true));
    // Only the initial value of warningEnabled matters
    // We do not want it re-enabling itself when disabled before we navigate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    <Modal
      dialogAs={ModalDialogTrapFocus}
      backdrop="static"
      keyboard={false}
      show={shouldWarn}
      size="xl"
      centered
    >
      <Modal.Header className={css.header}>
        <Modal.Title>
          <h2>
            Warning:{" "}
            {playbookOpen ? "A Playbook is Open" : "No Playbook is Open"}
          </h2>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant="warning" className={css.alert}>
          <BsExclamationTriangleFill className={`bs-svg`} aria-hidden="true" />{" "}
          Using the <em>&quot;{args.pageName}&quot;</em> page requires that{" "}
          {args.expectOpen ? "a playbook is open" : "no playbook is open"},
          however, {playbookOpen ? "a playbook is open" : "no playbook is open"}
          .
        </Alert>

        {args.expectOpen ? (
          <>
            <p>
              A Playbook can be started/opened by going to the{" "}
              <Link to="/">Home Page</Link> and picking one of the following
              options:
            </p>
            <ul className={css.start_list}>
              <li>Start from Scratch</li>
              <li>Create from a Template</li>
              <li>Import Existing</li>
            </ul>
          </>
        ) : (
          <p>
            A Playbook can be closed by going to the{" "}
            <Link to="/playbook">Review Playbook Page</Link> and choosing to
            close it.
            <br />
            Make sure to export/save your playbook as JSON if you wish to load
            it later.
          </p>
        )}
      </Modal.Body>
    </Modal>
  );
}
