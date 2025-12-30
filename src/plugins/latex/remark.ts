/**
 * Remark plugins for math support
 *
 * Uses remark-math to parse $...$ (inline) and $$...$$ (block) syntax.
 * Block math is handled by the dedicated math_block node.
 */

import { $remark } from "@milkdown/kit/utils";
import remarkMath from "remark-math";

/**
 * Remark plugin that adds math parsing support.
 * Parses $...$ for inline math and $$...$$ for block math.
 */
export const remarkMathPlugin = $remark<"remarkMath", undefined>(
  "remarkMath",
  () => remarkMath
);
