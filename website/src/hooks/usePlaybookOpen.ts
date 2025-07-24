import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";

export function usePlaybookOpen(): boolean {
  const dataset_id = useAppSelector((s) => s.playbook.dataset_id);
  const dataset_version = useAppSelector((s) => s.playbook.dataset_version);
  const open = dataset_id !== "" && dataset_version !== "";
  return open;
}
