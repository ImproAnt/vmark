/**
 * Floating Math Preview for WYSIWYG Mode
 *
 * Shows a floating preview when cursor is inside a latex/math code block.
 * Complements the inline code preview by providing live feedback while editing.
 * Handles both "latex" (from code fences) and "$$math$$" (from $$ syntax).
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { getMathPreviewView } from "@/plugins/mathPreview/MathPreviewView";

const floatingMathPreviewKey = new PluginKey("floatingMathPreview");

/** Check if language is a latex/math language */
function isLatexLanguage(lang: string): boolean {
  return lang === "latex" || lang === "$$math$$";
}

export const floatingMathPreviewExtension = Extension.create({
  name: "floatingMathPreview",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: floatingMathPreviewKey,
        view(editorView) {
          let currentCodeBlockPos: number | null = null;
          let updateScheduled = false;

          const scheduleUpdate = () => {
            if (updateScheduled) return;
            updateScheduled = true;
            requestAnimationFrame(() => {
              updateScheduled = false;
              checkMathAtCursor();
            });
          };

          const checkMathAtCursor = () => {
            const { state } = editorView;
            const { selection } = state;
            const { $from } = selection;

            // Find if we're inside a code block
            let codeBlockNode = null;
            let codeBlockPos = -1;

            for (let depth = $from.depth; depth >= 0; depth--) {
              const node = $from.node(depth);
              if (node.type.name === "codeBlock" || node.type.name === "code_block") {
                codeBlockNode = node;
                codeBlockPos = $from.before(depth);
                break;
              }
            }

            // Check if it's a latex/math code block
            if (codeBlockNode) {
              const language = (codeBlockNode.attrs.language ?? "").toLowerCase();
              if (isLatexLanguage(language)) {
                currentCodeBlockPos = codeBlockPos;
                showPreview(codeBlockNode.textContent, codeBlockPos, codeBlockPos + codeBlockNode.nodeSize);
                return;
              }
            }

            // Not in a latex code block
            hidePreview();
          };

          const showPreview = (content: string, from: number, to: number) => {
            const preview = getMathPreviewView();

            // Get coordinates for the code block
            try {
              const fromCoords = editorView.coordsAtPos(from);
              const toCoords = editorView.coordsAtPos(to);

              const anchorRect = {
                top: fromCoords.top,
                left: fromCoords.left,
                bottom: toCoords.bottom,
                right: Math.max(fromCoords.right, toCoords.right),
              };

              if (preview.isVisible()) {
                preview.updateContent(content);
                preview.updatePosition(anchorRect);
              } else {
                preview.show(content, anchorRect, editorView.dom);
              }
            } catch {
              // Position calculation failed
              hidePreview();
            }
          };

          const hidePreview = () => {
            if (currentCodeBlockPos !== null) {
              currentCodeBlockPos = null;
              getMathPreviewView().hide();
            }
          };

          // Initial check
          scheduleUpdate();

          return {
            update(view, prevState) {
              if (view.state.selection !== prevState.selection || view.state.doc !== prevState.doc) {
                scheduleUpdate();
              }
            },
            destroy() {
              hidePreview();
            },
          };
        },
      }),
    ];
  },
});
