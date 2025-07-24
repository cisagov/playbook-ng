import { EditableItem } from "@/code/item/editable-view";
import { ProvideTechItemLUTs } from "@/components/ProvideTechItemLUTs/ProvideTechItemLUTs";
import { useCallback, useMemo } from "react";
import { Data } from "../Data/Data";
import { Field } from "../Field/Field";
import { Block } from "../Block/Block";
import { StringEditor } from "../StringEditor/StringEditor";
import { NullOrEditor } from "../NullOrEditor/NullOrEditor";
import { URLView } from "../URLView/URLView";
import { BoolEditor } from "../BoolEditor/BoolEditor";
import { TimeView } from "../TimeView/TimeView";
import { MDEditor } from "../MDEditor/MDEditor";
import { ListEditor } from "../ListEditor/ListEditor";
import { SelectEditor } from "../SelectEditor/SelectEditor";
import { AUTOMATABLE_LEVELS } from "@playbook-ng/shared/src/dataset/constants";
import { getTimeISO } from "@playbook-ng/shared/src/base/utils/time";
import { VItemIDActiveNotOpen } from "@/components/validate/VItemIDActiveNotOpen";
import { VListNoDuplicates } from "@/components/validate/VListNoDuplicates";
import { MappedTech } from "@playbook-ng/shared/src/dataset/types";
import { VTechIDActive } from "@/components/validate/VTechIDActive";
import { VStringHasLength } from "@/components/validate/VStringHasLength";
import { Label } from "../Label/Label";
import { LabelConfig } from "../Label/LabelConfig";

/** Returns "" */
function emptyStr(): string {
  return "";
}

/** Blank Mapped Technique entry for an Item */
function initMappedTech(): MappedTech {
  return {
    tech_id: "",
    content: null,
    details: null,
  };
}

/** MappedTech -> MappedTech.tech_id */
function idOfMappedTech(tech: MappedTech): string {
  return tech.tech_id;
}

/** Blank non-null Item.deprecated Value */
function initDeprecated(): NonNullable<EditableItem["deprecated"]> {
  return { reason: "" };
}

/** Blank non-null Item.revoked value */
function initRevoked(): NonNullable<EditableItem["revoked"]> {
  return { reason: "", by_id: "" };
}

/**
 * The Item Editor Itself
 *
 * Edits an editable variant of an Item
 */
