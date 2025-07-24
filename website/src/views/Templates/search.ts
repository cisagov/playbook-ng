import {
  newSearch,
  searchAddDocs,
  SearchConfig,
  SearchDoc,
} from "@/code/search-typing";
import { Template } from "@playbook-ng/shared/src/dataset/types";
import {
  ttiItemIDs,
  ttiTechIDs,
} from "@playbook-ng/shared/src/playbook/helpers";

const ID_FIELD = "id" as const;
type IdField = typeof ID_FIELD;
const SEARCH_FIELDS = ["id", "name", "desc", "techs", "items"] as const;
type SearchField = (typeof SEARCH_FIELDS)[number];
const FILTER_FIELDS = [] as const;
type FilterField = (typeof FILTER_FIELDS)[number];
const STORE_FIELDS = [] as const;
type StoreField = (typeof STORE_FIELDS)[number];
export const TEMPLATE_SEARCH_CONFIG: SearchConfig<
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

export function buildTemplateSearch(templates: Template[]) {
  const search = newSearch(
    {
      searchOptions: {
        fuzzy: (term, _index, _terms) => {
          const regex = /(tmpl)\d+/i;
          if (term.search(regex) >= 0) {
            return 0;
          }
          return 0.15;
        },
        prefix: true,
        weights: {
          fuzzy: 0.2,
          prefix: 0.5,
        },
        boost: {
          name: 3,
          techs: 2,
        },
      },
    },
    TEMPLATE_SEARCH_CONFIG
  );

  const docs: SearchDoc<IdField, SearchField, FilterField, StoreField>[] =
    templates.map((t) => {
      const { id, name } = t;
      const desc = t.description;
      const techs = ttiTechIDs(t.tech_to_items).join(" ");
      const items = ttiItemIDs(t.tech_to_items).join(" ");
      return { id, name, desc, techs, items };
    });

  searchAddDocs(search, docs);

  return search;
}
