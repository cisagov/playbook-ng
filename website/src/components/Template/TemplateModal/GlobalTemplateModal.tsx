import { TemplateModalControlContext } from "@/contexts/TemplateModalControlContext";
import { Template } from "@playbook-ng/shared/src/dataset/types";
import { useMemo, useState } from "react";
import { TemplateModal } from "./TemplateModal";

export function GlobalTemplateModal(args: { children: React.ReactNode }) {
  const { children } = args;

  const [template, setTemplate] = useState<null | Template>(null);

  const control = useMemo(
    () => ({
      open: (t: Template) => setTemplate(t),
      close: () => setTemplate(null),
    }),
    []
  );

  return (
    <TemplateModalControlContext.Provider value={control}>
      {children}
      {template ? <TemplateModal template={template} /> : null}
    </TemplateModalControlContext.Provider>
  );
}
