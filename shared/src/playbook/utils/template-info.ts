import { Dataset, Template } from "../../dataset/types";
import { Playbook } from "../types";

export type UsedTemplateInfo =
  | {
      status: "no template used";
      template: null;
      display: "no template used";
    }
  | {
      status: "unknown template used";
      template: null;
      display: string;
    }
  | {
      status: "template used";
      template: Template;
      display: string;
    };

function noTemplateUsed(): UsedTemplateInfo {
  return {
    status: "no template used",
    template: null,
    display: "no template used",
  };
}

function unknownTemplateUsed(id: string): UsedTemplateInfo {
  return {
    status: "unknown template used",
    template: null,
    display: `Unknown Template (${id})`,
  };
}

function templateUsed(template: Template): UsedTemplateInfo {
  const { id, name } = template;
  return {
    status: "template used",
    template,
    display: `${name} (${id})`,
  };
}

export function getUsedTemplateInfo(args: {
  playbook: Playbook;
  dataset: Dataset;
}): UsedTemplateInfo {
  const { playbook, dataset } = args;
  const id = playbook.template_used;

  if (id === null) {
    return noTemplateUsed();
  }

  const template = dataset.templates.find((t) => t.id === id);

  if (typeof template === "undefined") {
    return unknownTemplateUsed(id);
  }

  return templateUsed(template);
}
