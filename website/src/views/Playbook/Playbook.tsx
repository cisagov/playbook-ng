import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import css from "./Playbook.module.css";
import { PlaybookStatusWarning } from "@/components/PlaybookStatusWarning/PlaybookStatusWarning";
import { ExportModal } from "@/components/Playbook/ExportModal/ExportModal";
import {
  useAppDispatch,
  useAppSelector,
} from "@playbook-ng/shared-web/src/store/hooks";
import { useNavigate } from "react-router-dom";
import React, {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { setPlaybookTitle } from "@playbook-ng/shared-web/src/store/playbookSlice";
import { useBool, UsedBool } from "@/hooks/useBool";
import { useTitle } from "@/hooks/useTitle";
import { getItemToTechs } from "@playbook-ng/shared/src/playbook/utils/transform";
import { BsCheck, BsPencilSquare, BsPlusLg, BsX } from "react-icons/bs";
import { DEFAULT_PLAYBOOK_TITLE } from "@playbook-ng/shared/src/playbook/constants";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { SearchFC } from "@/components/Search/Search";
import { Content } from "@/components/Playbook/Content/Content";
import { JumpToMenu } from "@/components/Playbook/JumpToMenu/JumpToMenu";
import { Nest } from "@/components/Playbook/nest";
import { Section } from "@/components/Generic/Section";
import { getUsedTemplateInfo } from "@playbook-ng/shared/src/playbook/utils/template-info";
import { joinTechName } from "@playbook-ng/shared/src/attack/objects";
import { useSearch } from "@/hooks/useSearch";
import { PlaybookSearchContext } from "@/contexts/PlaybookSearchContext";
import { PB_SEARCH_CONFIG, PBSearch } from "./search";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";
import { PlaybookDeleteModalControlContext } from "@/components/DeleteModals/PlaybookDeleteModal/PlaybookDeleteModalControlContext";
import { setPlaybookStatusWarningEn } from "@playbook-ng/shared-web/src/store/sessconfSlice";
import { IgnoredItems } from "@/components/Playbook/IgnoredItems/IgnoredItems";
import {
  ttiItemIDs,
  ttiTechIDs,
} from "@playbook-ng/shared/src/playbook/helpers";
import { NoResultsAlert } from "@/components/NoResultsAlert/NoResultsAlert";

/**
 * Editable H1 Title for Playbook
 *
 * - Has "Playbook Title" to visually preface what the text is
 * - Has editing + normal views
 *   - editing: is input
 *   - viewing: is H1
 * - Has default replacement for empty text
 * - Supports [Esc] to cancel, [Enter] to accept changes
 */
function EditableTitle(args: { title: string; setTitle: (s: string) => void }) {
  const { title, setTitle } = args;
  const [editing, setEditing] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>("");

  const firstRender = useRef<boolean>(true);
  const editInputRef = useRef<HTMLInputElement>(null);
  const beginEditBtnRef = useRef<HTMLButtonElement>(null);

  // when edit mode is entered or left
  // set focus on [input box] or [begin edit button]
  // don't do for initial render
  //
  // React debug StrictMode causes this to focus the edit button on view load
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (editing) editInputRef.current?.focus();
    else beginEditBtnRef.current?.focus();
  }, [editing]);

  const beginEdit = useCallback(() => {
    setEditedTitle(title);
    setEditing(true);
  }, [title]);

  const confirmEdit = useCallback(() => {
    setTitle(editedTitle.trim() || DEFAULT_PLAYBOOK_TITLE);
    setEditing(false);
  }, [editedTitle, setTitle]);

  const cancelEdit = useCallback(() => setEditing(false), []);

  const inputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setEditedTitle(e.target.value),
    []
  );

  const inputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") confirmEdit();
      else if (e.key === "Escape") cancelEdit();
    },
    [cancelEdit, confirmEdit]
  );

  const beginEditBtnKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") beginEdit();
    },
    [beginEdit]
  );

  const beginEditBtnPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 0) beginEdit();
    },
    [beginEdit]
  );

  const inputId = useId();
  const labelId = useId();

  if (editing)
    return (
      <div>
        <label htmlFor={inputId} id={labelId} className={css.title_preface}>
          Playbook Title
        </label>
        <InputGroup className="mb-2">
          {/* title input */}
          <Form.Control
            id={inputId}
            ref={editInputRef}
            className={css.title_text_input}
            placeholder="Playbook Title"
            value={editedTitle}
            onChange={inputChange}
            onKeyDown={inputKeyDown}
          />

          {/* confirm */}
          <Button
            variant="outline-primary"
            onClick={confirmEdit}
            aria-label="confirm setting new title"
          >
            <BsCheck aria-hidden={true} className={`bs-svg`} />
          </Button>

          {/* cancel */}
          <Button
            variant="outline-primary"
            onClick={cancelEdit}
            aria-label="cancel setting new title"
          >
            <BsX aria-hidden={true} className={`bs-svg`} />
          </Button>
        </InputGroup>
      </div>
    );
  else
    return (
      <div>
        <span id={labelId} className={css.title_preface}>
          Playbook Title
        </span>
        <div className={css.header_title}>
          {/* display title */}
          <h1 className={css.header_title_text} aria-describedby={labelId}>
            {title}
          </h1>

          {/* edit */}
          <Button
            ref={beginEditBtnRef}
            className={css.title_edit_button}
            variant="outline-primary"
            onKeyDown={beginEditBtnKeyDown}
            onPointerDown={beginEditBtnPointerDown}
            aria-label="edit playbook title"
          >
            <BsPencilSquare aria-hidden={true} className={`bs-svg`} />
          </Button>
        </div>
      </div>
    );
}

