/**
 * Build Target: Playbook-NG Website
 *
 * - This is entirely self-contained and separate from the Editor / API.
 * - This is a frontend-only React single-page application.
 * - This allows adding Techs / Items to a cart, then exporting advisement plans.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./main.scss";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Home } from "./views/Home/Home.tsx";
import { About } from "./views/About/About.tsx";
import { Templates } from "./views/Templates/Templates.tsx";
import { Techniques } from "./views/Techniques/Techniques.tsx";
import { Items } from "./views/Items/Items.tsx";
import { Playbook } from "./views/Playbook/Playbook.tsx";
import store from "@playbook-ng/shared-web/src/store/store.ts";
import { Provider } from "react-redux";
import { BASENAME } from "./code/buildtime-config.ts";
import { NotFoundError } from "./views/ErrorViews/NotFoundError.tsx";
import { LoadDetails } from "./views/LoadDetails/LoadDetails.tsx";
import { Import } from "./views/Import/Import.tsx";
import { MDTest } from "./views/MDTest/MDTest.tsx";
import { ErrorInX } from "./views/ErrorViews/ErrorInX.tsx";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      errorElement: <ErrorInX x="App" />,
      children: [
        {
          index: true,
          element: <Home />,
          errorElement: <ErrorInX x="Page" />,
        },
        {
          path: "about",
          element: <About />,
          errorElement: <ErrorInX x="Page" />,
        },
        {
          path: "templates",
          element: <Templates />,
          errorElement: <ErrorInX x="Page" />,
        },
        {
          path: "import",
          element: <Import />,
          errorElement: <ErrorInX x="Page" />,
        },
        {
          path: "techniques",
          element: <Techniques />,
          errorElement: <ErrorInX x="Page" />,
        },
        {
          path: "items",
          element: <Items />,
          errorElement: <ErrorInX x="Page" />,
        },
        {
          path: "playbook",
          element: <Playbook />,
          errorElement: <ErrorInX x="Page" />,
        },
        {
          path: "load-details",
          element: <LoadDetails />,
          errorElement: <ErrorInX x="Page" />,
        },
        {
          path: "md-test",
          element: <MDTest />,
          errorElement: <ErrorInX x="Page" />,
        },
        {
          path: "*",
          element: <NotFoundError />,
          errorElement: <ErrorInX x="Page" />,
        },
      ],
    },
  ],
  {
    basename: BASENAME,
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
        }}
      />
    </Provider>
  </React.StrictMode>
);
