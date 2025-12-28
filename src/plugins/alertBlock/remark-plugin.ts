/**
 * Remark Plugin for GitHub-style Alert Blocks
 *
 * Transforms blockquotes starting with [!TYPE] into alert blocks.
 * Supported types: NOTE, TIP, IMPORTANT, WARNING, CAUTION
 */

import { $remark } from "@milkdown/kit/utils";
import { visit } from "unist-util-visit";
import type { Root, Blockquote, Paragraph, Text } from "mdast";

// Valid alert types
export const ALERT_TYPES = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

// Regex to match [!TYPE] at start of text
const ALERT_PATTERN = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;

/**
 * Check if a blockquote is an alert block and extract its type
 */
function getAlertType(node: Blockquote): AlertType | null {
  // First child must be a paragraph
  const firstChild = node.children[0];
  if (!firstChild || firstChild.type !== "paragraph") {
    return null;
  }

  // First element in paragraph must be text
  const paragraph = firstChild as Paragraph;
  const firstText = paragraph.children[0];
  if (!firstText || firstText.type !== "text") {
    return null;
  }

  // Check for [!TYPE] pattern
  const text = firstText as Text;
  const match = text.value.match(ALERT_PATTERN);
  if (!match) {
    return null;
  }

  return match[1].toUpperCase() as AlertType;
}

/**
 * Remove the [!TYPE] marker from the first paragraph
 */
function removeAlertMarker(node: Blockquote): void {
  const firstChild = node.children[0] as Paragraph;
  const firstText = firstChild.children[0] as Text;

  // Remove the [!TYPE] prefix from text
  firstText.value = firstText.value.replace(ALERT_PATTERN, "");

  // If text is now empty, remove it
  if (firstText.value === "") {
    firstChild.children.shift();
  }

  // If paragraph is now empty, remove it
  if (firstChild.children.length === 0) {
    node.children.shift();
  }
}

/**
 * Remark plugin to transform GitHub-style alert blockquotes
 */
function remarkAlertBlocks() {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const alertType = getAlertType(node);
      if (alertType) {
        // Mark the node as an alert block
        (node as Blockquote & { alertType: AlertType }).alertType = alertType;

        // Remove the [!TYPE] marker from content
        removeAlertMarker(node);
      }
    });
  };
}

/**
 * Milkdown remark plugin wrapper
 */
export const remarkAlertPlugin = $remark("alertBlock", () => remarkAlertBlocks);
