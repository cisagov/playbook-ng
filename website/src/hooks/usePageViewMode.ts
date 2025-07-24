import { useEffect, useState } from "react";

function getMode(): "desktop" | "mobile" {
  return window.matchMedia("(min-width: 992px)").matches ? "desktop" : "mobile";
}

export function usePageViewMode() {
  const [mode, setMode] = useState(getMode);

  useEffect(() => {
    const onResize = () => setMode(getMode());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return mode;
}
