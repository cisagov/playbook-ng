import css from "./MDTest.module.css";
import { useTitle } from "@/hooks/useTitle";
import { Header } from "@/components/Header/Header";
import { useAllTechniques } from "@/hooks/useAllTechniques";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import {
  indentMdHeadings,
  renderCitations,
} from "@playbook-ng/shared/src/base/utils/rendering";
import { useMemo } from "react";
import { joinTechName } from "@playbook-ng/shared/src/attack/objects";
import { Markdown } from "@playbook-ng/shared-web/src/components/Markdown/Markdown";

const TITLE = "Markdown Render Test";

/**
 * Markdown Render Test Page
 *
 * - Only present in DEV mode
 * - Renders all ATT&CK Technique + Dataset Item content markdowns
 *   - Allows debug of MD Rendering logic
 */
export function MDTest() {
  useTitle(TITLE);

  const allTechs = useAllTechniques();
  const allItems = useAppSelector((s) => s.appdata.dataset.items);

  return (
    <div className={css.root}>
      <Header
        title={TITLE}
        body="Renders all loaded ATT&CK Techniques + Dataset Items as a test"
      />

      <div>
        <h2>Techniques</h2>
        {allTechs.map((tech) => (
          <Block
            key={tech.attackId}
            id={tech.attackId}
            name={joinTechName(tech.name)}
            url={tech.attackUrl}
            desc={tech.description}
            refs={tech.external_references}
          />
        ))}
      </div>

      <div>
        <h2>Items</h2>
        {allItems.map((item) => (
          <Block
            key={item.id}
            id={item.id}
            name={item.name}
            url={item.url}
            desc={item.content}
            refs={false}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A Card of Rendered MD for a Tech or Item
 *
 * - Optional url allows linking to source to verify MD rendering compliance
 */
function Block(args: {
  id: string;
  name: string;
  url: string | null;
  desc: Parameters<typeof renderCitations>[0];
  refs: Parameters<typeof renderCitations>[1];
}) {
  const { id, name, url, desc, refs } = args;

  const descMD = useMemo(
    () => renderCitations(indentMdHeadings(desc, 2), refs),
    [desc, refs]
  );

  let link = null;
  if (url) {
    link = (
      <a className={css.link} href={url} target="_blank" rel="noreferrer">
        Source
      </a>
    );
  }

  return (
    <div className={css.block}>
      <h3>
        <span>{id}</span> {name} {link}
      </h3>
      <Markdown md={descMD} />
    </div>
  );
}
