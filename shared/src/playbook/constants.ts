export const DEFAULT_PLAYBOOK_TITLE = "Untitled";

export const PLAYBOOK_ALL_SPEC_VERSIONS = ["1.0.0", "2.0.0"] as const;
export type t_PlaybookSpecVersion = (typeof PLAYBOOK_ALL_SPEC_VERSIONS)[number];
export const s_PlaybookSpecVersion = { enum: PLAYBOOK_ALL_SPEC_VERSIONS };
export const PLAYBOOK_CUR_SPEC_VERSION = "2.0.0";
