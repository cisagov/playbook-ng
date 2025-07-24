import css from "./JumpToMenu.module.css";

import { Col, Collapse, Offcanvas, Stack } from "react-bootstrap";
import { Nest } from "../nest";
import { ReactNode, useCallback, useEffect, useId, useRef } from "react";
import { useBool } from "@/hooks/useBool";
import { usePageViewMode } from "@/hooks/usePageViewMode";
import {
  BsChevronDown,
  BsChevronRight,
  BsSquareFill,
  BsTriangleFill,
} from "react-icons/bs";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { OffcanvasTrapFocus } from "@playbook-ng/shared-web/src/components/TrapFocus/TrapFocus";

/** Creates the Icon for an entry */
function EntryIcon(args: { type: (Nest.L2 | Nest.L3)["type"] }) {
  const { type } = args;
  let icon = null;

  if (type === "tech") {
    icon = (
      <BsTriangleFill
        className={`${css.entry_icon} ${css.tech_icon} bs-svg`}
        aria-hidden={true}
      />
    );
  } else if (type === "item") {
    icon = (
      <BsSquareFill
        className={`${css.entry_icon} ${css.item_icon} bs-svg`}
        aria-hidden={true}
      />
    );
  }

  return icon;
}

/** A lookup of functions used to produce descriptions for entries */
const ENTRY_DESCRIPTIONS: {
  readonly [type in (Nest.L2 | Nest.L3)["type"]]: (
    itemTypeName: string
  ) => string;
} = {
  tech: (_) => "A Technique",
  item: (i) => `A(n) ${i}`,
  [Nest.ADDITIONAL_ITEMS_ID]: (_) =>
    "Added in addition to those provided by Technique mappings",
  [Nest.UNMAPPED_TECHS_ID]: (i) => `Techniques not associated with any ${i}s`,
} as const;

/** A clean interface over ENTRY_DESCRIPTIONS */
function describeEntry(entry: Nest.L2 | Nest.L3, itemTypeName: string): string {
  return ENTRY_DESCRIPTIONS[entry.type](itemTypeName);
}

/** Creates a legend/key of symbols for Techs/Items */
function IconLegend() {
  const itemTypeName = useAppSelector((s) => s.appdata.dataset.item_type);
  return (
    <Stack direction="vertical" aria-hidden={true}>
      <span>
        <EntryIcon type="item" />{" "}
        <span className={css.item_icon}>{itemTypeName}</span>
      </span>
      <span>
        <EntryIcon type="tech" />{" "}
        <span className={css.tech_icon}>Technique</span>
      </span>
    </Stack>
  );
}

function ChildEntry(args: { entry: Nest.L3; gotoId: (id: string) => void }) {
  const { entry, gotoId } = args;
  const onClick = useCallback(
    () => gotoId(Nest.htmlId(entry)),
    [entry, gotoId]
  );

  const itemTypeName = useAppSelector((s) => s.appdata.dataset.item_type);
  const desc = describeEntry(entry, itemTypeName);

  return (
    <button
      className={`${css.entry_btn} ${css.child_btn}`}
      type="button"
      onClick={onClick}
      aria-description={desc}
    >
      <EntryIcon type={entry.type} /> {entry.name}
    </button>
  );
}

