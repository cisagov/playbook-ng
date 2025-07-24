import MiniSearch from "minisearch";
import { createContext } from "react";

export type SearchCacheType = {
  techs: MiniSearch | null;
  items: MiniSearch | null;
};

export const SearchCacheContext = createContext<SearchCacheType>({
  techs: null,
  items: null,
});
