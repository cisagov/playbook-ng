import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { useEffect } from "react";

export function useUnloadWarning() {
  const unloadWarning = useAppSelector(
    (s) => s.config?.unload_warning ?? false
  );

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    if (unloadWarning) {
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", onBeforeUnload);
      };
    }
  }, [unloadWarning]);
}
