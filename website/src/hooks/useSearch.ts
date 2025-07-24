import {
  FilterSetAction,
  filterSetMatchesResult,
  filterSetReducer,
  makeFilterSetForResults,
  Search,
  searchQuery,
} from "@/code/search-typing";
import MiniSearch from "minisearch";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useSearch<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
>(s: Search<IdField, SearchField, FilterField, StoreField>) {
  const search = s;
  const { config } = search;

  const [text, setText] = useState("");
  const [filters, setFilters] = useState(() => {
    const allResults = searchQuery(search, MiniSearch.wildcard);
    const newFilters = makeFilterSetForResults(config.filterFields, allResults);
    return newFilters;
  });

  const searchedResults = useMemo(
    () => searchQuery(search, text || MiniSearch.wildcard),
    [search, text]
  );

  useEffect(() => {
    const newFilters = makeFilterSetForResults(
      config.filterFields,
      searchedResults
    );
    setFilters(newFilters);
  }, [config.filterFields, searchedResults]);

  const reduceFilters = useCallback(
    (action: FilterSetAction<FilterField>) => {
      const newFilters = filterSetReducer({
        filters,
        searchedResults,
        action,
      });
      setFilters(newFilters);
    },
    [filters, searchedResults]
  );

  const filteredResults = useMemo(
    () => searchedResults.filter((r) => filterSetMatchesResult(filters, r)),
    [filters, searchedResults]
  );

  return useMemo(
    () => ({
      text,
      setText,
      filters,
      reduceFilters,
      results: filteredResults,
    }),
    [text, filters, reduceFilters, filteredResults]
  );
}