function ParentEntry(args: { entry: Nest.L2; gotoId: (id: string) => void }) {
  const { entry, gotoId } = args;
  const onClick = useCallback(
    () => gotoId(Nest.htmlId(entry)),
    [entry, gotoId]
  );

  const itemTypeName = useAppSelector((s) => s.appdata.dataset.item_type);
  const desc = describeEntry(entry, itemTypeName);

  const hasChildren = entry.entries.length > 0;
  const expanded = useBool(false);
  const childListId = useId();

  return (
    <div>
      <div className={css.parent_and_expand}>
        {/* parent */}
        <button
          className={`${css.entry_btn} ${css.parent_btn}`}
          type="button"
          onClick={onClick}
          aria-description={desc}
        >
          <EntryIcon type={entry.type} /> {entry.name}
        </button>

        {/* expander */}
        {hasChildren ? (
          <button
            className={css.expand_btn}
            type="button"
            onClick={expanded.toggle}
            aria-controls={childListId}
            aria-expanded={expanded.val}
            aria-label={`Show/hide ${entry.name}'s children`}
          >
            {expanded.val ? (
              <BsChevronDown className="bs-svg" aria-hidden="true" />
            ) : (
              <BsChevronRight className="bs-svg" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      {/* children */}
      {hasChildren ? (
        <Collapse in={expanded.val}>
          <div className={css.spacer_and_child_list}>
            <div className={css.spacer_div} />
            <ul id={childListId} className={css.list_of_children}>
              {entry.entries.map((child) => (
                <li key={Nest.htmlId(child)}>
                  <ChildEntry entry={child} gotoId={gotoId} />
                </li>
              ))}
            </ul>
          </div>
        </Collapse>
      ) : null}
    </div>
  );
}

/** An <h2> as a React component - used for Offcanvas.Title as={} */
function H2(args: { children: ReactNode; className: string | undefined }) {
  const { children, className } = args;
  return <h2 className={className}>{children}</h2>;
}

export function JumpToMenu(args: {
  root: Nest.L1;
  scrollToId: (id: string) => void;
}) {
  const { root, scrollToId } = args;

  const mobileOpen = useBool(false);
  const pageMode = usePageViewMode();

  // resizing to desktop : close mobile menu
  useEffect(() => {
    if (pageMode === "desktop") mobileOpen.setFalse();
  }, [pageMode, mobileOpen]);

  // mobile has to request a gotoId that occurs after the offcanvas closes
  const mobileRequestedGotoId = useRef<string | null>(null);

  const gotoId = useCallback(
    (id: string) => {
      // desktop : immediate scroll works
      if (pageMode === "desktop") {
        scrollToId(id);
      }
      // mobile : need to delay scroll until after menu closes
      else if (pageMode === "mobile") {
        mobileRequestedGotoId.current = id;
        mobileOpen.setFalse();
      }
    },
    [mobileOpen, pageMode, scrollToId]
  );

  const mobileMenuId = useId();

  // mobile menu closed : perform outstanding gotoId (or refocus menu)
  const onMobileMenuClose = useCallback(() => {
    const id = mobileRequestedGotoId.current;
    mobileRequestedGotoId.current = null;
    if (id === null) {
      document.getElementById(mobileMenuId)?.focus({ preventScroll: true });
    } else {
      // allows full menu close / existence of sticky button before scrolling
      setTimeout(() => scrollToId(id), 1);
    }
  }, [mobileMenuId, scrollToId]);

  // menu list
  const parentList = (
    <ul className={css.list_of_parents}>
      {root.entries.map((parent) => (
        <li key={Nest.htmlId(parent)}>
          <ParentEntry entry={parent} gotoId={gotoId} />
        </li>
      ))}
    </ul>
  );

  const itemTypeName = useAppSelector((s) => s.appdata.dataset.item_type);
  const titleContent = (
    <>
      Jump To
      <span className="visually-hidden"> Technique or {itemTypeName}</span>
    </>
  );

  return (
    <>
      {/* desktop: content as col-3 */}
      {pageMode === "desktop" ? (
        <Col lg={3} className={css.desktop_col}>
          <div className={css.desktop_sticky}>
            <Stack direction="vertical" className="mb-2">
              <h2 className={css.title}>{titleContent}</h2>
              <IconLegend />
            </Stack>
            <div className={css.desktop_listwrap}>{parentList}</div>
          </div>
        </Col>
      ) : null}

      {/* mobile: offcanvas + button to open it */}
      {pageMode === "mobile" ? (
        <>
          <OffcanvasTrapFocus
            show={mobileOpen.val}
            onHide={mobileOpen.setFalse}
            scroll={false}
            restoreFocus={false}
            onExited={onMobileMenuClose}
          >
            <Offcanvas.Header closeButton>
              <Stack direction="vertical">
                <Offcanvas.Title as={H2} className={css.title}>
                  {titleContent}
                </Offcanvas.Title>
                <IconLegend />
              </Stack>
            </Offcanvas.Header>
            <Offcanvas.Body className="pt-0">{parentList}</Offcanvas.Body>
          </OffcanvasTrapFocus>

          <button
            id={mobileMenuId}
            type="button"
            className={css.mobile_open_button}
            onClick={mobileOpen.setTrue}
          >
            Quick Navigation
          </button>
        </>
      ) : null}
    </>
  );
}
