import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";

export function useLogExportIsOn() {
  const logging = useAppSelector((s) => s.config!.export_logging);
  return logging !== null;
}
