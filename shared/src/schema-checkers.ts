/** Project-wide jsonschema validators */

import Ajv from "ajv";

import { Item } from "./dataset/types";
import { s_Item } from "./dataset/schema";

import { DatasetFile } from "./dataset/types";
import { s_DatasetFile } from "./dataset/schema";

import {
  Playbook_1_0_0,
  Playbook_2_0_0,
  Playbook_X_Y_Z,
} from "./playbook/types";
import {
  s_Playbook_1_0_0,
  s_Playbook_2_0_0,
  s_Playbook_X_Y_Z,
} from "./playbook/schema";

import { AppDataIndex, s_AppDataIndex } from "./app/store/appdata";

import { AppConfigFile } from "./app/runtime-config/types";
import { s_AppConfigFile } from "./app/runtime-config/schema";

/** The single instance of the Ajv JSON Schema Validator */
export const ajv = new Ajv();

const playbook_x_y_z = ajv.compile<Playbook_X_Y_Z>(s_Playbook_X_Y_Z);
const playbook_1_0_0 = ajv.compile<Playbook_1_0_0>(s_Playbook_1_0_0);
const playbook_2_0_0 = ajv.compile<Playbook_2_0_0>(s_Playbook_2_0_0);
const playbook = playbook_2_0_0;

/**
 * Schema validators
 *
 * - for resources encountered on app load
 * - for resources encountered on user import
 */
export const schemaCheckers = {
  /**
   * Validate an Item
   *
   * - Used in the Editor to check user-pasted Items
   */
  item: ajv.compile<Item>(s_Item),

  /**
   * Validate a Dataset (shared/data/datasets/...)
   *
   * - Used in the API/Editor/Website during load to check the specified Dataset
   */
  datasetFile: ajv.compile<DatasetFile>(s_DatasetFile),

  /** Validate that user-provided Playbook has usable spec_version */
  playbook_x_y_z,

  /** Validate that user-provided Playbook fits spec_version 1.0.0 */
  playbook_1_0_0,

  /** Validate that user-provided Playbook fits spec_version 2.0.0 */
  playbook_2_0_0,

  /** Validate that user-provided Playbook fits latest spec_version */
  playbook,

  /**
   * Validate the AppDataIndex (shared/data/index.json)
   *
   * - Used in the API/Editor/Website during load to check the index
   */
  appDataIndex: ajv.compile<AppDataIndex>(s_AppDataIndex),

  /**
   * Validate an AppConfigFile (shared/data/runtime-config/[default, user].json)
   *
   * - Used in the API/Editor/Website during load to check config settings
   */
  appConfigFile: ajv.compile<AppConfigFile>(s_AppConfigFile),
};
