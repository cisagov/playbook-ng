import MiniSearch, { Options, Query, SearchOptions } from "minisearch";

export type SearchConfig<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
> = {
  idField: IdField;
  searchFields: readonly SearchField[];
  filterFields: readonly FilterField[];
  storeFields: readonly StoreField[];
};

export type SearchDoc<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
> = { [A in IdField]: string } & { [B in SearchField]: string } & {
  [C in FilterField]: string[];
} & { [D in StoreField]: unknown };

type SearchRawResult<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
> = { [A in IdField]: string } & {
  score: number;
  match: { [term: string]: SearchField[] };
} & { [C in FilterField]: string[] } & { [D in StoreField]: unknown };

export type SearchResult<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
> = { [A in IdField]: string } & {
  score: number;
  match: { [B in SearchField]: string[] };
} & { [C in FilterField]: string[] } & { [D in StoreField]: unknown };

export type Search<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
> = {
  config: SearchConfig<IdField, SearchField, FilterField, StoreField>;
  minisearch: MiniSearch;
};

/**
 * Allow defining edge-cases where a term should be matched by multiple terms
 * Below, "spearphishing" can be matched by any of ["spearphishing", "phishing"]
 */
const TERM_REPLACEMENTS: { [term: string]: string[] } = {
  spearphishing: ["spearphishing", "phishing"],
  doppelganging: ["doppelganging", "ganging"],
  javascript: ["javascript", "script"],
  applescript: ["applescript", "script"],
  powershell: ["powershell", "shell"],
};

function processTerm(term: string): string | string[] {
  term = term.toLowerCase();
  return TERM_REPLACEMENTS[term] ?? term;
}

/**
 * Improvement over default of text.split(SPACE_OR_PUNCTUATION) \
 * This can cause \<, \> and other fiends in the tokens
 */
function tokenize(text: string): string[] {
  const terms = text
    .replaceAll("ä", "a")
    .replaceAll(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(" ")
    .filter((t) => t !== "");

  return terms;
}

export function newSearch<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
>(
  options: Omit<Options, "idField" | "fields" | "storeFields">,
  config: SearchConfig<IdField, SearchField, FilterField, StoreField>
): Search<IdField, SearchField, FilterField, StoreField> {
  const minisearch = new MiniSearch({
    tokenize,
    processTerm,
    ...options,
    searchOptions: {
      tokenize,
      processTerm: MiniSearch.getDefault("processTerm"),
      ...(options.searchOptions ?? {}),
    },
    idField: config.idField,
    fields: [...config.searchFields],
    storeFields: [...config.filterFields, ...config.storeFields],
  });

  return { config, minisearch };
}

export function searchAddDocs<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
>(
  search: Search<IdField, SearchField, FilterField, StoreField>,
  docs: SearchDoc<IdField, SearchField, FilterField, StoreField>[]
) {
  const { minisearch } = search;
  minisearch.addAll(docs);
}

export function searchQuery<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
>(
  search: Search<IdField, SearchField, FilterField, StoreField>,
  query: Query,
  searchOptions?: SearchOptions
): SearchResult<IdField, SearchField, FilterField, StoreField>[] {
  const { config, minisearch } = search;
  const rawResults = minisearch.search(
    query,
    searchOptions
  ) as unknown as SearchRawResult<
    IdField,
    SearchField,
    FilterField,
    StoreField
  >[];
  const results: SearchResult<IdField, SearchField, FilterField, StoreField>[] =
    rawResults.map((res) => {
      const match: Partial<
        SearchResult<IdField, SearchField, FilterField, StoreField>["match"]
      > = {};
      config.searchFields.forEach((field) => ((match[field] as string[]) = []));
      Object.entries(res.match).forEach(([term, fields]) => {
        fields.forEach((field) => (match[field] as string[]).push(term));
      });
      return { ...res, match };
    });
  return results;
}

export type FilterRow = {
  name: string;
  on: boolean;
  count: number;
};

export type FilterCol<FilterField extends string> = {
  name: FilterField;
  rows: FilterRow[];
};

export type FilterSet<FilterField extends string> = FilterCol<FilterField>[];

export function makeFilterColForResults<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
>(
  colName: FilterField,
  results: SearchResult<IdField, SearchField, FilterField, StoreField>[]
): FilterCol<FilterField> {
  const counts = new Map<string, number>();
  results.forEach((result) => {
    (result[colName] as string[]).forEach((rowName) => {
      counts.set(rowName, (counts.get(rowName) ?? 0) + 1);
    });
  });

  const rows: FilterRow[] = [];
  counts.forEach((count, rowName) => {
    rows.push({ count, name: rowName, on: false });
  });

  rows.sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  );

  return {
    name: colName,
    rows,
  };
}

