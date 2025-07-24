import css from "./ScrollToTop.module.css";

import { BsArrowUp } from "react-icons/bs";
import { Button } from "react-bootstrap";
import { useCallback, useEffect, useState } from "react";

/**
 * Scroll-to-top Button
 *
 * - Scrolls to the top of the page by focusing the specified ID on click
 * - Visually appears once the page has scrolled a bit
 */
export function ScrollToTop(args: { focusId: string }) {
  const { focusId } = args;

  // button visibility
  const [visible, setVisible] = useState<boolean>(false);

  // on scroll -> visible if down 100px
  useEffect(() => {
    const onScroll = () => {
      const a = document.body.scrollTop;
      const b = document.documentElement.scrollTop;
      setVisible((a || b) > 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onClick = useCallback(() => {
    document.getElementById(focusId)?.focus();
  }, [focusId]);

  return (
    <Button
      className={css.button}
      variant="dark"
      type="button"
      aria-label="Scroll to Top"
      onClick={onClick}
      style={{ display: visible ? undefined : "none" }}
    >
      <BsArrowUp aria-hidden={true} className="bs-svg" />
    </Button>
  );
}
