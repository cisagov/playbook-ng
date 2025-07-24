import { useCallback, useEffect } from "react";
import { useAppSelector } from "../store/hooks";

function confirmLink(args: { event: MouseEvent; prompt: null | string }) {
  const { event, prompt } = args;

  // no prompt -> allow
  if (prompt === null) return;

  // not in <a> -> allow
  if (event.target === null) return;
  const anchor = (event.target as HTMLElement).closest("a");
  if (anchor === null) return;

  // no href -> allow
  const href = anchor.getAttribute("href");
  if (href === null) return;

  const curURL = window.location;
  let newURL = null;

  // local url (#) -> allow
  try {
    newURL = new URL(href);
  } catch {
    return;
  }

  // local url -> allow
  if (newURL.origin === curURL.origin) return;

  // .gov / .mil -> allow
  if (newURL.hostname.endsWith(".gov") || newURL.hostname.endsWith(".mil"))
    return;

  // ok -> allow, else deny
  const ok = confirm(prompt);
  if (ok) return;
  else event.preventDefault();
}

export function useExtLinkWarning() {
  const prompt = useAppSelector((s) => s.config?.external_link_prompt ?? null);

  const fn = useCallback(
    (event: MouseEvent) => confirmLink({ event, prompt }),
    [prompt]
  );

  useEffect(() => {
    window.addEventListener("click", fn);
    return () => window.removeEventListener("click", fn);
  }, [fn]);
}
