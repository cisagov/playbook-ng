import { DataLUTsContext } from "@/contexts/DataLUTsContext";
import { useAllTechniques } from "@/hooks/useAllTechniques";
import { useLUT } from "@/hooks/useLUT";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { useMemo } from "react";

export function DataLUTsProvider(args: { children: React.ReactNode }) {
  const { children } = args;

  const techniques = useAllTechniques();
  const { items, templates } = useAppSelector((s) => s.appdata.dataset);

  const techLUT = useLUT(techniques, "attackId");
  const itemLUT = useLUT(items, "id");
  const templateLUT = useLUT(templates, "id");

  const luts = useMemo(
    () => ({ techLUT, itemLUT, templateLUT }),
    [techLUT, itemLUT, templateLUT]
  );

  return (
    <DataLUTsContext.Provider value={luts}>{children}</DataLUTsContext.Provider>
  );
}
