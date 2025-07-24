import { useEffect } from "react";

/** Sets the page title to `Playbook-NG: ${title}` on component mount */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = `Playbook-NG: ${title}`;
  }, [title]);
}
