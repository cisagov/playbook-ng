import { TemplateModalControlContext } from "@/contexts/TemplateModalControlContext";
import { Template } from "@playbook-ng/shared/src/dataset/types";
import { useContext } from "react";
import { CloseButton, Modal } from "react-bootstrap";
import css from "./TemplateModal.module.css";
import { TemplateModalContent } from "./TemplateModalContent";
import { ModalDialogTrapFocus } from "@playbook-ng/shared-web/src/components/TrapFocus/TrapFocus";

export function TemplateModal(args: {
  template: Template;
  disableSelectBtn?: boolean;
}) {
  const { template } = args;
  const { close } = useContext(TemplateModalControlContext);

  return (
    <Modal
      dialogAs={ModalDialogTrapFocus}
      show={true}
      size="xl"
      fullscreen="md-down"
      onHide={close}
      centered
      className={css.modal}
    >
      <Modal.Header className={css.header}>
        <h2>{template.name}</h2>
        <CloseButton onClick={close} variant="white" />
      </Modal.Header>

      <Modal.Body>
        <TemplateModalContent {...args} />
      </Modal.Body>
    </Modal>
  );
}
