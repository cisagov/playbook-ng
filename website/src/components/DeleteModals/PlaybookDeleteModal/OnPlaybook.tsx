import { useCallback, useContext, useMemo } from "react";
import { PlaybookDeleteModalControlContext } from "./PlaybookDeleteModalControlContext";
import { PlaybookDeleteModalArgs } from "./types";

function call<Args>(fn: undefined | ((args: Args) => void), args: Args) {
  if (fn) fn(args);
}

export function OnPlaybook(args: {
  children: React.ReactNode;
  clear?: (keyboard: boolean) => void;
  removeTech?: (keyboard: boolean) => void;
  removeAdditionalItem?: (keyboard: boolean) => void;
  ignoreItem?: (keyboard: boolean) => void;
}) {
  const { children, clear, removeTech, removeAdditionalItem, ignoreItem } =
    args;

  const { close, open: oldOpen } = useContext(
    PlaybookDeleteModalControlContext
  );

  const open = useCallback(
    (args: PlaybookDeleteModalArgs) => {
      const { callback: oldCallback, ...payload } = args;
      const { type } = payload;

      const callback = (keyboard: boolean) => {
        switch (type) {
          case "close-playbook":
            call(clear, keyboard);
            break;
          case "remove-tech":
            call(removeTech, keyboard);
            break;
          case "remove-additional-item":
            call(removeAdditionalItem, keyboard);
            break;
          case "ignore-item":
            call(ignoreItem, keyboard);
            break;
          default:
            throw new Error(`Unknown PlaybookDeletePayload.type '${type}'`);
        }

        if (oldCallback) {
          oldCallback(keyboard);
        }
      };

      oldOpen({ callback, ...payload });
    },
    [oldOpen, clear, removeTech, removeAdditionalItem, ignoreItem]
  );

  const control = useMemo(() => ({ close, open }), [close, open]);

  return (
    <PlaybookDeleteModalControlContext.Provider value={control}>
      {children}
    </PlaybookDeleteModalControlContext.Provider>
  );
}
