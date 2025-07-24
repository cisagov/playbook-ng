import css from "./SearchBar.module.css";
import { useCallback, useEffect, useState } from "react";
import { InputGroup, Form, Button } from "react-bootstrap";

export function SearchBar(args: {
  variant?: "blue" | "green";
  text: string;
  setText: (text: string) => void;
}) {
  const styleClass =
    (args.variant ?? "blue") === "blue"
      ? css.search_bar_blue
      : css.search_bar_green;

  const { text, setText } = args;
  // ^
  // |- 250ms debounce updated
  // |
  const [textUI, setTextUI] = useState<string>(text);

  useEffect(() => {
    if (text !== textUI) {
      const id = setTimeout(() => {
        setText(textUI);
      }, 250);
      return () => clearTimeout(id);
    }
  }, [textUI, text, setText]);

  const textChanged = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setTextUI(e.target.value),
    []
  );

  const clearText = useCallback(() => {
    setText("");
    setTextUI("");
  }, [setText]);

  return (
    <InputGroup className="mb-2">
      <Form.Control
        className={styleClass}
        placeholder="Enter search text here"
        aria-label="Search Text"
        value={textUI}
        onChange={textChanged}
      />
      {textUI ? (
        <Button
          className={css.clear_btn}
          variant="outline-primary"
          onClick={clearText}
        >
          X
        </Button>
      ) : null}
    </InputGroup>
  );
}
