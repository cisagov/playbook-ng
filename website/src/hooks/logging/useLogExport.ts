import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import {
  ttiItemIDs,
  ttiTechIDs,
} from "@playbook-ng/shared/src/playbook/helpers";
import { Playbook } from "@playbook-ng/shared/src/playbook/types";
import { useCallback } from "react";

function log(args: { url: string; playbook: Playbook; format: string }) {
  const { url, playbook, format } = args;

  const { tech_to_items: tti, ignored_items: ignoredItemIDs } = playbook;
  const techIDs = ttiTechIDs(tti);
  const itemIDs = ttiItemIDs(tti);

  const method = "POST";
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({ techIDs, itemIDs, ignoredItemIDs, format });

  fetch(url, { method, headers, body });
}

type ExportFormat =
  | "JSON"
  | "Markdown"
  | "Word Doc"
  | "Excel Book"
  | "Template";

export function useLogExport() {
  const playbook = useAppSelector((s) => s.playbook);
  const logging = useAppSelector((s) => s.config!.export_logging);

  return useCallback(
    (format: ExportFormat) => {
      if (logging === null) {
        return;
      } else {
        const { url } = logging;
        log({ url, playbook, format });
      }
    },
    [logging, playbook]
  );
}
