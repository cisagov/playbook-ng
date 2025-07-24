import { Nest } from "../nest";
import css from "./Content.module.css";
import { useCallback, useContext, useId, useMemo } from "react";
import { useBool, UsedBool } from "@/hooks/useBool";
import { Button, Col, Collapse, Row } from "react-bootstrap";
import { quantity } from "@playbook-ng/shared/src/base/utils/string";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import {
  indentMdHeadings,
  renderCitations,
} from "@playbook-ng/shared/src/base/utils/rendering";
import { useShortDatasetName } from "@playbook-ng/shared-web/src/hooks/useShortDatasetName";
import { Markdown } from "@playbook-ng/shared-web/src/components/Markdown/Markdown";
import { TechMetaDataBox } from "@/components/Techniques/TechMetaDataBox/TechMetaDataBox";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";
import { OnPlaybook } from "@/components/DeleteModals/PlaybookDeleteModal/OnPlaybook";
import { PlaybookDeleteModalControlContext } from "@/components/DeleteModals/PlaybookDeleteModal/PlaybookDeleteModalControlContext";

const PARENT_TYPE_TO_CHILD_TYPE: {
  [key in Nest.L2["type"]]: Nest.L3["type"];
} = {
  tech: "item",
  item: "tech",
  [Nest.ADDITIONAL_ITEMS_ID]: "item",
  [Nest.UNMAPPED_TECHS_ID]: "tech",
} as const;

function parentToChildTypeName(parent: Nest.L2, itemTypeName: string) {
  const childType = PARENT_TYPE_TO_CHILD_TYPE[parent.type];
  let childName = "";
  if (childType === "item") childName = itemTypeName;
  else if (childType === "tech") childName = "ATT&CK Technique";
  return childName;
}

function TechContent(args: { techId: string }) {
  const { techId } = args;
  const { techLUT } = useContext(DataLUTsContext);
  const tech = useMemo(() => techLUT[techId], [techLUT, techId]);
  const descMD = useMemo(
    () => renderCitations(tech.description, tech.external_references),
    [tech.description, tech.external_references]
  );

  return (
    <Row>
      <Col xs={12} lg={4} className={css.metadata_col}>
        <div className="mb-3">
          <TechMetaDataBox
            tech={tech}
            hasLink
            hasConfidence
            subtechsMode="names"
            tacticsMode="names"
          />
        </div>
      </Col>
      <Col xs={12} lg={8} className={css.desc_col}>
        <div className="mb-3">
          <Markdown md={descMD} />
        </div>
      </Col>
    </Row>
  );
}

function ItemContent(args: { itemId: string; isL2: boolean }) {
  const { itemId, isL2 } = args;

  const shortDatasetName = useShortDatasetName();

  const { itemLUT } = useContext(DataLUTsContext);
  const item = useMemo(() => itemLUT[itemId], [itemLUT, itemId]);

  const descMD = useMemo(() => {
    const by = isL2 ? 3 : 4;
    const md = indentMdHeadings(item.content, by);
    return md;
  }, [item.content, isL2]);

  return (
    <div>
      {item.url ? (
        <div className="mb-2">
          <a href={item.url} target="_blank" rel="noreferrer">
            View on {shortDatasetName}
          </a>
        </div>
      ) : null}
      <div className="mb-3">
        <Markdown md={descMD} />
      </div>
    </div>
  );
}

function UnmappedHeader(args: { entry: Nest.L2Unmapped }) {
  const { entry } = args;

  const itemTypeName = useAppSelector((s) => s.appdata.dataset.item_type);

  let title = null;
  let description = null;

  if (entry.type === Nest.ADDITIONAL_ITEMS_ID) {
    title = <>Additional {itemTypeName}s</>;
    description = (
      <>
        The following {itemTypeName}s were added in addition to those provided
        by Technique mappings.
      </>
    );
  } else if (entry.type === Nest.UNMAPPED_TECHS_ID) {
    title = <>Unmapped ATT&amp;CK Techniques</>;
    description = (
      <>
        The following ATT&amp;CK Techniques are not associated with any
        particular {itemTypeName}.
      </>
    );
  }

  return (
    <>
      {/* title */}
      <Row className={css.header_row}>
        <Col xs={12} className={css.header_title}>
          <h3>{title}</h3>
        </Col>
      </Row>

      {/* description */}
      <Row className={css.info_row}>
        <Col xs={12} className={css.desc_col}>
          {description}
        </Col>
      </Row>
    </>
  );
}

