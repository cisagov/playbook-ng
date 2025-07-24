import css from "./Pagination.module.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pagination as BsPagination } from "react-bootstrap";
import { quantity } from "@playbook-ng/shared/src/base/utils/string";
import { NoResultsAlert } from "../NoResultsAlert/NoResultsAlert";

function JumpToPageNum(args: {
  num: number;
  active: boolean;
  onClick: (num: number) => void;
}) {
  const { num, active, onClick } = args;
  const handleClick = useCallback(() => onClick(num), [onClick, num]);
  return (
    <BsPagination.Item
      active={active}
      className={css.pagination_item}
      onClick={handleClick}
    >
      {num}
    </BsPagination.Item>
  );
}

function Buttons(args: {
  page: number;
  setPage: (p: number) => void;
  numItems: number;
  perPage: number;
}) {
  const { page, setPage, numItems, perPage } = args;

  const maxPage = useMemo(
    () => Math.ceil(numItems / perPage),
    [numItems, perPage]
  );

  const { minJump, maxJump } = useMemo(() => {
    let minJump = page;
    let maxJump = page;
    while (maxJump - minJump < Math.min(maxPage - 1, 4)) {
      if (minJump > 1) minJump--;
      if (maxJump < maxPage) maxJump++;
    }
    return { minJump, maxJump };
  }, [maxPage, page]);

  const gotoFirst = useCallback(() => setPage(1), [setPage]);
  const gotoLast = useCallback(() => setPage(maxPage), [setPage, maxPage]);
  const gotoPrev = useCallback(() => setPage(page - 1), [setPage, page]);
  const gotoNext = useCallback(() => setPage(page + 1), [setPage, page]);

  const buttons = [];

  buttons.push(
    <BsPagination.First
      key={"first"}
      className={css.pagination_item}
      onClick={gotoFirst}
      disabled={page === 1}
    />
  );
  buttons.push(
    <BsPagination.Prev
      key={"prev"}
      className={css.pagination_item}
      onClick={gotoPrev}
      disabled={page === 1}
    />
  );
  if (minJump > 1) {
    buttons.push(
      <BsPagination.Ellipsis
        key={"start_ellipsis"}
        className={css.pagination_item}
        disabled
      />
    );
  }
  for (let pageNum = minJump; pageNum <= maxJump; pageNum++) {
    buttons.push(
      <JumpToPageNum
        key={pageNum}
        num={pageNum}
        active={pageNum === page}
        onClick={setPage}
      />
    );
  }
  if (maxJump < maxPage) {
    buttons.push(
      <BsPagination.Ellipsis
        key={"end_ellipsis"}
        className={css.pagination_item}
        disabled
      />
    );
  }
  buttons.push(
    <BsPagination.Next
      key={"next"}
      className={css.pagination_item}
      onClick={gotoNext}
      disabled={page === maxPage}
    />
  );
  buttons.push(
    <BsPagination.Last
      key={"last"}
      className={css.pagination_item}
      onClick={gotoLast}
      disabled={page === maxPage}
    />
  );

  return buttons;
}

export function Pagination(args: {
  itemName: string;
  items: React.ReactNode[];
  perPage: number;
  flex?: boolean;
}) {
  const { itemName, items, perPage } = args;
  const flex = args.flex ?? false;

  const [page, setPage] = useState<number>(1);
  useEffect(() => setPage(1), [items]);

  const numItems = items.length;
  const pageItems = items.slice(
    (page - 1) * perPage,
    Math.min(page * perPage, numItems)
  );

  if (numItems > 0) {
    return (
      <div>
        <div className={css.quantity}>{quantity(numItems, itemName)}</div>
        <div className={css.items_outer}>
          <ul className={flex ? css.items_as_flex : css.items}>{pageItems}</ul>
        </div>
        {numItems > perPage ? (
          <div className={css.pagination_outer}>
            <BsPagination className={css.pagination}>
              <Buttons
                page={page}
                setPage={setPage}
                numItems={numItems}
                perPage={perPage}
              />
            </BsPagination>
          </div>
        ) : null}
      </div>
    );
  } else {
    return <NoResultsAlert />;
  }
}
