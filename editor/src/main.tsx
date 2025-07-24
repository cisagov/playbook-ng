/**
 * Build Target: Countermeasure Editor
 *
 * - This is entirely self-contained and separate from the Website / API.
 * - This is a frontend-only React single-page application.
 * - This allows authoring / editing Countermeasures for use in the Website / API.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./main.scss";
import store from "@playbook-ng/shared-web/src/store/store.ts";
import { Provider } from "react-redux";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
