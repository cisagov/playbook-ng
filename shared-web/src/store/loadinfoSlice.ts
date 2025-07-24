import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  LoadInfo,
  initialLoadInfo as initialState,
} from "@playbook-ng/shared/src/app/load";

const loadinfoSlice = createSlice({
  name: "loadinfo",
  initialState,
  reducers: {
    setLoadInfo(state, action: PayloadAction<LoadInfo>) {
      return action.payload;
    },
  },
});

export const { setLoadInfo } = loadinfoSlice.actions;

export default loadinfoSlice.reducer;
