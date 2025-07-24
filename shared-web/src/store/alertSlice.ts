import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type AlertType = "success" | "error" | "info";

interface NewAlert {
  type: AlertType;
  message: string;
}

export interface Alert extends NewAlert {
  id: number;
}

interface AlertState {
  alertId: number;
  alerts: Array<Alert>;
}

function initialState(): AlertState {
  return {
    alertId: 0,
    alerts: [],
  };
}

const alertSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    addAlert(state, action: PayloadAction<NewAlert>) {
      const addedAlert = action.payload;
      state.alerts.push({ ...addedAlert, id: state.alertId++ });
    },
    removeAlert(state, action: PayloadAction<Alert["id"]>) {
      const removedAlertId = action.payload;
      state.alerts = state.alerts.filter(
        (alert) => alert.id !== removedAlertId
      );
    },
    clearAlerts(state) {
      state.alerts = [];
    },
  },
});

export const { addAlert, removeAlert, clearAlerts } = alertSlice.actions;

export default alertSlice.reducer;
