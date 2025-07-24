import { TemplateCard } from "@/components/Template/TemplateCard/TemplateCard";
import { useMemo, useId, useLayoutEffect, useContext } from "react";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import css from "./Templates.module.css";
import { Row, Col, Button } from "react-bootstrap";
import { SearchFC } from "@/components/Search/Search";
import { Pagination } from "@/components/Pagination/Pagination";
import { PlaybookStatusWarning } from "@/components/PlaybookStatusWarning/PlaybookStatusWarning";
import { BsFileEarmarkArrowUpFill, BsPencilFill } from "react-icons/bs";
import { useTitle } from "@/hooks/useTitle";
import { Header } from "@/components/Header/Header";
import { useStartNewPlaybook } from "@/hooks/useStartNewPlaybook";
import { Section } from "@/components/Generic/Section";
import { useImportPlaybook } from "@/hooks/useImportPlaybook";
import { useSearch } from "@/hooks/useSearch";
import { buildTemplateSearch, TEMPLATE_SEARCH_CONFIG } from "./search";
import { GlobalTemplateModal } from "@/components/Template/TemplateModal/GlobalTemplateModal";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";

function useBodyOverflowXHidden() {
  // prevent featured container from overflowing (can't measure scrollbars)
  useLayoutEffect(() => {
    document.body.classList.add(css.body_fix);
    return () => {
      document.body.classList.remove(css.body_fix);
    };
  }, []);
}

const PAGE_TITLE = "Create Playbook from a Template";

function TheHeader() {
  const startNewPlaybook = useStartNewPlaybook();
  const importPlaybook = useImportPlaybook();

  return (
    <Row className={css.header_row}>
      <Col xs={12} lg={9}>
        <Header
          title={PAGE_TITLE}
          body={
            <p>
              A template is a pre-made Playbook representing a campaign, an APT,
              or a type of attack. Starting a Playbook from a Template can
              speed-up the process of responding to better-known attack
              profiles.
            </p>
          }
        />
      </Col>
      <Col as={Section} xs={12} lg={3} className={css.header_buttons}>
        <h2 className={css.header_buttons_title}>Other Options</h2>
        <Button
          variant="outline-primary"
          className={css.header_button}
          onClick={startNewPlaybook}
        >
          <BsPencilFill
            className={`${css.button_icon} bs-svg`}
            aria-hidden="true"
          />
          Start from Scratch
        </Button>
        <Button
          variant="outline-primary"
          className={css.header_button}
          onClick={importPlaybook}
        >
          <BsFileEarmarkArrowUpFill
            className={`${css.button_icon} bs-svg`}
            aria-hidden="true"
          />
          Import Playbook
        </Button>
      </Col>
    </Row>
  );
}

function TheFeaturedTemplates() {
  const templates = useAppSelector((s) => s.appdata.dataset.templates);
  const featured = useMemo(
    () => templates.filter((t) => t.featured),
    [templates]
  );

  const cards = featured.map((template) => {
    return (
      <TemplateCard key={template.id} titleLevel={3} template={template} />
    );
  });

  if (featured.length === 0) {
    return null;
  }

  return (
    <Row className={css.featured_templates_row}>
      <Col xs={12} className={css.featured_templates_col}>
        <div className={css.featured_header}>
          <h2>Featured Templates</h2>
          <p className={css.featured_header_description}>
            The following templates represent high-visibility, ongoing cyber
            incidents being actively monitored by CISA Threat Hunting.
          </p>
        </div>
        <div className={css.featured_templates_container}>
          {cards.length ? (
            cards
          ) : (
            <div className={css.no_templates_filler}>
              There are no featured templates
            </div>
          )}
        </div>
      </Col>
    </Row>
  );
}

function TheAllTemplateSearch() {
  const templates = useAppSelector((s) => s.appdata.dataset.templates);
  const { templateLUT } = useContext(DataLUTsContext);

  const search = useMemo(() => buildTemplateSearch(templates), [templates]);
  const { text, setText, filters, reduceFilters, results } = useSearch(search);

  const cards = results.map((r) => {
    const template = templateLUT[r.id];
    return (
      <TemplateCard key={template.id} titleLevel={4} template={template} />
    );
  });

  const prefaceId = useId();

  return (
    <section aria-describedby={prefaceId}>
      <h2 className={css.all_templates_header_title}>
        <span className="visually-hidden">Search</span> All Templates
      </h2>

      {/* Search */}
      <div className={css.search_wrap}>
        <span id={prefaceId} className={css.preface}>
          Search for a Template
        </span>

        <SearchFC
          config={TEMPLATE_SEARCH_CONFIG}
          text={text}
          setText={setText}
          filters={filters}
          reduceFilters={reduceFilters}
        />
      </div>

      {/* Search Results */}
      <section>
        <h3 className="visually-hidden">Search Results</h3>
        <Pagination itemName="Template" items={cards} perPage={5} flex />
      </section>
    </section>
  );
}

export function Templates() {
  useTitle(PAGE_TITLE);
  useBodyOverflowXHidden();
  return (
    <GlobalTemplateModal>
      <PlaybookStatusWarning pageName={PAGE_TITLE} expectOpen={false} />
      <TheHeader />
      <TheFeaturedTemplates />
      <TheAllTemplateSearch />
    </GlobalTemplateModal>
  );
}
