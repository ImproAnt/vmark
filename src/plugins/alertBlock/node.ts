/**
 * Alert Block Node Definition
 *
 * ProseMirror node schema for GitHub-style alert blocks.
 */

import { $nodeSchema, $nodeAttr } from "@milkdown/kit/utils";
import type { AlertType } from "./remark-plugin";
import { ALERT_TYPES } from "./remark-plugin";

/**
 * Alert type attribute
 */
export const alertTypeAttr = $nodeAttr("alertBlock", () => ({
  default: "NOTE" as AlertType,
}));

/**
 * Alert block node schema
 */
export const alertBlockSchema = $nodeSchema("alertBlock", () => {
  return {
    group: "block",
    content: "block+",
    defining: true,
    attrs: {
      alertType: { default: "NOTE" },
    },

    parseDOM: [
      {
        tag: "div[data-alert-type]",
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          const type = el.getAttribute("data-alert-type")?.toUpperCase();
          return {
            alertType: ALERT_TYPES.includes(type as AlertType) ? type : "NOTE",
          };
        },
      },
    ],

    toDOM: (node) => {
      const alertType = (node.attrs.alertType as string).toLowerCase();
      return [
        "div",
        {
          "data-alert-type": node.attrs.alertType,
          class: `alert-block alert-${alertType}`,
        },
        [
          "div",
          { class: "alert-title", contenteditable: "false" },
          node.attrs.alertType,
        ],
        ["div", { class: "alert-content" }, 0],
      ];
    },

    parseMarkdown: {
      match: (node) =>
        node.type === "blockquote" &&
        "alertType" in node &&
        typeof (node as unknown as { alertType: string }).alertType === "string",
      runner: (state, node, type) => {
        const alertType = (node as unknown as { alertType: string }).alertType;
        state.openNode(type, { alertType });
        state.next(node.children as Array<{ type: string }>);
        state.closeNode();
      },
    },

    toMarkdown: {
      match: (node) => node.type.name === "alertBlock",
      runner: (state, node) => {
        const alertType = node.attrs.alertType as string;

        // Open blockquote
        state.openNode("blockquote");

        // Add [!TYPE] as first paragraph
        state.openNode("paragraph");
        state.addNode("text", undefined, `[!${alertType}]`);
        state.closeNode();

        // Add content (will be wrapped in blockquote > syntax)
        state.next(node.content);

        // Close blockquote
        state.closeNode();
      },
    },
  };
});
