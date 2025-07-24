import {
  useAppDispatch,
  useAppSelector,
} from "@playbook-ng/shared-web/src/store/hooks";
import { startTemplatePlaybook } from "@playbook-ng/shared-web/src/store/playbookSlice";
import { setPlaybookStatusWarningEn } from "@playbook-ng/shared-web/src/store/sessconfSlice";
import { Template } from "@playbook-ng/shared/src/dataset/types";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useStartTemplatePlaybook(template: Template) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const dataset = useAppSelector((s) => s.appdata.dataset);
  return useCallback(() => {
    dispatch(setPlaybookStatusWarningEn(false));
    dispatch(startTemplatePlaybook({ dataset, template }));
    navigate("/playbook");
  }, [template, dispatch, navigate, dataset]);
}
