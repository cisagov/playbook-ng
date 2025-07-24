import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";

export function useShortDatasetName() {
  const name = useAppSelector((s) => s.appdata.dataset.name);
  const shortName = name === "CISA COUN7ER" ? "COUN7ER" : name;
  return shortName;
}
