import { initialPlaybookMiniSearch } from "@/views/Playbook/search";
import MiniSearch from "minisearch";
import { createContext } from "react";

export const PlaybookSearchContext = createContext<{ mini: MiniSearch }>({
  mini: initialPlaybookMiniSearch(),
});