function TechOrItemDeleteButton(args: {
  entry: Nest.L2Item | Nest.L2Tech | Nest.L3Item | Nest.L3Tech;
}) {
  const { entry } = args;

  const isTech = Nest.isTech(entry);
  const isItem = Nest.isItem(entry);
  const isL2 = Nest.isL2(entry);
  const isL3 = Nest.isL3(entry);
  const isUnmapped = Nest.isL3Unmapped(entry);
  const id = Nest.displayId(entry);

  const { open: bookDelete } = useContext(PlaybookDeleteModalControlContext);

  const buttonText: string | null = useMemo(() => {
    if (isL2 && isTech)
      // Parent Tech
      return "Delete";
    else if (isL3 && isItem && isUnmapped)
      // Unmapped Item
      return "Delete";
    else if (isL2 && isItem)
      // Parent Item
      return "Ignore";
    else return null;
  }, [isL2, isL3, isUnmapped, isItem, isTech]);

  // orange theme for item ignoring
  const variant = isL2 && isItem ? "outline-warning" : "outline-danger";

  const openDelete = useCallback(() => {
    if (isL2 && isTech)
      // Parent Tech
      bookDelete({ type: "remove-tech", id });
    else if (isL3 && isItem && isUnmapped)
      // Unmapped Item
      bookDelete({ type: "remove-additional-item", id });
    else if (isL2 && isItem)
      // Parent Item
      bookDelete({ type: "ignore-item", id });
  }, [id, isL2, isL3, isUnmapped, isItem, isTech, bookDelete]);

  return (
    <>
      {buttonText !== null ? (
        <Button
          variant={variant}
          onClick={openDelete}
          className={css.header_button}
        >
          {buttonText}
        </Button>
      ) : null}
    </>
  );
}

function TechOrItemHeader(args: {
  entry: Nest.L2Item | Nest.L2Tech | Nest.L3Item | Nest.L3Tech;
  expanded: UsedBool;
  bodyId: string;
  scrollAndFocusId: (id: string, skipScroll: boolean) => void;
}) {
  const { entry, expanded, bodyId, scrollAndFocusId } = args;

  const isTech = Nest.isTech(entry);
  const isL2 = Nest.isL2(entry);

  const itemTypeName = useAppSelector((s) => s.appdata.dataset.item_type);
  const typeName = isTech ? "Technique" : itemTypeName;
  const displayId = Nest.displayId(entry);

  const focusParent = useCallback(
    (keyboard: boolean) => {
      const parentHtmlId = Nest.parentHtmlId(entry);
      scrollAndFocusId(parentHtmlId, !keyboard);
    },
    [scrollAndFocusId, entry]
  );

  return (
    <Row className={css.header_row}>
      {/* title */}
      <Col xs={12} lg={8} className={css.header_title}>
        {typeName.toUpperCase()}:{" "}
        {isL2 ? (
          <h3 className={css.inline_h}>
            {entry.name} ({displayId})
          </h3>
        ) : (
          <h5 className={css.inline_h}>
            {entry.name} ({displayId})
          </h5>
        )}
      </Col>

      {/* buttons */}
      <Col xs={12} lg={4} className={css.header_button_col}>
        {/* toggle expanded */}
        <Button
          variant="outline-primary"
          onClick={expanded.toggle}
          aria-controls={bodyId}
          aria-expanded={expanded.val}
          className={css.header_button}
        >
          {expanded.val ? "Collapse" : "Expand"}
        </Button>

        {/* delete */}
        <OnPlaybook
          removeTech={focusParent}
          removeAdditionalItem={focusParent}
          ignoreItem={focusParent}
        >
          <TechOrItemDeleteButton entry={entry} />
        </OnPlaybook>
      </Col>
    </Row>
  );
}

