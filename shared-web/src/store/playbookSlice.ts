import * as base from "@playbook-ng/shared/src/app/store/playbook";
import { t_TechConfidence } from "@playbook-ng/shared/src/dataset/constants";
import { Dataset, Template, Item } from "@playbook-ng/shared/src/dataset/types";
import { Playbook } from "@playbook-ng/shared/src/playbook/types";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { PlaybookDeletePayload } from "@playbook-ng/website/src/components/DeleteModals/PlaybookDeleteModal/types";

const playbookSlice = createSlice({
  name: "playbook",
  initialState: base.initialPlaybook(),
  reducers: {
    setPlaybookTitle(playbook, a: PayloadAction<string>) {
      return base.setPlaybookTitle(playbook, a.payload);
    },

    /** Starts Playbook from a Template */
    startTemplatePlaybook(
      _,
      a: PayloadAction<{ dataset: Dataset; template: Template }>
    ) {
      return base.startTemplatePlaybook(a.payload);
    },

    /** Starts blank Playbook */
    startBlankPlaybook(_, a: PayloadAction<Dataset>) {
      return base.startBlankPlaybook(a.payload);
    },

    /** Adds 1+ Techniques */
    addTechs(playbook, a: PayloadAction<{ allItems: Item[]; ids: string[] }>) {
      return base.addTechs(playbook, a.payload);
    },

    /** Sets the playbook to the data imported from a JSON file */
    setPlaybook(_, a: PayloadAction<Playbook>) {
      return base.setPlaybook(a.payload);
    },

    /** Sets the confidence level for a specified technique */
    setTechConfidence(
      playbook,
      a: PayloadAction<{ id: string; confidence: t_TechConfidence }>
    ) {
      return base.setTechConfidence(playbook, a.payload);
    },

    /** Allows user to add Item to additional (unmapped) */
    addAdditionalItem(
      playbook,
      a: PayloadAction<{ allItems: Item[]; item: Item }>
    ) {
      return base.addAdditionalItem(playbook, a.payload);
    },

    playbookDelete(playbook, action: PayloadAction<PlaybookDeletePayload>) {
      const { payload } = action;
      const { type } = payload;

      switch (type) {
        case "close-playbook":
          return base.closePlaybook();
        case "remove-tech":
          return base.removeTech(playbook, payload.id);
        case "remove-additional-item":
          return base.removeAdditionalItem(playbook, payload.id);
        case "ignore-item":
          return base.ignoreItem(playbook, payload.id);
        default:
          throw new Error(`Unknown PlaybookDeletePayload.type '${type}'`);
      }
    },

    restoreItem(
      playbook,
      a: PayloadAction<{ allItems: Item[]; itemId: string }>
    ) {
      return base.restoreItem(playbook, a.payload);
    },
  },
});

export const {
  setPlaybookTitle,
  startTemplatePlaybook,
  startBlankPlaybook,
  addTechs,
  setPlaybook,
  setTechConfidence,
  addAdditionalItem,
  playbookDelete,
  restoreItem,
} = playbookSlice.actions;

export default playbookSlice.reducer;
