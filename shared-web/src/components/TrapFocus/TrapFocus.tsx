import {
  Modal,
  ModalDialogProps,
  Offcanvas,
  OffcanvasProps,
} from "react-bootstrap";
import { tabbable as getTabbable } from "tabbable";

function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
  const div = e.currentTarget as HTMLDivElement;

  // not [Tab] -> ignore
  if (e.key !== "Tab") return;

  const tabbable = getTabbable(div);

  // nothing can be focused -> focus <div> itself
  if (tabbable.length === 0) {
    div.focus();
    e.preventDefault();
    return;
  }

  // get focus bounds + currently active
  const first = tabbable[0];
  const last = tabbable[tabbable.length - 1];
  const current = document.activeElement;

  // [Shift] + [Tab]: back
  if (e.shiftKey) {
    // hit start boundary -> loop to end
    if (current === first) {
      last.focus();
      e.preventDefault();
    }
  }
  // [Tab]: Forward
  else {
    // hit end boundary -> loop to start
    if (current === last) {
      first.focus();
      e.preventDefault();
    }
  }
}

export function OffcanvasTrapFocus(
  args: OffcanvasProps & React.RefAttributes<HTMLDivElement>
) {
  const { children, onKeyDown: _ignore1, tabIndex: _ignore2, ...rest } = args;
  return (
    <Offcanvas {...rest} onKeyDown={onKeyDown} tabIndex={-1}>
      {children}
    </Offcanvas>
  );
}

export function ModalDialogTrapFocus(
  args: ModalDialogProps & React.RefAttributes<HTMLDivElement>
) {
  const { children, onKeyDown: _ignore1, tabIndex: _ignore2, ...rest } = args;
  return (
    <Modal.Dialog {...rest} onKeyDown={onKeyDown} tabIndex={-1}>
      {children}
    </Modal.Dialog>
  );
}