function MatchBanner(args: { entry: Nest.L2 }) {
  const { entry } = args;

  const itemTypeName = useAppSelector((s) => s.appdata.dataset.item_type);

  const displayId = Nest.displayId(entry);
  const parentMatched = entry.matched;
  const childrenMatchedIds = entry.entries
    .filter((child) => child.matched)
    .map((child) => Nest.displayId(child));

  let text = null;

  if (childrenMatchedIds.length > 0) {
    const childTypeName = Nest.isItem(entry.entries[0])
      ? itemTypeName
      : "Technique";
    const s = childrenMatchedIds.length === 1 ? "" : "s";

    // matched parent + children
    if (parentMatched) {
      text = (
        <>
          Search matched <strong>{displayId}</strong> and the following
          associated {childTypeName}
          {s}: <strong>{childrenMatchedIds.join(", ")}</strong>
        </>
      );
    }

    // matched children
    else {
      text = (
        <>
          Search matched the following associated {childTypeName}
          {s}: <strong>{childrenMatchedIds.join(", ")}</strong>
        </>
      );
    }
  } else {
    // matched parent
    if (parentMatched) {
      text = (
        <>
          Search matched <strong>{displayId}</strong>
        </>
      );
    }

    // matched nothing
    else {
      return null;
    }
  }

  return <div className={css.search_data}>{text}</div>;
}

export function Content(args: {
  entry: Nest.L2 | Nest.L3;
  scrollAndFocusId: (id: string, skipScroll: boolean) => void;
  matchBannerOn?: boolean;
}) {
  const { entry, scrollAndFocusId, matchBannerOn } = args;
  const itemTypeName = useAppSelector((s) => s.appdata.dataset.item_type);

  const id = Nest.displayId(entry);

  const isTech = Nest.isTech(entry);
  const isItem = Nest.isItem(entry);

  const isL2 = Nest.isL2(entry);

  // content
  let content = null;
  if (isTech) content = <TechContent techId={id} />;
  else if (isItem) content = <ItemContent itemId={id} isL2={isL2} />;

  const containerClass = isL2 ? css.parent_container : css.child_container;

  const expanded = useBool(false);
  const bodyId = useId();

  // header
  let header = null;
  if (isTech || isItem) {
    header = (
      <TechOrItemHeader
        entry={entry}
        expanded={expanded}
        bodyId={bodyId}
        scrollAndFocusId={scrollAndFocusId}
      />
    );
  } else if (Nest.isL2Unmapped(entry)) {
    header = <UnmappedHeader entry={entry} />;
  }

  return (
    <div id={Nest.htmlId(entry)} tabIndex={-1} className={containerClass}>
      {/* matches */}
      {matchBannerOn && isL2 ? <MatchBanner entry={entry} /> : null}

      {/* header */}
      {header}

      {/* body */}
      {content ? (
        <Collapse in={expanded.val} mountOnEnter={true} unmountOnExit={true}>
          <div id={bodyId}>
            {isL2 ? <h4 className="visually-hidden">Content</h4> : null}
            {content}
          </div>
        </Collapse>
      ) : null}

      {/* counts + children */}
      {isL2 ? (
        <Row className={css.items_row}>
          <div className={css.item_count}>
            <h4>
              {quantity(
                entry.entries.length,
                `Associated ${parentToChildTypeName(entry, itemTypeName)}`
              )}
            </h4>
          </div>
          {entry.entries.map((child) => (
            <Content
              key={Nest.htmlId(child)}
              entry={child}
              scrollAndFocusId={scrollAndFocusId}
            />
          ))}
        </Row>
      ) : null}
    </div>
  );
}
