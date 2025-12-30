/**
 * Image Input Rule
 *
 * Converts typed ![alt](url) into image nodes.
 * Enables seamless behavior where typing image markdown
 * immediately renders as an image.
 */

import { nodeRule } from "@milkdown/kit/prose";
import { $inputRule } from "@milkdown/kit/utils";
import { imageSchema } from "@milkdown/kit/preset/commonmark";

/**
 * Input rule for images.
 * When you type ![alt](url), it creates an image node.
 *
 * Pattern: ![alt text](url "optional title")
 * - alt text can be empty: ![]
 * - url is required
 * - title is optional: ![alt](url "title")
 */
export const imageInputRule = $inputRule((ctx) =>
  nodeRule(
    // Match: ![alt](url) or ![alt](url "title")
    // Groups: [1] = alt, [2] = url, [3] = title (optional)
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/,
    imageSchema.type(ctx),
    {
      getAttr: (match) => {
        return {
          src: match[2] ?? "",
          alt: match[1] ?? "",
          title: match[3] ?? "",
        };
      },
    }
  )
);
