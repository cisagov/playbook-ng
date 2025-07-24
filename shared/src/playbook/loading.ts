import { ValidateFunction } from "ajv";
import { PLAYBOOK_ALL_SPEC_VERSIONS } from "./constants";
import { Playbook_1_0_0, Playbook_2_0_0 } from "./types";
import { ajv, schemaCheckers } from "../schema-checkers";

const {
  playbook_x_y_z: hasValidVersion,
  playbook_1_0_0: isPlaybookV1,
  playbook_2_0_0: isPlaybookV2,
} = schemaCheckers;

function ajvErrorFor(vf: ValidateFunction) {
  return new Error(ajv.errorsText(vf.errors));
}

function update_1_0_0_to_2_0_0(playbook: Playbook_1_0_0): Playbook_2_0_0 {
  return {
    ...playbook,
    spec_version: "2.0.0",
    ignored_items: [],
  };
}

export function loadUnknownAsPlaybook(data: unknown): Playbook_2_0_0 {
  if (!hasValidVersion(data)) {
    throw new Error(
      `Playbook did not have a valid spec_version within: [ ${PLAYBOOK_ALL_SPEC_VERSIONS.join(", ")} ]`
    );
  }

  if (data.spec_version === "1.0.0") {
    if (isPlaybookV1(data)) return update_1_0_0_to_2_0_0(data);
    else throw ajvErrorFor(isPlaybookV1);
  } else if (data.spec_version === "2.0.0") {
    if (isPlaybookV2(data)) return data;
    else throw ajvErrorFor(isPlaybookV2);
  } else {
    throw new Error(`Invalid Playbook spec_version ${data.spec_version}`);
  }
}
