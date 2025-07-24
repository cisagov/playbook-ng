import { useMemo, useState } from "react";
import { PlaybookDeleteModal } from "./PlaybookDeleteModal/PlaybookDeleteModal";
import { PlaybookDeleteModalControlContext } from "./PlaybookDeleteModal/PlaybookDeleteModalControlContext";
import { PlaybookDeleteModalArgs } from "./PlaybookDeleteModal/types";

export function GlobalDeleteModals(args: { children: React.ReactNode }) {
  const { children } = args;

  const [modal, setModal] = useState<null | PlaybookDeleteModalArgs>(null);
  const control = useMemo(
    () => ({
      open: setModal,
      close: () => setModal(null),
    }),
    []
  );

  return (
    <PlaybookDeleteModalControlContext.Provider value={control}>
      {children}
      {modal ? <PlaybookDeleteModal {...modal} /> : null}
    </PlaybookDeleteModalControlContext.Provider>
  );
}
