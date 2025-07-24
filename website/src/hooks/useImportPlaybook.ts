import { useNavigate } from "react-router-dom";
import { useFilePicker } from "use-file-picker";
import { FileSelectArgs } from "@playbook-ng/shared-web/src/code/types";

/**
 * Creates an onClick handler for 'Import Existing (playbook)' buttons
 * - Opens file picker on click
 * - On file select, navigates to import page and passes file
 */
export function useImportPlaybook() {
  const navigate = useNavigate();

  const { openFilePicker } = useFilePicker({
    multiple: false,
    accept: ".json",
    onFilesSuccessfullySelected: (files: FileSelectArgs) => {
      navigate("/import", { state: files });
    },
  });

  return openFilePicker;
}
