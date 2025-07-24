import { addAlert } from "@playbook-ng/shared-web/src/store/alertSlice";
import { useAppDispatch } from "@playbook-ng/shared-web/src/store/hooks";
import { setPlaybook } from "@playbook-ng/shared-web/src/store/playbookSlice";
import { setPlaybookStatusWarningEn } from "@playbook-ng/shared-web/src/store/sessconfSlice";
import { Playbook } from "@playbook-ng/shared/src/playbook/types";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useFinishImportingPlaybook() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const finish = useCallback(
    (playbook: Playbook) => {
      dispatch(setPlaybookStatusWarningEn(false));
      dispatch(setPlaybook(playbook));
      navigate("/playbook");
      dispatch(
        addAlert({
          type: "success",
          message: `Loaded ${playbook.title}`,
        })
      );
    },
    [dispatch, navigate]
  );

  return finish;
}
