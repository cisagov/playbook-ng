import { Container, Spinner } from "react-bootstrap";
import css from "./App.module.css";
import { useAppDispatch } from "@playbook-ng/shared-web/src/store/hooks.ts";
import {
  setAttack,
  setDataset,
} from "@playbook-ng/shared-web/src/store/appdataSlice.ts";
import { useEffect, useId, useState } from "react";
import { useUnloadWarning } from "@playbook-ng/shared-web/src/hooks/useUnloadWarning.ts";
import { useExtLinkWarning } from "@playbook-ng/shared-web/src/hooks/useExtLinkWarning.ts";
import { ScrollToTop } from "@playbook-ng/shared-web/src/components/ScrollToTop/ScrollToTop.tsx";
import { setAppConfig } from "@playbook-ng/shared-web/src/store/configSlice.ts";
import { URLFileGetter } from "@playbook-ng/shared-web/src/code/load.ts";
import { loadAppResources } from "@playbook-ng/shared/src/app/load.ts";
import { setLoadInfo } from "@playbook-ng/shared-web/src/store/loadinfoSlice.ts";
import { Page } from "./page/Page.tsx";
import { APP_URL, IN_PROD } from "./code/buildtime-config.ts";

/** Load State: Unloaded | Loading | Loaded (error / success) */
type LoadStatus = {
  loading: boolean;
  success: boolean;
  error: null | string;
};

/**
 * Editor Root Component
 *
 * - Basically the same as website/App.tsx
 *   - Save for only having 1 route (Page)
 */
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

        // done loading
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

  const topId = useId();

  // loading...
  if (loadStatus.loading) {
    return (
      <main>
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
      <main>
        <Container className={css.page_content}>
          <h1>Editor Failed to Load</h1>
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
      <div tabIndex={-1} id={topId} />
      <main>
        <Container className={css.page_content}>
          <Page />
        </Container>
      </main>
      <div className={css.pre_footer} />
      <ScrollToTop focusId={topId} />
    </>
  );
}
