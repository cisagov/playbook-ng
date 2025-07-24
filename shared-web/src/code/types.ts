/**
 * argument for useFilePicker's onFilesSuccessfullySelected callback
 */
export type FileSelectArgs = {
  plainFiles: { name: string }[];
  filesContent: { content: string }[];
};
