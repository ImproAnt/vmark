/**
 * Alert Block Input Rule
 *
 * Triggers alert block creation when typing > [!TYPE]
 */

import { $inputRule } from "@milkdown/kit/utils";
import { InputRule } from "@milkdown/kit/prose/inputrules";
import { TextSelection } from "@milkdown/kit/prose/state";
import { alertBlockSchema } from "./node";
import { ALERT_TYPES, type AlertType } from "./remark-plugin";

// Pattern: > [!TYPE] at start of line, followed by space
// Matches: "> [!NOTE] ", "> [!WARNING] ", etc.
const ALERT_INPUT_PATTERN = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s$/i;

/**
 * Input rule to create alert block when typing > [!TYPE]
 */
export const alertBlockInputRule = $inputRule((ctx) => {
  const alertType = alertBlockSchema.type(ctx);

  return new InputRule(ALERT_INPUT_PATTERN, (state, match, start, end) => {
    const typeName = match[1].toUpperCase();

    // Validate it's a known alert type
    if (!ALERT_TYPES.includes(typeName as AlertType)) {
      return null;
    }

    // Get paragraph node type for content
    const paragraphType = state.schema.nodes.paragraph;
    if (!paragraphType) {
      return null;
    }

    // Create alert block with empty paragraph
    const alertNode = alertType.create(
      { alertType: typeName },
      paragraphType.create()
    );

    // Replace the typed text with the alert block
    const tr = state.tr.replaceWith(start, end, alertNode);

    // Move cursor inside the alert content
    // Calculate position: start + 1 (enter alertBlock) + 1 (enter alert-content div) + 1 (enter paragraph)
    const contentPos = tr.doc.resolve(start).nodeAfter;
    const cursorPos = contentPos
      ? start + contentPos.nodeSize - 2 // Position inside the paragraph (before closing tags)
      : start + 1;

    return tr.setSelection(TextSelection.near(tr.doc.resolve(cursorPos)));
  });
});
