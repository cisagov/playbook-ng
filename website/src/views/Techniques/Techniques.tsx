import { useContext, useId, useMemo } from "react";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import css from "./Techniques.module.css";
import { SearchFC } from "@/components/Search/Search";
import { TechniqueCard } from "@/components/Techniques/TechniqueCard/TechniqueCard";
import { Cart } from "@/components/Cart/Cart";
import { Pagination } from "@/components/Pagination/Pagination";
import { Row, Col } from "react-bootstrap";
import { PlaybookStatusWarning } from "@/components/PlaybookStatusWarning/PlaybookStatusWarning";
import { TechIdExtractor } from "@/components/Techniques/TechIdExtractor/TechIdExtractor";
import { useTitle } from "@/hooks/useTitle";
import { usePageViewMode } from "@/hooks/usePageViewMode";
import { Header } from "@/components/Header/Header";
import { useSearch } from "@/hooks/useSearch";
import { SearchCacheContext } from "@/contexts/SearchCacheContext";
import { buildTechSearch, SEARCH_CONFIG } from "./search";
import { GlobalTechOrItemModal } from "@/components/TechItemModalBase/GlobalTechOrItemModal";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";

/**
 * Add ATT&CK Techniques Page
 *
 * - Allows searching for and filtering all loaded Techniques
 * - Allows getting Techniques from pasted text by ID
 * - Allows adding Techniques to Cart
 */
export function Techniques() {
  useTitle("Add Techniques");
  const viewMode = usePageViewMode();

  const attack = useAppSelector((s) => s.appdata.attack);
  const cachedMS = useContext(SearchCacheContext).techs;
  const search = useMemo(
    () => ({
      config: SEARCH_CONFIG,
      minisearch: cachedMS ?? buildTechSearch(attack).minisearch,
    }),
    [cachedMS, attack]
  );
  const { text, setText, filters, reduceFilters, results } = useSearch(search);

  const { techLUT } = useContext(DataLUTsContext);

  const resultCards = results.map((r) => {
    const tech = techLUT[r.id];
    return (
      <li key={tech.attackId}>
        <TechniqueCard tech={tech} match={r.match} />
      </li>
    );
  });

  const cart = (
    <Col xs={12} lg={3}>
      <Cart nav="Items >" />
    </Col>
  );

  const extractPrefaceId = useId();
  const searchPrefaceId = useId();

  return (
    <GlobalTechOrItemModal>
      <PlaybookStatusWarning pageName="Add Techniques" expectOpen={true} />
      <Row>
        {/* mobile: cart on top */}
        {viewMode === "mobile" ? cart : null}

        <Col xs={12} lg={9}>
          <Header
            title="Add ATT&CK Techniques"
            body={
              <p>
                <em>What has the adversary done?</em> Add observed ATT&amp;CK
                Techniques to your Playbook
              </p>
            }
          />

          {/* ID Extractor */}
          <section aria-describedby={extractPrefaceId}>
            <span id={extractPrefaceId} className={css.preface}>
              Add Techniques from Text
            </span>
            <TechIdExtractor />
          </section>

          {/* Search */}
          <section aria-describedby={searchPrefaceId}>
            <h2 className="visually-hidden">Search</h2>

            <div className={css.search_wrap}>
              <span id={searchPrefaceId} className={css.preface}>
                Search for Techniques
              </span>

              {/* Bar + Filters */}
              <SearchFC
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
              <Pagination
                itemName="Technique"
                items={resultCards}
                perPage={5}
              />
            </section>
          </section>
        </Col>

        {/* desktop: cart on bottom (right side) */}
        {viewMode === "desktop" ? cart : null}
      </Row>
    </GlobalTechOrItemModal>
  );
}
