import { ExportMarks } from "../../lib/remark-docx/src/control";

/** Runtime configuration of the app */
export type AppConfig = {
  /** Specifies what should be loaded */
  load: {
    /** ATT&CK Loading
     * - true : attempt to load this domain
     * - false: skip loading this domain
     *
     * Note: at least 1 domain must be set to true
     */
    attack: {
      enterprise: boolean;
      mobile: boolean;
      ics: boolean;
    };

    /** Dataset Loading
     * - which dataset should be loaded
     * - release default is (coun7er, latest)
     */
    dataset: {
      id: string;
      version: string;
    };
  };

  /** Refreshing, navigating away, or closing will cause a warning pop-up */
  unload_warning: boolean;

  /** Speeds up navigation to the Techs and Items views
   * - by caching their search index on app-load
   * - instead of rebuilding it upon every visit
   */
  search_caching: boolean;

  export_marks: ExportMarks;

  external_link_prompt: null | string;

  export_logging: null | {
    url: string;
    more_info_md: null | string;
  };
};

/** Typing for website config files [default.json, user.json] */
export type AppConfigFile = {
  /** Used in debug mode */
  dev: AppConfig;

  /** Used in production builds */
  prod: AppConfig;
};
