import { DataLUTsContext } from "@/contexts/DataLUTsContext";
import { PlaybookSearchContext } from "@/contexts/PlaybookSearchContext";
import {
  initialPlaybookMiniSearch,
  PBSearchDoc,
} from "@/views/Playbook/search";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import {
  AttackDatasets,
  joinTechName,
  Tech_getPlatformNames,
  Technique,
} from "@playbook-ng/shared/src/attack/objects";
import { renderCitations } from "@playbook-ng/shared/src/base/utils/rendering";
import { difference, union } from "@playbook-ng/shared/src/base/utils/set";
import { Item } from "@playbook-ng/shared/src/dataset/types";
import {
  ttiItemIDs,
  ttiTechIDs,
} from "@playbook-ng/shared/src/playbook/helpers";
import MiniSearch from "minisearch";
import { useContext, useEffect, useMemo, useState } from "react";

function techToDoc(tech: Technique, attack: AttackDatasets): PBSearchDoc {
  return {
    id: tech.attackId,
    name: joinTechName(tech.name),
    type: "tech",
    desc: renderCitations(tech.description, tech.external_references),
    Platform: Tech_getPlatformNames(attack, tech),
  };
}

function itemToDoc(item: Item): PBSearchDoc {
  return {
    id: item.id,
    name: item.name,
    type: "item",
    desc: item.content,
    Platform: [],
  };
}

export function PlaybookSearchProvider(args: { children: React.ReactNode }) {
  const { children } = args;
  const [miniwrap, setMiniwrap] = useState<{ mini: MiniSearch }>(() => ({
    mini: initialPlaybookMiniSearch(),
  }));

  const { techLUT, itemLUT } = useContext(DataLUTsContext);

  const attack = useAppSelector((s) => s.appdata.attack);

  const techToItems = useAppSelector((s) => s.playbook.tech_to_items);

  const techIds = useMemo(
    () => new Set(ttiTechIDs(techToItems)),
    [techToItems]
  );
  const itemIds = useMemo(
    () => new Set(ttiItemIDs(techToItems)),
    [techToItems]
  );
  const miniIds = useMemo(
    () =>
      new Set(miniwrap.mini.search(MiniSearch.wildcard).map((doc) => doc.id)),
    [miniwrap]
  );

  useEffect(() => {
    const { mini } = miniwrap;
    let modified = false;

    // in Mini, but not Playbook -> remove
    difference(miniIds, union(techIds, itemIds)).forEach((id) => {
      mini.discard(id);
      modified = true;
    });

    // in Playbook Techs, but not Mini -> add Techs
    difference(techIds, miniIds).forEach((id) => {
      const tech = techLUT[id];
      const doc = techToDoc(tech, attack);
      mini.add(doc);
      modified = true;
    });

    // in Playbook Items, but not Mini -> add Items
    difference(itemIds, miniIds).forEach((id) => {
      const item = itemLUT[id];
      const doc = itemToDoc(item);
      mini.add(doc);
      modified = true;
    });

    if (modified) {
      mini.vacuum();
      setMiniwrap({ mini });
    }
  }, [attack, itemIds, itemLUT, miniIds, miniwrap, techIds, techLUT]);

  return (
    <PlaybookSearchContext.Provider value={miniwrap}>
      {children}
    </PlaybookSearchContext.Provider>
  );
}
