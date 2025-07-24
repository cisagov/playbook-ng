import {
  SearchConfig,
  newSearch,
  SearchDoc,
  searchAddDocs,
} from "@/code/search-typing";
import { Dataset } from "@playbook-ng/shared/src/dataset/types";

const ID_FIELD = "id" as const;
type IdField = typeof ID_FIELD;
const SEARCH_FIELDS = ["id", "name", "desc"] as const;
type SearchField = (typeof SEARCH_FIELDS)[number];
const FILTER_FIELDS = [] as const;
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

export function buildItemSearch(dataset: Dataset) {
  const search = newSearch(
    {
      searchOptions: {
        fuzzy: 0.15,
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
    SEARCH_CONFIG
  );

  const docs: SearchDoc<IdField, SearchField, FilterField, StoreField>[] =
    dataset.items.map((i) => {
      const { id, name } = i;
      const desc = i.content;
      return { id, name, desc };
    });

  searchAddDocs(search, docs);

  return search;
}
