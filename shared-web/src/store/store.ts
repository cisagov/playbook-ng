import { configureStore } from "@reduxjs/toolkit";

import appdataReducer from "./appdataSlice";
import alertReducer from "./alertSlice";
import playbookReducer from "./playbookSlice";
import sessconfReducer from "./sessconfSlice";
import configReducer from "./configSlice";
import loadinfoSlice from "./loadinfoSlice";

const store = configureStore({
  reducer: {
    appdata: appdataReducer,
    alerts: alertReducer,
    playbook: playbookReducer,
    sessconf: sessconfReducer,
    config: configReducer,
    loadinfo: loadinfoSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
