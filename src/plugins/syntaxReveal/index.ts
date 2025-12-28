/**
 * Syntax Reveal Plugin - Decoration-based Approach
 *
 * Shows markdown syntax markers (**, *, `, ~~, []) when cursor
 * is inside a formatted mark. Uses ProseMirror decorations to
 * display syntax without modifying document structure.
 */

import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";
import type { Node, Mark, ResolvedPos } from "@milkdown/kit/prose/model";

// Plugin key for external access
export const syntaxRevealPluginKey = new PluginKey("syntaxReveal");

// Mark type to syntax mapping
const MARK_SYNTAX: Record<string, { open: string; close: string }> = {
  strong: { open: "**", close: "**" },
  emphasis: { open: "*", close: "*" },
  inlineCode: { open: "`", close: "`" },
  strikethrough: { open: "~~", close: "~~" },
};

// Link mark needs special handling
const LINK_MARK = "link";

interface MarkRange {
  mark: Mark;
  from: number;
  to: number;
}

/**
 * Find all mark ranges that contain the given position
 */
function findMarksAtPosition(
  doc: Node,
  pos: number,
  $pos: ResolvedPos
): MarkRange[] {
  const ranges: MarkRange[] = [];

  // Get the parent node and iterate through its content
  const parent = $pos.parent;
  const parentStart = $pos.start();

  parent.forEach((child, childOffset) => {
    const from = parentStart + childOffset;
    const to = from + child.nodeSize;

    // Check if position is within this child's range
    if (pos >= from && pos <= to && child.isText) {
      child.marks.forEach((mark) => {
        // Find the full extent of this mark
        const markRange = findMarkRange(doc, from, mark);
        if (markRange && pos >= markRange.from && pos <= markRange.to) {
          // Avoid duplicates
          if (!ranges.some((r) => r.from === markRange.from && r.to === markRange.to)) {
            ranges.push(markRange);
          }
        }
      });
    }
  });

  return ranges;
}

/**
 * Find the full range of a mark starting from a position
 */
function findMarkRange(doc: Node, pos: number, mark: Mark): MarkRange | null {
  const $pos = doc.resolve(pos);
  const parent = $pos.parent;
  const parentStart = $pos.start();

  let from = pos;
  let to = pos;

  // Scan backwards
  parent.forEach((child, childOffset) => {
    const childFrom = parentStart + childOffset;
    const childTo = childFrom + child.nodeSize;

    if (childTo <= pos && child.isText && mark.isInSet(child.marks)) {
      from = Math.min(from, childFrom);
    }
  });

  // Scan forwards
  parent.forEach((child, childOffset) => {
    const childFrom = parentStart + childOffset;
    const childTo = childFrom + child.nodeSize;

    if (childFrom >= pos && child.isText && mark.isInSet(child.marks)) {
      to = Math.max(to, childTo);
    }
  });

  // Re-scan to get accurate boundaries
  from = pos;
  to = pos;
  let foundStart = false;

  parent.forEach((child, childOffset) => {
    const childFrom = parentStart + childOffset;
    const childTo = childFrom + child.nodeSize;

    if (child.isText && mark.isInSet(child.marks)) {
      if (!foundStart) {
        from = childFrom;
        foundStart = true;
      }
      to = childTo;
    } else if (foundStart && childFrom > to) {
      // Mark ended
    }
  });

  // Verify the position is within this range
  if (pos >= from && pos <= to) {
    return { mark, from, to };
  }

  return null;
}

/**
 * Create the syntax reveal plugin
 */
export const syntaxRevealPlugin = $prose(() => {
  return new Plugin({
    key: syntaxRevealPluginKey,

    state: {
      init() {
        return DecorationSet.empty;
      },

      apply(tr, decorations, _oldState, newState) {
        // Only update on selection change
        if (!tr.selectionSet && !tr.docChanged) {
          return decorations;
        }

        const { selection } = newState;
        const { $from, empty } = selection;

        // Only show syntax for cursor (not selection)
        if (!empty) {
          return DecorationSet.empty;
        }

        const pos = $from.pos;
        const markRanges = findMarksAtPosition(newState.doc, pos, $from);

        if (markRanges.length === 0) {
          return DecorationSet.empty;
        }

        // Create decorations (we need view for this, handled in props)
        return decorations;
      },
    },

    props: {
      decorations(state) {
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty) {
          return DecorationSet.empty;
        }

        const pos = $from.pos;
        const markRanges = findMarksAtPosition(state.doc, pos, $from);

        if (markRanges.length === 0) {
          return DecorationSet.empty;
        }

        // We need to create decorations here since we have access to document
        const decorations: Decoration[] = [];

        for (const { mark, from, to } of markRanges) {
          const syntax = MARK_SYNTAX[mark.type.name];

          if (syntax) {
            decorations.push(
              Decoration.widget(from, createSyntaxWidget(syntax.open, "open"), { side: -1 })
            );
            decorations.push(
              Decoration.widget(to, createSyntaxWidget(syntax.close, "close"), { side: 1 })
            );
          } else if (mark.type.name === LINK_MARK) {
            const href = mark.attrs.href || "";
            decorations.push(
              Decoration.widget(from, createSyntaxWidget("[", "link-open"), { side: -1 })
            );
            decorations.push(
              Decoration.widget(to, createSyntaxWidget(`](${href})`, "link-close"), { side: 1 })
            );
          }
        }

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
});

/**
 * Create a syntax widget element
 */
function createSyntaxWidget(text: string, type: string) {
  return () => {
    const span = document.createElement("span");
    span.className = `syntax-marker syntax-marker-${type}`;
    span.textContent = text;
    span.contentEditable = "false";
    return span;
  };
}

export default syntaxRevealPlugin;
