/**
 * Types for the markdown pipeline
 *
 * Re-exports MDAST types and defines custom types for VMark extensions.
 *
 * @module utils/markdownPipeline/types
 */

// Re-export standard MDAST types
export type {
  Root,
  Content,
  Paragraph,
  Heading,
  ThematicBreak,
  Blockquote,
  List,
  ListItem,
  Code,
  Html,
  Text,
  Emphasis,
  Strong,
  Delete,
  InlineCode,
  Link,
  Image,
  Table,
  TableRow,
  TableCell,
  Break,
  Definition,
  FootnoteDefinition,
  FootnoteReference,
} from "mdast";

// Math types from remark-math
export interface InlineMath {
  type: "inlineMath";
  value: string;
}

export interface Math {
  type: "math";
  value: string;
  meta?: string | null;
}

// Frontmatter type from remark-frontmatter
export interface Yaml {
  type: "yaml";
  value: string;
}

// Custom inline types for VMark
export interface Subscript {
  type: "subscript";
  children: PhrasingContent[];
}

export interface Superscript {
  type: "superscript";
  children: PhrasingContent[];
}

export interface Highlight {
  type: "highlight";
  children: PhrasingContent[];
}

export interface Underline {
  type: "underline";
  children: PhrasingContent[];
}

// Wiki link types
export interface WikiLink {
  type: "wikiLink";
  value: string; // The page name
  alias?: string; // Optional display alias
  data?: {
    permalink?: string;
    hProperties?: Record<string, unknown>;
  };
}

export interface WikiEmbed {
  type: "wikiEmbed";
  value: string; // The embedded resource path
  alias?: string;
}

// Union type for all phrasing (inline) content
export type PhrasingContent =
  | import("mdast").PhrasingContent
  | InlineMath
  | Subscript
  | Superscript
  | Highlight
  | Underline
  | WikiLink;

// Union type for all block content
export type BlockContent =
  | import("mdast").BlockContent
  | Math
  | Yaml
  | WikiEmbed;

// Augment MDAST module for custom types
declare module "mdast" {
  interface RootContentMap {
    yaml: Yaml;
    math: Math;
    wikiEmbed: WikiEmbed;
  }

  interface PhrasingContentMap {
    inlineMath: InlineMath;
    subscript: Subscript;
    superscript: Superscript;
    highlight: Highlight;
    underline: Underline;
    wikiLink: WikiLink;
  }
}
