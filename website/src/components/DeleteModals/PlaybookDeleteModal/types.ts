export type PlaybookDeletePayload =
  | {
      type: "close-playbook";
    }
  | {
      type: "remove-tech";
      id: string;
    }
  | {
      type: "remove-additional-item";
      id: string;
    }
  | {
      type: "ignore-item";
      id: string;
    };

export type PlaybookDeleteModalArgs = {
  callback?: (keyboard: boolean) => void;
} & PlaybookDeletePayload;
