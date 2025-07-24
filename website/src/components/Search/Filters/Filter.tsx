import css from "./Filter.module.css";
import { Button, Collapse, Form } from "react-bootstrap";
import { useCallback, useId, useRef } from "react";
import { useBool } from "@/hooks/useBool";
import { FilterCol, FilterRow, FilterSet } from "@/code/search-typing";

function FilterRowFC(args: {
  row: FilterRow;
  toggle: (rowName: string) => void;
}) {
  const { row, toggle } = args;
  const { name, on, count } = row;

  const toggleRow = useCallback(() => toggle(name), [toggle, name]);

  const id = useId();

  return (
    <Form.Check className={css.checkbox_item} id={id} type="checkbox">
      <Form.Check.Input
        bsPrefix="override"
        type="checkbox"
        className={css.checkbox_item_input}
        onChange={toggleRow}
        checked={on}
        value={name}
      />
      <Form.Check.Label className={css.checkbox_item_label}>
        {name} ({count})
      </Form.Check.Label>
    </Form.Check>
  );
}

export function FilterColFC<FilterField extends string>(args: {
  col: FilterCol<FilterField>;
  toggle: (colName: FilterField, rowName: string) => void;
  clear: (colName: FilterField) => void;
}) {
  const { col, toggle, clear } = args;
  const { name: colName, rows } = col;

  // v-- button click controls this - instantly updates collapse
  const expanded = useBool(false);
  // v-- collapse callbacks update button appearance
  const btnExpanded = useBool(false);

  const toggleRow = useCallback(
    (rowName: string) => toggle(colName, rowName),
    [toggle, colName]
  );

  const clearCol = useCallback(() => {
    clear(colName);
    expanded.setFalse();
  }, [clear, colName, expanded]);

  const numRows = rows.length;
  const numRowsOn = rows.filter((row) => row.on).length;

  const rootDivOnBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      // null ref -> ignore
      if (rootDiv.current === null) {
        return;
      }
      // focus left entire div -> close filter dropdown
      else if (!rootDiv.current.contains(e.relatedTarget)) {
        expanded.setFalse();
      }
    },
    [expanded]
  );

  const dropdownId = useId();

  const rowListItems = rows.map((row) => (
    <li key={row.name} className={css.checkbox_list_item}>
      <FilterRowFC row={row} toggle={toggleRow} />
    </li>
  ));

  const rootDiv = useRef<HTMLDivElement>(null);

  return (
    <div
      className={css.filter_container}
      tabIndex={-1}
      ref={rootDiv}
      onBlur={rootDivOnBlur}
    >
      <Button
        variant="outline-primary"
        onClick={expanded.toggle}
        className={
          css.filter_button +
          " " +
          (btnExpanded.val
            ? css.filter_button_expanded
            : css.filter_button_closed)
        }
        aria-controls={dropdownId}
        aria-expanded={expanded.val}
        active={btnExpanded.val}
        disabled={numRows === 0}
      >
        {`${colName} (${numRowsOn} / ${numRows})`}
      </Button>
      <Collapse
        in={expanded.val}
        onEnter={btnExpanded.setTrue}
        onExited={btnExpanded.setFalse}
      >
        <div id={dropdownId} className={css.checkbox_container}>
          <div className={css.checkbox_scroll}>
            {numRowsOn ? (
              <Button variant="link" onClick={clearCol}>
                Clear Filter
              </Button>
            ) : null}
            <ul className="unstyled_list">{rowListItems}</ul>
          </div>
        </div>
      </Collapse>
    </div>
  );
}

export function FilterSetFC<FilterField extends string>(args: {
  filters: FilterSet<FilterField>;
  toggleRow: (colName: FilterField, rowName: string) => void;
  clearCol: (colName: FilterField) => void;
}) {
  const { filters, toggleRow, clearCol } = args;

  return (
    <>
      {filters.map((col) => (
        <FilterColFC<FilterField>
          key={col.name}
          col={col}
          toggle={toggleRow}
          clear={clearCol}
        />
      ))}
    </>
  );
}
