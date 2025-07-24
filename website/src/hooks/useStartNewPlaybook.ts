import {
  useAppDispatch,
  useAppSelector,
} from "@playbook-ng/shared-web/src/store/hooks";
import { startBlankPlaybook } from "@playbook-ng/shared-web/src/store/playbookSlice";
import { setPlaybookStatusWarningEn } from "@playbook-ng/shared-web/src/store/sessconfSlice";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useStartNewPlaybook() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const dataset = useAppSelector((s) => s.appdata.dataset);

  const startNewPlaybook = useCallback(() => {
    dispatch(setPlaybookStatusWarningEn(false));
    dispatch(startBlankPlaybook(dataset));
    navigate("/techniques");
  }, [dispatch, navigate, dataset]);

  return startNewPlaybook;
}
