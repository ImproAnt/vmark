/**
 * Block LaTeX Schema Extension
 *
 * Extends the code block schema to serialize latex code blocks
 * as $$...$$ math blocks in markdown.
 */

import { codeBlockSchema } from "@milkdown/kit/preset/commonmark";

/**
 * Extends code block to serialize "latex" language blocks as math blocks.
 * Input: ```latex\nE=mc^2\n```
 * Output in markdown: $$\nE=mc^2\n$$
 */
export const blockLatexSchema = codeBlockSchema.extendSchema((prev) => {
  return (ctx) => {
    const baseSchema = prev(ctx);
    return {
      ...baseSchema,
      toMarkdown: {
        match: baseSchema.toMarkdown.match,
        runner: (state, node) => {
          const language = node.attrs.language ?? "";
          if (language.toLowerCase() === "latex") {
            state.addNode(
              "math",
              undefined,
              node.content.firstChild?.text || ""
            );
          } else {
            return baseSchema.toMarkdown.runner(state, node);
          }
        },
      },
    };
  };
});