export function makeFilterSetForResults<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
>(
  colNames: readonly FilterField[],
  results: SearchResult<IdField, SearchField, FilterField, StoreField>[]
): FilterSet<FilterField> {
  return colNames.map((name) => makeFilterColForResults(name, results));
}

export function filterSetMatchesResult<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
>(
  filterSet: FilterSet<FilterField>,
  result: SearchResult<IdField, SearchField, FilterField, StoreField>
): boolean {
  for (const filterCol of filterSet) {
    const onRowNames = filterCol.rows
      .filter((row) => row.on)
      .map((row) => row.name);

    if (onRowNames.length !== 0) {
      const resultRowNames = new Set(result[filterCol.name] as string[]);
      if (!onRowNames.some((name) => resultRowNames.has(name))) return false;
    }
  }

  return true;
}

export type FilterSetAction<FilterField extends string> =
  | {
      name: "clear-all";
      colNames: readonly FilterField[];
    }
  | {
      name: "clear-col";
      colName: FilterField;
    }
  | {
      name: "toggle-row";
      colName: FilterField;
      rowName: string;
    };

export function filterSetReducer<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
>(args: {
  filters: FilterSet<FilterField>;
  searchedResults: SearchResult<
    IdField,
    SearchField,
    FilterField,
    StoreField
  >[];
  action: FilterSetAction<FilterField>;
}): FilterSet<FilterField> {
  const { filters, searchedResults, action } = args;

  if (action.name === "clear-all") {
    return makeFilterSetForResults(action.colNames, searchedResults);
  }

  let newFilters = filters;
  let colName: null | FilterField = null;

  if (action.name === "clear-col") {
    colName = action.colName;

    const curCol = filters.find((col) => col.name === colName)!;
    const newCol: FilterCol<FilterField> = {
      name: curCol.name,
      rows: curCol.rows.map((row) => ({ ...row, on: false })),
    };

    newFilters = filters.map((col) => (col.name === colName ? newCol : col));
  } else if (action.name === "toggle-row") {
    colName = action.colName;
    const { rowName } = action;

    const curCol = filters.find((col) => col.name === colName)!;
    const newCol: FilterCol<FilterField> = {
      name: curCol.name,
      rows: curCol.rows.map((row) =>
        row.name === rowName ? { ...row, on: !row.on } : row
      ),
    };

    newFilters = filters.map((col) => (col.name === colName ? newCol : col));
  }

  const otherColNames = newFilters
    .filter((col) => col.name !== colName)
    .map((col) => col.name);

  otherColNames.forEach((otherColName) => {
    const skipColFilters: FilterSet<FilterField> = newFilters.filter(
      (col) => col.name !== otherColName
    );

    const results = searchedResults.filter((res) =>
      filterSetMatchesResult(skipColFilters, res)
    );

    const curOtherCol = newFilters.find((col) => col.name === otherColName)!;

    const rowsOn = new Set(
      curOtherCol.rows.filter((row) => row.on).map((row) => row.name)
    );

    const newOtherCol = makeFilterColForResults(otherColName, results);

    curOtherCol.rows = newOtherCol.rows.map((row) => ({
      ...row,
      on: rowsOn.has(row.name),
    }));
  });

  return newFilters;
}
