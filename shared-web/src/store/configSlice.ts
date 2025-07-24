import { AppConfig } from "@playbook-ng/shared/src/app/runtime-config/types";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type StateType = AppConfig | null;

function initialState(): StateType {
  return null;
}

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setAppConfig(state, action: PayloadAction<AppConfig>) {
      return action.payload;
    },
  },
});

export const { setAppConfig } = configSlice.actions;

export default configSlice.reducer;
