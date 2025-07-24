import { LoggingContext } from "@playbook-ng/shared/src/base/utils/logging";
import { Playbook } from "@playbook-ng/shared/src/playbook/types";
import { useCallback, useEffect, useState } from "react";
import { useFilePicker } from "use-file-picker";
import { PlaybookStatusWarning } from "@/components/PlaybookStatusWarning/PlaybookStatusWarning";
import { useTitle } from "@/hooks/useTitle";
import { Header } from "@/components/Header/Header";
import { Button } from "react-bootstrap";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { isDateValid } from "@playbook-ng/shared/src/base/utils/time";
import { Dataset } from "@playbook-ng/shared/src/dataset/types";
import { useLocation } from "react-router-dom";
import { FileSelectArgs } from "@playbook-ng/shared-web/src/code/types";
import { loadUnknownAsPlaybook } from "@playbook-ng/shared/src/playbook/loading";
import { UpdatePlaybook } from "./UpdatePlaybook/UpdatePlaybook";
import { stringsAreUnique } from "@playbook-ng/shared/src/base/utils/string";

const PAGE_TITLE = "Import Playbook";

type State =
  | { name: "unloaded" }
  | { name: "failure"; error: string }
  | { name: "success"; fileName: string; playbook: Playbook };

/**
 * Given a Selected File
 * - Return State "failure" or "success" on if Playbook can be accepted
 *   - By means of schema and content
 *   - Actual Tech / Item IDs are handled later (invalids discarded)
 */
function checkFileAsPlaybook(args: {
  files: FileSelectArgs;
  dataset: Dataset;
}): State {
  const { files, dataset } = args;
  const { item_type } = dataset;

  const ctx = new LoggingContext({});

  try {
    ctx.high("Reading + validating selected Playbook");

    ctx.med("Getting file name + content");
    const fileName = files.plainFiles[0].name;
    const content = files.filesContent[0].content;

    ctx.med("Parsing file as JSON");
    const data = JSON.parse(content);

    ctx.med("Checking file schema");
    const playbook = loadUnknownAsPlaybook(data);

    ctx.med("Checking file content");

    ctx.low("Does the Playbook Dataset (id, version) match the App's?");
    (() => {
      const fileMarker = `(${playbook.dataset_id}, ${playbook.dataset_version})`;
      const appMarker = `(${dataset.id}, ${dataset.version})`;
      if (fileMarker !== appMarker) throw new Error("no");
    })();

    ctx.low("Is .version a valid format?");
    if (!/^[0-9]+$/.test(playbook.version)) throw new Error("no");

    ctx.low("Is .created a valid timestamp?");
    if (!isDateValid(new Date(playbook.created))) throw new Error("no");

    ctx.low("Is .updated a valid timestamp?");
    if (!isDateValid(new Date(playbook.updated))) throw new Error("no");

    ctx.low(".ignored_items uniqueness");
    if (!stringsAreUnique(playbook.ignored_items))
      throw new Error("has duplicates");

    ctx.low(".tech_to_items.x.items");
    for (const [techId, ttiVal] of Object.entries(playbook.tech_to_items)) {
      if (!stringsAreUnique(ttiVal.items.map((i) => i.id)))
        throw new Error(`Duplicate ${item_type}s mapped under ${techId}`);

      for (const itemEntry of ttiVal.items) {
        const itemId = itemEntry.id;
        if (playbook.ignored_items.includes(itemId))
          throw new Error(
            `${item_type} ${itemId} is mapped under ${techId} and present in .ignored_items`
          );
      }
    }

    return { name: "success", fileName, playbook };
  } catch (err) {
    return { name: "failure", error: ctx.messageFor(err) };
  }
}

function Unloaded(args: { onSelectFile: () => void }) {
  const { onSelectFile } = args;

  return (
    <section>
      <h2>No Playbook Loaded</h2>
      <Button onClick={onSelectFile}>Select File</Button>
    </section>
  );
}

function LoadFailure(args: { error: string; onOk: () => void }) {
  const { error, onOk } = args;

  return (
    <section>
      <h2>Loading Playbook Failed</h2>
      <p>Error: {error}</p>
      <Button onClick={onOk} variant="outline-danger">
        Ok
      </Button>
    </section>
  );
}

function LoadSuccess(args: {
  fileName: string;
  playbook: Playbook;
  onCancel: () => void;
}) {
  return (
    <section>
      <h2>Loaded Playbook</h2>
      <UpdatePlaybook {...args} />
    </section>
  );
}

export function Import() {
  useTitle(PAGE_TITLE);

  const [state, setState] = useState<State>({ name: "unloaded" });

  // validate schema + contents of selected Playbook
  const dataset = useAppSelector((s) => s.appdata.dataset);
  const onFilesSuccessfullySelected = useCallback(
    (files: FileSelectArgs) =>
      setState(checkFileAsPlaybook({ files, dataset })),
    [dataset]
  );

  // if location.state was set by useImportPlaybook on another page
  // process the selected Playbook
  const location = useLocation();
  useEffect(() => {
    const files: null | FileSelectArgs = location.state;
    if (files === null) return;
    else onFilesSuccessfullySelected(files);
  }, [location.state, onFilesSuccessfullySelected]);

  const { openFilePicker: selectFile } = useFilePicker({
    multiple: false,
    accept: ".json",
    onFilesSuccessfullySelected,
  });

  const cancelImport = useCallback(() => setState({ name: "unloaded" }), []);

  return (
    <div>
      <PlaybookStatusWarning pageName={PAGE_TITLE} expectOpen={false} />
      <Header
        title={PAGE_TITLE}
        body="Import an existing Playbook-NG JSON Playbook"
      />
      {state.name === "unloaded" ? (
        <Unloaded onSelectFile={selectFile} />
      ) : state.name === "failure" ? (
        <LoadFailure error={state.error} onOk={cancelImport} />
      ) : state.name === "success" ? (
        <LoadSuccess
          fileName={state.fileName}
          playbook={state.playbook}
          onCancel={cancelImport}
        />
      ) : null}
    </div>
  );
}
