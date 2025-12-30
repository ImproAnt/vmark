/**
 * Mermaid Block Schema
 *
 * Dedicated block node for mermaid diagrams.
 * Supports ```mermaid syntax in markdown.
 */

import { $nodeSchema } from "@milkdown/kit/utils";

export const mermaidBlockId = "mermaid_block";

/**
 * Schema for mermaid block node.
 * Stores the mermaid code as text content within the node.
 */
export const mermaidBlockSchema = $nodeSchema(mermaidBlockId, () => ({
  group: "block",
  content: "text*",
  marks: "",
  defining: true,
  isolating: true,
  atom: false,
  code: true,
  attrs: {},
  parseDOM: [
    {
      tag: `div[data-type="${mermaidBlockId}"]`,
      preserveWhitespace: "full" as const,
      getAttrs: () => ({}),
    },
  ],
  toDOM: () => {
    return [
      "div",
      {
        "data-type": mermaidBlockId,
        class: "mermaid-block",
      },
      0,
    ] as const;
  },
  parseMarkdown: {
    match: (node) => node.type === "code" && node.lang === "mermaid",
    runner: (state, node, type) => {
      const value = (node.value as string) || "";
      state.openNode(type);
      if (value) {
        state.addText(value);
      }
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === mermaidBlockId,
    runner: (state, node) => {
      state.addNode("code", undefined, node.textContent || "", {
        lang: "mermaid",
      });
    },
  },
}));