/**
 * Playbook Header - Everything but the Content
 *
 * - Links to [Add Techs] and [Add Items] Pages
 * - Options to [Clear] or [Export] Playbook
 * - Lists metadata (version, template, created/updated times)
 * - Holds searchbar + filters
 * - Holds group by Tech or Items selector
 */
function PlaybookHeader(args: {
  children: React.ReactNode;
  viewItemToTechs: UsedBool;
}) {
  const { children, viewItemToTechs } = args;

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const itemType = useAppSelector((s) => s.appdata.dataset.item_type);
  const playbook = useAppSelector((s) => s.playbook);
  const dataset = useAppSelector((s) => s.appdata.dataset);

  const templateInfo = useMemo(
    () => getUsedTemplateInfo({ playbook, dataset }),
    [playbook, dataset]
  );

  const setTitle = useCallback(
    (title: string) => {
      dispatch(setPlaybookTitle(title));
    },
    [dispatch]
  );

  const searchPrefaceId = useId();

  const { open: bookDelete } = useContext(PlaybookDeleteModalControlContext);
  const openClearPlaybook = useCallback(
    () =>
      bookDelete({
        type: "close-playbook",
        callback: () => {
          dispatch(setPlaybookStatusWarningEn(false));
          navigate("/");
        },
      }),
    [bookDelete, dispatch, navigate]
  );

  const exportModalOpen = useBool(false);

  const goToTechs = useCallback(() => navigate("/techniques"), [navigate]);
  const goToItems = useCallback(() => navigate("/items"), [navigate]);

  return (
    <>
      <Row>
        {/* Title */}
        <Col xs={12} className={css.title_col}>
          <EditableTitle title={playbook.title} setTitle={setTitle} />
        </Col>

        {/* Meta: Version / Template / Created / Modified */}
        <Col xs={12} className={css.metadata_col}>
          <h2 className="visually-hidden">Metadata</h2>
          <div>
            <span className={css.metadata_label}>Version:&nbsp;</span>
            <span>{playbook.version}&nbsp;</span>
            <InfoTooltip text="The version is incremented each time a playbook is exported from Playbook-NG" />
          </div>
          <div>
            <span className={css.metadata_label}>Template:&nbsp;</span>
            <span>{templateInfo.display}&nbsp;</span>
          </div>
          <div>
            <span className={css.metadata_label}>Created:&nbsp;</span>
            <span>
              {new Intl.DateTimeFormat().format(new Date(playbook.created))}
            </span>
          </div>
          <div>
            <span className={css.metadata_label}>Updated:&nbsp;</span>
            <span>
              {new Intl.DateTimeFormat().format(new Date(playbook.updated))}
            </span>
          </div>
        </Col>

        {/* Buttons */}
        <Col xs={12} className={css.buttons_col}>
          <h2 className="visually-hidden">Export, Edit, or Close</h2>
          <div className={css.buttons_subcol}>
            <Button
              variant="outline-primary"
              className={css.header_button}
              onClick={goToTechs}
            >
              <BsPlusLg className={`bs-svg`} aria-hidden="true" /> add
              techniques
            </Button>
            <Button
              variant="outline-primary"
              className={css.header_button}
              onClick={goToItems}
            >
              <BsPlusLg className={`bs-svg`} aria-hidden="true" /> add{" "}
              {itemType}s
            </Button>
          </div>
          <div className={css.buttons_subcol}>
            <Button
              variant="outline-danger"
              onClick={openClearPlaybook}
              className={`${css.header_button}`}
            >
              Clear Playbook
            </Button>
            <Button
              variant="primary"
              onClick={exportModalOpen.setTrue}
              className={css.header_button}
            >
              export playbook
            </Button>
          </div>
        </Col>

        <Col as={Section} xs={12}>
          <h2 className="visually-hidden">View Ignored {itemType}s</h2>
          <IgnoredItems />
        </Col>

        {/* Search + Platform Filters */}
        <Col as={Section} xs={12} aria-describedby={searchPrefaceId}>
          <h2 className="visually-hidden">Search</h2>

          <div className={css.search_wrap}>
            <span id={searchPrefaceId} className={css.title_preface}>
              Search within Playbook
            </span>

            {children}
          </div>
        </Col>

        <Col xs={12}>
          <h2 className="visually-hidden">View Mode</h2>
          <Form>
            <Form.Check
              type="switch"
              id="view-mode-switch"
              label="Group by Techniques"
              onChange={viewItemToTechs.toggle}
              checked={!viewItemToTechs.val}
            />
          </Form>
        </Col>
      </Row>
      <ExportModal
        open={exportModalOpen.val}
        handle_close_modal={exportModalOpen.setFalse}
      />
    </>
  );
}

