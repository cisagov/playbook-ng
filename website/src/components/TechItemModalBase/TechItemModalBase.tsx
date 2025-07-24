import { CloseButton, Col, Container, Modal, Row } from "react-bootstrap";
import css from "./TechItemModalBase.module.css";
import { ReactNode } from "react";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { TechName } from "@playbook-ng/shared/src/attack/objects";
import { ModalDialogTrapFocus } from "@playbook-ng/shared-web/src/components/TrapFocus/TrapFocus";

export function TechItemModalBase(
  args: {
    id: string;
    url: string | null;
    datasetName: string;
    onClose: () => void;
    children: ReactNode;
  } & (
    | {
        name: TechName;
        type: "tech";
      }
    | {
        name: string;
        type: "item";
      }
  )
) {
  const { id, type, url, datasetName, onClose, children } = args;

  let baseName: string | null = null;
  let name: string = "";

  if (type === "tech") {
    baseName = args.name.base;
    name = args.name.self;
  } else if (type === "item") {
    baseName = null;
    name = args.name;
  }

  const colorClass = type === "tech" ? css.tech_header : css.item_header;

  const itemType = useAppSelector((s) => s.appdata.dataset.item_type);
  const curTypeName = type === "tech" ? "Technique" : itemType;

  return (
    <Modal
      dialogAs={ModalDialogTrapFocus}
      show={true}
      size="xl"
      fullscreen="md-down"
      onHide={onClose}
      centered
    >
      <Modal.Header className={`${css.header} ${colorClass}`}>
        <Container fluid>
          <Row>
            {/* Name (ID) */}
            <Col xs="auto" className={css.header_title_col}>
              {baseName !== null ? (
                <>
                  <span className={css.header_pre_title}>{baseName}</span>
                  <br />
                </>
              ) : null}
              <h2 className={css.header_title}>
                <span className="visually-hidden">Opened {curTypeName}: </span>
                {name} ({id})
              </h2>
            </Col>

            {/* View on Dataset Link */}
            {url ? (
              <Col className={css.header_link_col}>
                <a
                  className={css.header_link}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on {datasetName}
                </a>
              </Col>
            ) : null}
          </Row>
        </Container>

        <CloseButton
          className={css.header_close_button}
          variant="white"
          onClick={onClose}
        />
      </Modal.Header>

      <Modal.Body className={css.body}>
        <Container>{children}</Container>
      </Modal.Body>
    </Modal>
  );
}
