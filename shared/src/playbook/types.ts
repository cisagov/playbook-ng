import { TechToItemMap } from "../dataset/types";
import { t_PlaybookSpecVersion } from "./constants";

export interface Playbook_X_Y_Z {
  spec_version: t_PlaybookSpecVersion;
}

export interface Playbook_1_0_0 extends Playbook_X_Y_Z {
  dataset_id: string;
  dataset_version: string;
  title: string;
  template_used: string | null;
  version: string;
  created: string;
  updated: string;
  spec_version: "1.0.0";
  tech_to_items: TechToItemMap;
}

export interface Playbook_2_0_0 extends Playbook_X_Y_Z {
  dataset_id: string;
  dataset_version: string;
  title: string;
  template_used: string | null;
  version: string;
  created: string;
  updated: string;
  spec_version: "2.0.0";
  tech_to_items: TechToItemMap;
  ignored_items: string[];
}

/** Latest version - used app-wide */
export type Playbook = Playbook_2_0_0;
