import {
  SearchConfig,
  newSearch,
  SearchDoc,
  searchAddDocs,
} from "@/code/search-typing";
import {
  AttackDatasets,
  getTechIdTo,
} from "@playbook-ng/shared/src/attack/objects";
import { renderCitations } from "@playbook-ng/shared/src/base/utils/rendering";

const ID_FIELD = "id" as const;
type IdField = typeof ID_FIELD;
const SEARCH_FIELDS = ["id", "baseName", "name", "desc"] as const;
type SearchField = (typeof SEARCH_FIELDS)[number];
const FILTER_FIELDS = ["Domain", "Platform", "Tactic", "Data Source"] as const;
type FilterField = (typeof FILTER_FIELDS)[number];
const STORE_FIELDS = [] as const;
type StoreField = (typeof STORE_FIELDS)[number];
export const SEARCH_CONFIG: SearchConfig<
  IdField,
  SearchField,
  FilterField,
  StoreField
> = {
  idField: ID_FIELD,
  searchFields: SEARCH_FIELDS,
  filterFields: FILTER_FIELDS,
  storeFields: STORE_FIELDS,
};

export function buildTechSearch(attack: AttackDatasets) {
  const search = newSearch(
    {
      searchOptions: {
        fuzzy: (term, _index, _terms) => {
          const regex = /(t)\d+/i;
          if (term.search(regex) >= 0) return 0;
          else return 0.15;
        },
        prefix: true,
        weights: {
          fuzzy: 0.2,
          prefix: 0.5,
        },
        boost: {
          id: 4,
          name: 3,
          baseName: 2,
        },
      },
    },
    SEARCH_CONFIG
  );

  const domainNames = getTechIdTo.domainNames(attack);
  const platformNames = getTechIdTo.platformNames(attack);
  const tacticNames = getTechIdTo.tacticNames(attack);
  const dataSourceNames = getTechIdTo.dataSourceNames(attack);
  const techs = Object.values(attack).flatMap((dom) => dom.techniques);

  const docs: SearchDoc<IdField, SearchField, FilterField, StoreField>[] =
    techs.map((t) => {
      const id = t.attackId;
      const desc = renderCitations(t.description, false);

      return {
        id,
        baseName: t.name.base ?? "",
        name: t.name.self,
        desc,
        Domain: [...(domainNames.get(id) ?? [])],
        Platform: [...(platformNames.get(id) ?? [])],
        Tactic: [...(tacticNames.get(id) ?? [])],
        "Data Source": [...(dataSourceNames.get(id) ?? [])],
      };
    });

  searchAddDocs(search, docs);

  return search;
}
