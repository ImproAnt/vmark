/**
 * Math Block Schema
 *
 * Dedicated block node for math expressions (not a code block).
 * Supports $$...$$ syntax in markdown.
 */

import { $nodeSchema } from "@milkdown/kit/utils";

export const mathBlockId = "math_block";

/**
 * Schema for block math node.
 * Stores the LaTeX content as text content within the node.
 */
export const mathBlockSchema = $nodeSchema(mathBlockId, () => ({
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
      tag: `div[data-type="${mathBlockId}"]`,
      preserveWhitespace: "full" as const,
      getAttrs: () => ({}),
    },
  ],
  toDOM: () => {
    return [
      "div",
      {
        "data-type": mathBlockId,
        class: "math-block",
      },
      0,
    ] as const;
  },
  parseMarkdown: {
    match: (node) => node.type === "math",
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
    match: (node) => node.type.name === mathBlockId,
    runner: (state, node) => {
      state.addNode("math", undefined, node.textContent || "");
    },
  },
}));
