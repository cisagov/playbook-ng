// ref: https://github.com/syntax-tree/mdast

import type {
  Parent,
  Literal,
  Root,
  Paragraph,
  Heading,
  ThematicBreak,
  Blockquote,
  List,
  ListItem,
  Table,
  TableRow,
  TableCell,
  Html,
  Code,
  Yaml,
  Definition,
  FootnoteDefinition,
  Text,
  Emphasis,
  Strong,
  Delete,
  InlineCode,
  Break,
  Link,
  Image,
  LinkReference,
  ImageReference,
  FootnoteReference,
  Resource,
  Association,
  Reference,
  Alternative,
} from "mdast";
export type {
  Parent,
  Literal,
  Root,
  Paragraph,
  Heading,
  ThematicBreak,
  Blockquote,
  List,
  ListItem,
  Table,
  TableRow,
  TableCell,
  Html,
  Code,
  Yaml,
  Definition,
  FootnoteDefinition,
  Text,
  Emphasis,
  Strong,
  Delete,
  InlineCode,
  Break,
  Link,
  Image,
  LinkReference,
  ImageReference,
  FootnoteReference,
  Resource,
  Association,
  Reference,
  Alternative,
};

export interface TOML extends Literal {
  type: "toml";
}

export interface Math extends Literal {
  type: "math";
}

export interface InlineMath extends Literal {
  type: "inlineMath";
}

export type Content =
  | TopLevelContent
  | ListContent
  | TableContent
  | RowContent
  | PhrasingContent;

export type TopLevelContent =
  | BlockContent
  | FrontmatterContent
  | DefinitionContent;

export type BlockContent =
  | Paragraph
  | Heading
  | ThematicBreak
  | Blockquote
  | List
  | Table
  | Html
  | Code
  | Math;

export type FrontmatterContent = Yaml | TOML;

export type DefinitionContent = Definition | FootnoteDefinition;

export type ListContent = ListItem;

export type TableContent = TableRow;

export type RowContent = TableCell;

export type PhrasingContent = StaticPhrasingContent | Link | LinkReference;

export type StaticPhrasingContent =
  | Text
  | Emphasis
  | Strong
  | Delete
  | Html
  | InlineCode
  | Break
  | Image
  | ImageReference
  | FootnoteReference
  | InlineMath;
