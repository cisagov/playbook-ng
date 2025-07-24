import { SearchCacheContext } from "@/contexts/SearchCacheContext";
import { buildItemSearch } from "@/views/Items/search";
import { buildTechSearch } from "@/views/Techniques/search";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { useMemo } from "react";

export function SearchCacheProvider(args: { children: React.ReactNode }) {
  const { children } = args;
  const { attack, dataset } = useAppSelector((s) => s.appdata);
  const enabled = useAppSelector((s) => s.config!.search_caching);

  const cache = useMemo(() => {
    if (enabled)
      return {
        techs: buildTechSearch(attack).minisearch,
        items: buildItemSearch(dataset).minisearch,
      };
    else
      return {
        techs: null,
        items: null,
      };
  }, [attack, dataset, enabled]);

  return (
    <SearchCacheContext.Provider value={cache}>
      {children}
    </SearchCacheContext.Provider>
  );
}
