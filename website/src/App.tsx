import { Container, Spinner } from "react-bootstrap";
import css from "./App.module.css";
import { Toasts } from "./components/Toasts/Toasts.tsx";
import { NavBar } from "./components/NavBar/NavBar.tsx";
import { Outlet } from "react-router-dom";
import { useAppDispatch } from "@playbook-ng/shared-web/src/store/hooks.ts";
import {
  setAttack,
  setDataset,
} from "@playbook-ng/shared-web/src/store/appdataSlice.ts";
import { useEffect, useId, useState } from "react";
import { Footer } from "./components/Footer/Footer.tsx";
import { useUnloadWarning } from "@playbook-ng/shared-web/src/hooks/useUnloadWarning.ts";
import { useExtLinkWarning } from "@playbook-ng/shared-web/src/hooks/useExtLinkWarning.ts";
import { ScrollToTop } from "@playbook-ng/shared-web/src/components/ScrollToTop/ScrollToTop.tsx";
import { setAppConfig } from "@playbook-ng/shared-web/src/store/configSlice.ts";
import { URLFileGetter } from "@playbook-ng/shared-web/src/code/load.ts";
import { loadAppResources } from "@playbook-ng/shared/src/app/load.ts";
import { setLoadInfo } from "@playbook-ng/shared-web/src/store/loadinfoSlice.ts";
import { SkipToMain } from "@playbook-ng/shared-web/src/components/SkipToMain/SkipToMain.tsx";
import { APP_URL, IN_PROD } from "./code/buildtime-config.ts";
import { PlaybookSearchProvider } from "./components/Playbook/PlaybookSearchProvider.tsx";
import { SearchCacheProvider } from "./components/Search/SearchCacheProvider.tsx";
import { DataLUTsProvider } from "./components/providers/DataLUTsProvider.tsx";
import { GlobalDeleteModals } from "./components/DeleteModals/GlobalDeleteModals.tsx";

type LoadStatus = {
  loading: boolean;
  success: boolean;
  error: null | string;
};

export function App() {
  useUnloadWarning();
  useExtLinkWarning();

  const dispatch = useAppDispatch();
  const [loadStatus, setLoadStatus] = useState<LoadStatus>({
    loading: true,
    success: false,
    error: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await loadAppResources(new URLFileGetter(APP_URL), IN_PROD);

        dispatch(setAppConfig(r.config));
        dispatch(setAttack(r.attack));
        dispatch(setDataset(r.dataset));
        dispatch(
          setLoadInfo({
            dataLoaded: r.toLoad,
            datasetAdjusts: r.datasetAdjusts,
          })
        );

        setLoadStatus({ loading: false, success: true, error: null });
      } catch (err) {
        setLoadStatus({
          loading: false,
          success: false,
          error: `${err}` || "Unknown Error",
        });
      }
    })();
  }, [dispatch]);

  const headerId = useId();
  const mainId = useId();

  // loading...
  if (loadStatus.loading) {
    return (
      <main id={mainId}>
        <Container className={css.page_content}>
          <div className={css.spinner_backdrop}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </Container>
      </main>
    );
  }

  // load failed
  if (!loadStatus.success) {
    return (
      <main id={mainId}>
        <Container className={css.page_content}>
          <h1>Playbook-NG Failed to Load</h1>
          <p>
            <strong>Cause:</strong> {loadStatus.error ?? "Unknown error."}
          </p>
        </Container>
      </main>
    );
  }

  // load success
  return (
    <>
      <SkipToMain focusId={mainId} />
      <div className={css.header} id={headerId} tabIndex={-1}>
        <NavBar />
      </div>
      <main id={mainId} tabIndex={-1}>
        <Container className={css.page_content}>
          <Toasts />
          <Services>
            <Outlet />
          </Services>
        </Container>
      </main>
      <div className={css.pre_footer} />
      <ScrollToTop focusId={headerId} />
      <Footer />
    </>
  );
}

function Services(args: { children: React.ReactNode }) {
  const { children } = args;
  return (
    <DataLUTsProvider>
      <SearchCacheProvider>
        <PlaybookSearchProvider>
          <GlobalDeleteModals>{children}</GlobalDeleteModals>
        </PlaybookSearchProvider>
      </SearchCacheProvider>
    </DataLUTsProvider>
  );
}
