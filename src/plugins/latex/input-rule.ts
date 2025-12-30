/**
 * Input Rules for Math
 *
 * Triggers:
 * - $E=mc^2$ → creates inline math node
 * - $$ (at line start) → creates code block with language "latex"
 */

import { codeBlockSchema } from "@milkdown/kit/preset/commonmark";
import { nodeRule } from "@milkdown/kit/prose";
import { textblockTypeInputRule } from "@milkdown/kit/prose/inputrules";
import { $inputRule } from "@milkdown/kit/utils";

import { mathInlineSchema } from "./inline-latex";

/**
 * Input rule for inline math.
 * When you type $E=MC^2$, it creates an inline math node.
 */
export const mathInlineInputRule = $inputRule((ctx) =>
  nodeRule(/(?:\$)([^$]+)(?:\$)$/, mathInlineSchema.type(ctx), {
    getAttr: (match) => {
      return {
        value: match[1] ?? "",
      };
    },
  })
);

/**
 * Input rule for creating block math.
 * Typing "$$ " at the start of a line creates a code block with language latex.
 */
export const mathBlockInputRule = $inputRule((ctx) =>
  textblockTypeInputRule(/^\$\$\s$/, codeBlockSchema.type(ctx), () => ({
    language: "latex",
  }))
);
