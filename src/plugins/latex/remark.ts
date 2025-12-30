/**
 * Remark plugins for math support
 *
 * Uses remark-math to parse $...$ (inline) and $$...$$ (block) syntax.
 * Block math is converted to code blocks with language "latex" for rendering.
 */

import type { Node } from "@milkdown/kit/transformer";
import { $remark } from "@milkdown/kit/utils";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";

/**
 * Remark plugin that adds math parsing support.
 * Parses $...$ for inline math and $$...$$ for block math.
 */
export const remarkMathPlugin = $remark<"remarkMath", undefined>(
  "remarkMath",
  () => remarkMath
);

/**
 * Transform math blocks into code blocks with language "latex".
 * This allows them to be rendered using the code block preview feature.
 */
function visitMathBlock(ast: Node) {
  return visit(
    ast,
    "math",
    (
      node: Node & { value: string },
      index: number,
      parent: Node & { children: Node[] }
    ) => {
      const { value } = node;
      const newNode = {
        type: "code",
        lang: "latex",
        value,
      };
      parent.children.splice(index, 1, newNode);
    }
  );
}

/**
 * Remark plugin that converts math blocks to latex code blocks.
 */
export const remarkMathBlockPlugin = $remark(
  "remarkMathBlock",
  () => () => visitMathBlock
);