export function ItemEditor(args: {
  item: EditableItem;
  setItem: (item: EditableItem) => void;
}) {
  // setter: update modified timestamp on use
  const { item: val, setItem } = args;
  const set = useCallback(
    (newVal: EditableItem) => {
      setItem({
        ...newVal,
        modified: getTimeISO(),
      });
    },
    [setItem]
  );
  const vs = useMemo(() => ({ val, set }), [val, set]);

  return (
    <ProvideTechItemLUTs editedItemId={val.id}>
      <Data vs={vs}>
        <Field f="name">
          <Block title="Name">
            <LabelConfig visibility="edit-only">
              <StringEditor />
            </LabelConfig>
            <VStringHasLength />
          </Block>
        </Field>

        <Field f="url">
          <Block title="URL">
            <NullOrEditor initVal={emptyStr}>
              <LabelConfig visibility="edit-only">
                <StringEditor view={URLView} />
              </LabelConfig>
              <VStringHasLength />
            </NullOrEditor>
          </Block>
        </Field>

        <Field f="is_baseline">
          <Block title="Is Baseline">
            <LabelConfig visibility="edit-only">
              <BoolEditor />
            </LabelConfig>
          </Block>
        </Field>

        <hr />

        <Block title="Details">
          <Field f="id">
            <StringEditor />
            <VStringHasLength />
          </Field>

          <Field f="version">
            <StringEditor />
            <VStringHasLength />
          </Field>

          <Field f="created">
            <Label />
            <TimeView />
          </Field>

          <Field f="modified">
            <Label />
            <TimeView />
          </Field>

          <Field f="subtype">
            <NullOrEditor initVal={emptyStr}>
              <StringEditor />
              <VStringHasLength />
            </NullOrEditor>
          </Field>
        </Block>

        <hr />

        <Field f="content">
          <Field f="intended_outcome">
            <Block title="Intended Outcome">
              <MDEditor />
              <VStringHasLength />
            </Block>
          </Field>

          <Field f="introduction">
            <Block title="Introduction">
              <MDEditor />
              <VStringHasLength />
            </Block>
          </Field>

          <Field f="preparation">
            <Block title="Preparation">
              <MDEditor />
              <VStringHasLength />
            </Block>
          </Field>

          <Field f="risks">
            <Block title="Risks">
              <MDEditor />
              <VStringHasLength />
            </Block>
          </Field>

          <Field f="guidance">
            <Block title="Guidance">
              <MDEditor />
              <VStringHasLength />
            </Block>
          </Field>

          <Field f="references">
            <Block title="References">
              <MDEditor />
              <VStringHasLength />
            </Block>
          </Field>
        </Field>

        <hr />

        <Field f="techniques">
          <Block title="Mapped Techniques">
            <VListNoDuplicates subVal={idOfMappedTech} />
            <ListEditor initItem={initMappedTech}>
              <Field f="tech_id">
                <LabelConfig visibility="edit-only">
                  <StringEditor />
                </LabelConfig>
                <VTechIDActive />
              </Field>
            </ListEditor>
          </Block>
        </Field>

        <Field f="related_ids">
          <Block title="Related Countermeasures">
            <VListNoDuplicates />
            <ListEditor initItem={emptyStr}>
              <LabelConfig visibility="edit-only">
                <StringEditor />
              </LabelConfig>
              <VItemIDActiveNotOpen />
            </ListEditor>
          </Block>
        </Field>

        <Field f="automatable">
          <Block title="Automatable">
            <LabelConfig visibility="edit-only">
              <SelectEditor options={AUTOMATABLE_LEVELS} />
            </LabelConfig>
          </Block>
        </Field>

        <hr />

        <Field f="ids_before_this">
          <Block title="Countermeasures Before This">
            <VListNoDuplicates />
            <ListEditor initItem={emptyStr}>
              <LabelConfig visibility="edit-only">
                <StringEditor />
              </LabelConfig>
              <VItemIDActiveNotOpen />
            </ListEditor>
          </Block>
        </Field>

        <Field f="ids_after_this">
          <Block title="Countermeasures After This">
            <VListNoDuplicates />
            <ListEditor initItem={emptyStr}>
              <LabelConfig visibility="edit-only">
                <StringEditor />
              </LabelConfig>
              <VItemIDActiveNotOpen />
            </ListEditor>
          </Block>
        </Field>

        <hr />

        <Field f="contributors">
          <Block title="Contributors">
            <VListNoDuplicates />
            <ListEditor initItem={emptyStr}>
              <LabelConfig visibility="edit-only">
                <StringEditor />
              </LabelConfig>
              <VStringHasLength />
            </ListEditor>
          </Block>
        </Field>

        <Field f="technologies">
          <Block title="Technologies">
            <VListNoDuplicates />
            <ListEditor initItem={emptyStr}>
              <LabelConfig visibility="edit-only">
                <StringEditor />
              </LabelConfig>
              <VStringHasLength />
            </ListEditor>
          </Block>
        </Field>

        <Field f="platforms">
          <Block title="Platforms">
            <VListNoDuplicates />
            <ListEditor initItem={emptyStr}>
              <LabelConfig visibility="edit-only">
                <StringEditor />
              </LabelConfig>
              <VStringHasLength />
            </ListEditor>
          </Block>
        </Field>

        <hr />

        <Field f="deprecated">
          <Block title="Deprecated">
            <NullOrEditor initVal={initDeprecated}>
              <Field f="reason">
                <StringEditor />
                <VStringHasLength />
              </Field>
            </NullOrEditor>
          </Block>
        </Field>

        <Field f="revoked">
          <Block title="Revoked">
            <NullOrEditor initVal={initRevoked}>
              <Field f="reason">
                <StringEditor />
                <VStringHasLength />
              </Field>

              <Field f="by_id">
                <StringEditor />
                <VItemIDActiveNotOpen />
              </Field>
            </NullOrEditor>
          </Block>
        </Field>
      </Data>
    </ProvideTechItemLUTs>
  );
}
