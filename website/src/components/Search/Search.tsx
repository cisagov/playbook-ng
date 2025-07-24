import css from "./Search.module.css";
import { useCallback, useId, useState } from "react";
import { SearchBar } from "@/components/Search/SearchBar/SearchBar";
import { FilterSetFC } from "@/components/Search/Filters/Filter";
import { Button, Collapse } from "react-bootstrap";
import { BsChevronDown, BsChevronRight } from "react-icons/bs";
import { FilterSet, FilterSetAction, SearchConfig } from "@/code/search-typing";

export function SearchFC<
  IdField extends string,
  SearchField extends string,
  FilterField extends string,
  StoreField extends string,
>(args: {
  variant?: "blue" | "green";

  config: SearchConfig<IdField, SearchField, FilterField, StoreField>;

  text: string;
  setText: (text: string) => void;

  filters: FilterSet<FilterField>;
  reduceFilters: (action: FilterSetAction<FilterField>) => void;
}) {
  const { config, text, setText, filters, reduceFilters } = args;

  const anyFilterOn = filters.some((col) => col.rows.some((row) => row.on));
  const numCols = filters.length;

  const anyColsPresent = numCols > 0;
  const singleColPresent = numCols === 1;
  const multipleColsPresent = numCols > 1;

  const dropdownId = useId();
  const [dropdownOpen, setDropdownOpen] = useState(singleColPresent);
  const dropdownToggle = useCallback(
    () => setDropdownOpen(!dropdownOpen),
    [dropdownOpen]
  );

  const clearAll = useCallback(
    () =>
      reduceFilters({
        name: "clear-all",
        colNames: config.filterFields,
      }),
    [reduceFilters, config.filterFields]
  );

  const clearCol = useCallback(
    (colName: FilterField) =>
      reduceFilters({
        name: "clear-col",
        colName,
      }),
    [reduceFilters]
  );

  const toggleRow = useCallback(
    (colName: FilterField, rowName: string) =>
      reduceFilters({
        name: "toggle-row",
        colName,
        rowName,
      }),
    [reduceFilters]
  );

  return (
    <div className={css.search_container}>
      <h3 className="visually-hidden">Search Bar</h3>

      <SearchBar variant={args.variant} text={text} setText={setText} />

      {anyColsPresent ? (
        <div className={css.filters_container}>
          <h3 className="visually-hidden">Search Filters</h3>
          {multipleColsPresent ? (
            <div>
              <button
                type="button"
                className={css.filters_toggle_button}
                onClick={dropdownToggle}
                aria-controls={dropdownId}
                aria-expanded={dropdownOpen}
              >
                {dropdownOpen ? (
                  <>
                    Hide Filters{" "}
                    <BsChevronDown className={`bs-svg`} aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Show Filters{" "}
                    <BsChevronRight className={`bs-svg`} aria-hidden="true" />
                  </>
                )}
              </button>
              {dropdownOpen && anyFilterOn ? (
                <Button
                  variant="link"
                  className={css.clear_all_filters_button}
                  onClick={clearAll}
                >
                  Clear All Filters
                </Button>
              ) : null}
            </div>
          ) : null}
          <Collapse in={dropdownOpen}>
            <div id={dropdownId}>
              <div className={css.filter_button_container}>
                <div className={css.filters}>
                  <FilterSetFC
                    filters={filters}
                    toggleRow={toggleRow}
                    clearCol={clearCol}
                  />
                </div>
              </div>
            </div>
          </Collapse>
        </div>
      ) : null}
    </div>
  );
}