/**
 * Playbook Review Page Specific .focus()
 *
 * Adjusts offset in Mobile mobile to account for Quick Navigation menu button
 *
 * Arguments:
 * - id: ID of element to scroll to / focus
 * - skipScroll: setting this true will skip scrolling (focus still set)
 */
function scrollAndFocusId(id: string, skipScroll?: boolean) {
  const scroll = !(skipScroll ?? false);
  const el = document.getElementById(id);
  if (el) {
    if (scroll) {
      window.scrollTo({
        behavior: "instant",
        top:
          el.getBoundingClientRect().top +
          window.scrollY -
          (window.innerWidth < 992 ? 24 : 0),
      });
    }
    el.focus({ preventScroll: true });
  }
}

/**
 * Playbook Review Page
 *
 * - Allows viewing, searching, filtering, exporting, and clearing contents of the Playbook
 */
export function Playbook() {
  const title = "Review Playbook";
  useTitle(title);

  const dataset = useAppSelector((s) => s.appdata.dataset);
  const allItemType = dataset.item_type;

  const { techLUT, itemLUT } = useContext(DataLUTsContext);

  const playbook = useAppSelector((s) => s.playbook);
  const techToItems = playbook.tech_to_items;
  const pbTechIds = useMemo(() => ttiTechIDs(techToItems), [techToItems]);
  const pbItemIds = useMemo(() => ttiItemIDs(techToItems), [techToItems]);
  const itemToTechs = useMemo(() => getItemToTechs(techToItems), [techToItems]);

  const miniwrap = useContext(PlaybookSearchContext);
  const search: PBSearch = useMemo(() => {
    const { mini } = miniwrap;
    return {
      config: PB_SEARCH_CONFIG,
      minisearch: mini,
    };
  }, [miniwrap]);
  const { text, setText, filters, reduceFilters, results } = useSearch(search);

  const didSearchOrFilter = useMemo(() => {
    const didSearch = text.length > 0;
    const didFilter = filters.some((col) => col.rows.some((row) => row.on));
    return didSearch || didFilter;
  }, [text, filters]);

  /** View Mode
   * - true : Item -> Techs
   * - false: Tech -> Items
   */
  const viewItemToTechs = useBool(true);

  // generate playbook content root
  const root = useMemo(() => {
    // build look-up for result scores
    const scoreLUT = (() => {
      const lut: { [id: string]: number } = {};
      results.forEach((r) => (lut[r.id] = r.score));
      return lut;
    })();
    const scoreOf = (id: string) => scoreLUT[id] ?? 0;

    // make root node
    const root: Nest.L1 = {
      id: [Nest.ROOT_ID],
      type: "root",
      entries: [],
    };

    // item -> techs
    if (viewItemToTechs.val) {
      root.entries = pbItemIds.map((itemId) => {
        const item = itemLUT[itemId];

        const children: Nest.L3Tech[] = itemToTechs[itemId].techs.map(
          ({ id: techId }) => {
            const tech = techLUT[techId];
            const name = joinTechName(tech.name);
            const score = scoreOf(tech.attackId);
            return {
              id: [...root.id, item.id, tech.attackId],
              name,
              type: "tech",
              score,
              matched: score > 0,
              entries: [],
            };
          }
        );

        const score = scoreOf(item.id);
        const parent: Nest.L2Item = {
          id: [...root.id, item.id],
          name: item.name,
          type: "item",
          score: Math.max(score, ...children.map((c) => c.score)),
          matched: score > 0,
          entries: children,
        };
        return parent;
      });

      // unmapped -> techs
      root.entries.push(
        (() => {
          const children: Nest.L3UnmappedTech[] =
            itemToTechs.unmapped.techs.map(({ id: techId }) => {
              const tech = techLUT[techId];
              const name = joinTechName(tech.name);
              const score = scoreOf(tech.attackId);
              return {
                id: [...root.id, Nest.UNMAPPED_TECHS_ID, tech.attackId],
                name,
                type: "tech",
                score,
                matched: score > 0,
                entries: [],
              };
            });

          const parent: Nest.L2UnmappedTechs = {
            id: [...root.id, Nest.UNMAPPED_TECHS_ID],
            name: "Unmapped Techniques",
            type: Nest.UNMAPPED_TECHS_ID,
            score: Math.max(0, ...children.map((c) => c.score)),
            matched: false,
            entries: children,
          };
          return parent;
        })()
      );
    }
    // tech -> items
    else {
      root.entries = pbTechIds.map((techId) => {
        const tech = techLUT[techId];
        const name = joinTechName(tech.name);

        const children: Nest.L3Item[] = techToItems[tech.attackId].items.map(
          ({ id: itemId }) => {
            const item = itemLUT[itemId];
            const score = scoreOf(item.id);
            return {
              id: [...root.id, tech.attackId, item.id],
              name: item.name,
              type: "item",
              score,
              matched: score > 0,
              entries: [],
            };
          }
        );

        const score = scoreOf(tech.attackId);
        const parent: Nest.L2Tech = {
          id: [...root.id, tech.attackId],
          name,
          type: "tech",
          score: Math.max(score, ...children.map((c) => c.score)),
          matched: score > 0,
          entries: children,
        };
        return parent;
      });

      // unmapped -> items
      root.entries.push(
        (() => {
          const children: Nest.L3AdditionalItem[] =
            techToItems.unmapped.items.map(({ id: itemId }) => {
              const item = itemLUT[itemId];
              const score = scoreOf(item.id);
              return {
                id: [...root.id, Nest.ADDITIONAL_ITEMS_ID, item.id],
                name: item.name,
                type: "item",
                score,
                matched: score > 0,
                entries: [],
              };
            });

          const parent: Nest.L2AdditionalItems = {
            id: [...root.id, Nest.ADDITIONAL_ITEMS_ID],
            name: `Additional ${allItemType}s`,
            type: Nest.ADDITIONAL_ITEMS_ID,
            score: Math.max(0, ...children.map((c) => c.score)),
            matched: false,
            entries: children,
          };
          return parent;
        })()
      );
    }

    // search:
    if (didSearchOrFilter) {
      // hide unmapped section during search
      root.entries.pop();

      // cull neighborhoods (parent + kids) that had no hits at all
      root.entries = root.entries.filter((e) => e.score > 0);

      // sort all by score descending
      root.entries.sort((a, b) => b.score - a.score);
      root.entries.forEach((e) => e.entries.sort((a, b) => b.score - a.score));
    }
    // default: { keep all sections in cart-added-order }

    return root;
  }, [
    results,
    allItemType,
    didSearchOrFilter,
    itemLUT,
    itemToTechs,
    pbItemIds,
    pbTechIds,
    techLUT,
    techToItems,
    viewItemToTechs.val,
  ]);

  const viewParentType = viewItemToTechs.val ? allItemType : "Technique";

  return (
    <>
      <PlaybookStatusWarning pageName={title} expectOpen={true} />
      <Row>
        <JumpToMenu root={root} scrollToId={scrollAndFocusId} />

        <Col xs={12} lg={9} className={css.content_col}>
          <PlaybookHeader viewItemToTechs={viewItemToTechs}>
            <SearchFC
              config={PB_SEARCH_CONFIG}
              text={text}
              setText={setText}
              filters={filters}
              reduceFilters={reduceFilters}
            />
          </PlaybookHeader>

          <Row
            id={Nest.htmlId(root)}
            tabIndex={-1}
            className={css.root_container}
          >
            <h2 className="visually-hidden">Content ({viewParentType}s)</h2>

            {/* results if they exist */}
            {root.entries.map((entry) => (
              <Content
                key={Nest.htmlId(entry)}
                entry={entry}
                scrollAndFocusId={scrollAndFocusId}
                matchBannerOn={didSearchOrFilter}
              />
            ))}

            {/* warning if they don't */}
            {root.entries.length === 0 ? (
              <NoResultsAlert className={css.no_results_alert} />
            ) : null}
          </Row>
        </Col>
      </Row>
    </>
  );
}
