import {
  newSearch,
  Search,
  SearchConfig,
  SearchDoc,
} from "@/code/search-typing";

const ID_FIELD = "id" as const;
type IdField = typeof ID_FIELD;
const SEARCH_FIELDS = ["id", "name", "desc"] as const;
type SearchField = (typeof SEARCH_FIELDS)[number];
const FILTER_FIELDS = ["Platform"] as const;
type FilterField = (typeof FILTER_FIELDS)[number];
const STORE_FIELDS = ["type"] as const;
type StoreField = (typeof STORE_FIELDS)[number];
export const PB_SEARCH_CONFIG: SearchConfig<
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

export type PBSearchDoc = SearchDoc<
  IdField,
  SearchField,
  FilterField,
  StoreField
>;
export type PBSearch = Search<IdField, SearchField, FilterField, StoreField>;

export function initialPlaybookMiniSearch() {
  const search = newSearch(
    {
      searchOptions: {
        fuzzy: (term, _index, _terms) => {
          const techRegex = /(t)\d+/i;
          if (term.search(techRegex) >= 0) return 0;
          else return 0.15;
        },
        prefix: true,
        weights: {
          fuzzy: 0.2,
          prefix: 0.5,
        },
        boost: {
          id: 3,
          name: 2,
        },
      },
    },
    PB_SEARCH_CONFIG
  );
  return search.minisearch;
}
