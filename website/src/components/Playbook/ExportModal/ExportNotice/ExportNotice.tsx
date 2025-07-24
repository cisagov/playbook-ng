import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import css from "./ExportNotice.module.css";
import { useLogExportIsOn } from "@/hooks/logging/useLogExportIsOn";
import { Markdown } from "@playbook-ng/shared-web/src/components/Markdown/Markdown";
import { Alert } from "react-bootstrap";

export function ExportNotice() {
  const itemType = useAppSelector((s) => s.appdata.dataset.item_type);
  const logExportIsOn = useLogExportIsOn();
  const moreInfoMD = useAppSelector(
    (s) => s.config!.export_logging?.more_info_md ?? null
  );

  if (!logExportIsOn) return null;

  return (
    <Alert variant="warning" className={css.alert}>
      <details>
        <summary className={css.summary}>
          <strong>Notice:</strong> Exported IDs are Logged
        </summary>
        <div>
          <p>
            This instance of Playbook-NG logs the following data upon export.
            Logging can be avoided by deploying your own instance.
          </p>
          <ul>
            <li>ATT&amp;CK Technique IDs</li>
            <li>{itemType} IDs</li>
            <li>Ignored {itemType} IDs</li>
            <li>Export Type Used</li>
          </ul>
          {moreInfoMD === null ? null : (
            <Markdown md={moreInfoMD} className={css.md} />
          )}
        </div>
      </details>
    </Alert>
  );
}
