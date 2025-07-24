import { PlaybookStatusWarning } from "@/components/PlaybookStatusWarning/PlaybookStatusWarning";
import css from "./Items.module.css";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { Col, Row } from "react-bootstrap";
import { useContext, useId, useMemo } from "react";
import { Cart } from "@/components/Cart/Cart";
import { ItemCard } from "@/components/Item/ItemCard/ItemCard";
import { SearchFC } from "@/components/Search/Search";
import { Pagination } from "@/components/Pagination/Pagination";
import { useTitle } from "@/hooks/useTitle";
import { usePageViewMode } from "@/hooks/usePageViewMode";
import { Header } from "@/components/Header/Header";
import { useSearch } from "@/hooks/useSearch";
import { SearchCacheContext } from "@/contexts/SearchCacheContext";
import { buildItemSearch, SEARCH_CONFIG } from "./search";
import { GlobalTechOrItemModal } from "@/components/TechItemModalBase/GlobalTechOrItemModal";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";

export function Items() {
  const dataset = useAppSelector((s) => s.appdata.dataset);
  const itemType = dataset.item_type;

  const title = `Add ${itemType}s`;
  useTitle(title);

  const viewMode = usePageViewMode();

  const { itemLUT } = useContext(DataLUTsContext);

  const cachedMS = useContext(SearchCacheContext).items;
  const search = useMemo(
    () => ({
      config: SEARCH_CONFIG,
      minisearch: cachedMS ?? buildItemSearch(dataset).minisearch,
    }),
    [cachedMS, dataset]
  );
  const { text, setText, filters, reduceFilters, results } = useSearch(search);

  const resultCards = results.map((r) => {
    const item = itemLUT[r.id];
    return (
      <li key={item.id}>
        <ItemCard itemAndTech={{ item, techId: "unmapped" }} match={r.match} />
      </li>
    );
  });

  const cart = (
    <Col xs={12} lg={3}>
      <Cart nav="< Techs | Review >" />
    </Col>
  );

  const searchPrefaceId = useId();

  return (
    <GlobalTechOrItemModal>
      <PlaybookStatusWarning pageName={title} expectOpen={true} />
      <Row>
        {/* mobile: cart on top */}
        {viewMode === "mobile" ? cart : null}

        {/* main */}
        <Col xs={12} lg={9}>
          {/* header */}
          <Header
            title={<>Add Additional {itemType}s</>}
            body={
              <p>
                Add {itemType}s, (
                <em>in addition to those provided by Technique mappings</em>),
                to your Playbook
              </p>
            }
          />

          {/* Search */}
          <section aria-describedby={searchPrefaceId}>
            <h2 className="visually-hidden">Search</h2>

            <div className={css.search_wrap}>
              <span id={searchPrefaceId} className={css.preface}>
                Search for {itemType}s
              </span>

              {/* Bar + Filters */}
              <SearchFC
                variant="green"
                config={SEARCH_CONFIG}
                text={text}
                setText={setText}
                filters={filters}
                reduceFilters={reduceFilters}
              />
            </div>

            {/* Results */}
            <section>
              <h3 className="visually-hidden">Search Results</h3>
              <Pagination itemName={itemType} items={resultCards} perPage={5} />
            </section>
          </section>
        </Col>

        {/* desktop: cart on bottom (right side) */}
        {viewMode === "desktop" ? cart : null}
      </Row>
    </GlobalTechOrItemModal>
  );
}
