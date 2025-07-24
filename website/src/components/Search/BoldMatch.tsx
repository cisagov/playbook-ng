import Highlighter from "react-highlight-words";

/** Bold-ly Highlight Search Terms in Text */
export function BoldMatch(args: { text: string; search: string[] }) {
  return (
    <Highlighter
      autoEscape={true}
      highlightTag="strong"
      textToHighlight={args.text}
      searchWords={args.search}
    />
  );
}
