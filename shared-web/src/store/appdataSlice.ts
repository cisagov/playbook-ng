import * as base from "@playbook-ng/shared/src/app/store/appdata";
import { AttackDatasets } from "@playbook-ng/shared/src/attack/objects";
import { Dataset } from "@playbook-ng/shared/src/dataset/types";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const appdataSlice = createSlice({
  name: "appdata",
  initialState: base.createInitialState(),
  reducers: {
    setDataset(state, action: PayloadAction<Dataset>) {
      return base.setDataset(state, action.payload);
    },
    setAttack(state, action: PayloadAction<AttackDatasets>) {
      return base.setAttack(state, action.payload);
    },
  },
});

export const { setDataset, setAttack } = appdataSlice.actions;

export default appdataSlice.reducer;
