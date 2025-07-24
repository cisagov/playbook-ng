import css from "./Toasts.module.css";
import { Toast, ToastContainer } from "react-bootstrap";
import {
  useAppDispatch,
  useAppSelector,
} from "@playbook-ng/shared-web/src/store/hooks";
import { useCallback, useEffect } from "react";
import {
  Alert,
  AlertType,
  removeAlert,
} from "@playbook-ng/shared-web/src/store/alertSlice";

type ToastConfig = {
  toastClass: string;
  headerClass: string;
  headerText: string;
  headerCloseVariant: string | undefined;
  bodyClass: string;
};

type ToastConfigs = {
  [key in AlertType]: ToastConfig;
};

const TOAST_CONFIGS: ToastConfigs = {
  success: {
    toastClass: css.success_toast,
    headerClass: css.success_toast_header,
    headerText: "Success!",
    headerCloseVariant: "white",
    bodyClass: css.success_toast_body,
  },
  error: {
    toastClass: css.error_toast,
    headerClass: css.error_toast_header,
    headerText: "Error!",
    headerCloseVariant: "white",
    bodyClass: css.error_toast_body,
  },
  info: {
    toastClass: css.info_toast,
    headerClass: css.info_toast_header,
    headerText: "Info!",
    headerCloseVariant: undefined, // black
    bodyClass: css.info_toast_body,
  },
};

function AToast(args: { alert: Alert; close: (id: number) => void }) {
  const { close } = args;
  const { id, type, message } = args.alert;

  const handleClose = useCallback(() => close(id), [close, id]);

  const config = TOAST_CONFIGS[type];

  const role = type === "error" ? "alert" : undefined;

  return (
    <Toast
      role={role}
      className={`${css.toast} ${config.toastClass}`}
      onClose={handleClose}
    >
      <Toast.Header
        bsPrefix="override"
        closeVariant={config.headerCloseVariant}
        className={`${css.toast_header} ${config.headerClass}`}
      >
        {config.headerText}
      </Toast.Header>
      <Toast.Body className={`${css.toast_body} ${config.bodyClass}`}>
        {message}
      </Toast.Body>
    </Toast>
  );
}

export function Toasts() {
  const alerts = useAppSelector((s) => s.alerts.alerts);

  const successAlerts = alerts.filter((alert) => alert.type === "success");
  const errorAlerts = alerts.filter((alert) => alert.type === "error");
  const infoAlerts = alerts.filter((alert) => alert.type === "info");

  const dispatch = useAppDispatch();

  const handleAlertClose = useCallback(
    (id: number) => dispatch(removeAlert(id)),
    [dispatch]
  );

  useEffect(() => {
    if (alerts.length > 0) {
      const newAlert = alerts[alerts.length - 1];
      if (newAlert.type !== "error") {
        setTimeout(() => {
          dispatch(removeAlert(newAlert.id));
        }, 5000);
      }
    }
  }, [alerts, dispatch]);

  return (
    <div className={css.toasts_wrapper}>
      <h2 className="visually-hidden">Toast Messages</h2>
      <ToastContainer
        bsPrefix="override"
        className={`${css.toast_container} ${css.success_toast_container}`}
      >
        <h3 className="visually-hidden">Success Toasts</h3>
        {successAlerts.map((alert) => (
          <AToast key={alert.id} alert={alert} close={handleAlertClose} />
        ))}
      </ToastContainer>
      <ToastContainer
        bsPrefix="override"
        className={`${css.toast_container} ${css.error_toast_container}`}
      >
        <h3 className="visually-hidden">Error Toasts</h3>
        {errorAlerts.map((alert) => (
          <AToast key={alert.id} alert={alert} close={handleAlertClose} />
        ))}
      </ToastContainer>
      <ToastContainer
        bsPrefix="override"
        className={`${css.toast_container} ${css.info_toast_container}`}
      >
        <h3 className="visually-hidden">Info Toasts</h3>
        {infoAlerts.map((alert) => (
          <AToast key={alert.id} alert={alert} close={handleAlertClose} />
        ))}
      </ToastContainer>
    </div>
  );
}
