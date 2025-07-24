import { useCallback } from "react";
import css from "./BaseDeleteModal.module.css";
import { Button, Modal } from "react-bootstrap";
import { ModalDialogTrapFocus } from "@playbook-ng/shared-web/src/components/TrapFocus/TrapFocus";

export function BaseDeleteModal(args: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  confirm: () => void;
  callback?: (keyboard: boolean) => void;
}) {
  const { title, children, close, confirm, callback } = args;

  const handleConfirm = useCallback(
    (e: React.MouseEvent) => {
      close();
      confirm();
      if (callback) {
        const keyboard = e.screenX === 0 && e.screenY === 0;
        callback(keyboard);
      }
    },
    [close, confirm, callback]
  );

  return (
    <Modal dialogAs={ModalDialogTrapFocus} show={true} onHide={close}>
      <Modal.Header className={css.header}>
        <h2>{title}</h2>
      </Modal.Header>
      <Modal.Body className={css.body}>{children}</Modal.Body>
      <Modal.Footer className={css.footer}>
        <Button variant="outline-primary" onClick={close}>
          Cancel
        </Button>
        <Button variant="outline-danger" onClick={handleConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
