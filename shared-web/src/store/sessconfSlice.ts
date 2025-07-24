import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface stateType {
  playbookStatusWarningEn: boolean;
}

function initialState(): stateType {
  return {
    playbookStatusWarningEn: true,
  };
}

const sessconfSlice = createSlice({
  name: "sessconf",
  initialState,
  reducers: {
    setPlaybookStatusWarningEn(state, action: PayloadAction<boolean>) {
      state.playbookStatusWarningEn = action.payload;
    },
  },
});

export const { setPlaybookStatusWarningEn } = sessconfSlice.actions;

export default sessconfSlice.reducer;
