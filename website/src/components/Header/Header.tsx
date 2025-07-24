import { Col, Row } from "react-bootstrap";
import { ReactNode } from "react";
import css from "./Header.module.css";

export function Header(args: { title: ReactNode; body?: ReactNode }) {
  const { title, body } = args;

  const hasBody = typeof body !== "undefined";
  const stringBody = typeof body === "string";

  let content = null;

  if (hasBody) {
    if (stringBody) {
      content = <p>{body}</p>;
    } else {
      content = body;
    }
  }

  return (
    <header>
      <Row className={css.wrapper}>
        <Col xs={12}>
          <h1 className={css.title}>{title}</h1>
          <div className={css.content}>{content}</div>
        </Col>
      </Row>
    </header>
  );
}
