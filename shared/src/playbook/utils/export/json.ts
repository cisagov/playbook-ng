import { Playbook } from "../../../playbook/types";
import { SaveableFile } from "./types";

export function exportJson(playbook: Playbook): SaveableFile {
  playbook = {
    ...playbook,
    version: (parseInt(playbook.version, 10) + 1).toString(),
  };

  // return saveable
  const data = new Blob([JSON.stringify(playbook, null, 4)], {
    type: "application/json;charset=utf-8",
  });
  const { title, version } = playbook;
  const filename = `playbook_${title
    .toLowerCase()
    .replaceAll(" ", "_")}_v${version}.json`;
  return { data, filename };
}
