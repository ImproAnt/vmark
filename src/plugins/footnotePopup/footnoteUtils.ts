/**
 * Footnote Utilities
 *
 * Functions for inserting and renumbering footnotes.
 */

import type { Ctx } from "@milkdown/kit/ctx";
import { editorViewCtx } from "@milkdown/kit/core";
import type { EditorView } from "@milkdown/kit/prose/view";
import type { Node as ProsemirrorNode } from "@milkdown/kit/prose/model";
import { useFootnotePopupStore } from "@/stores/footnotePopupStore";
import { createRenumberTransaction } from "./footnoteCleanup";

interface FootnoteRef {
  label: string;
  pos: number;
  node: ProsemirrorNode;
}

interface FootnoteDef {
  label: string;
  pos: number;
  node: ProsemirrorNode;
}

/**
 * Collect all footnote references in document order.
 */
export function getAllReferences(view: EditorView): FootnoteRef[] {
  const refs: FootnoteRef[] = [];
  const { doc } = view.state;

  doc.descendants((node, pos) => {
    if (node.type.name === "footnote_reference") {
      refs.push({ label: node.attrs.label, pos, node });
    }
    return true;
  });

  return refs;
}

/**
 * Collect all footnote definitions.
 */
export function getAllDefinitions(view: EditorView): FootnoteDef[] {
  const defs: FootnoteDef[] = [];
  const { doc } = view.state;

  doc.descendants((node, pos) => {
    if (node.type.name === "footnote_definition") {
      defs.push({ label: node.attrs.label, pos, node });
    }
    return true;
  });

  return defs;
}

/**
 * Find the next available footnote number.
 * Scans existing footnotes and returns max + 1.
 */
export function getNextFootnoteNumber(view: EditorView): number {
  const refs = getAllReferences(view);
  const defs = getAllDefinitions(view);

  // Collect all numeric labels
  const labels = new Set<number>();
  for (const ref of refs) {
    const num = parseInt(ref.label, 10);
    if (!isNaN(num)) labels.add(num);
  }
  for (const def of defs) {
    const num = parseInt(def.label, 10);
    if (!isNaN(num)) labels.add(num);
  }

  if (labels.size === 0) return 1;
  return Math.max(...labels) + 1;
}

/**
 * Find the position to insert a new footnote definition.
 * If there are existing definitions, insert before the first one.
 * Otherwise, insert at the end of the document.
 */
function findDefinitionInsertPos(view: EditorView): number {
  const { doc } = view.state;
  const defs = getAllDefinitions(view);

  if (defs.length > 0) {
    // Insert before first definition
    return defs[0].pos;
  }

  // Insert at end of document
  return doc.content.size;
}

/**
 * Insert a new footnote at cursor position.
 * Creates both reference and definition, then auto-renumbers all footnotes.
 * Returns the final label and definition position for popup.
 */
export function insertFootnote(ctx: Ctx): { label: string; defPos: number } | null {
  const view = ctx.get(editorViewCtx);
  const { state, dispatch } = view;
  const { schema, selection } = state;

  // Remember where we're inserting
  const insertPos = selection.from;

  // Get node types from schema
  const refType = schema.nodes.footnote_reference;
  const defType = schema.nodes.footnote_definition;
  const paragraphType = schema.nodes.paragraph;

  if (!refType || !defType || !paragraphType) {
    console.error("[Footnote] Missing node types");
    return null;
  }

  // Use a temporary label - will be fixed by renumber
  const tempLabel = "_new_";

  // Create reference node
  const refNode = refType.create({ label: tempLabel });

  // Create definition node with empty paragraph
  const emptyPara = paragraphType.create();
  const defNode = defType.create({ label: tempLabel }, [emptyPara]);

  // Find insert position for definition
  const defInsertPos = findDefinitionInsertPos(view);

  // Build transaction
  let tr = state.tr;

  // First insert reference at cursor (this might shift positions)
  tr = tr.insert(insertPos, refNode);

  // Adjust definition position if reference was inserted before it
  const adjustedDefPos = insertPos < defInsertPos
    ? defInsertPos + refNode.nodeSize
    : defInsertPos;

  // Insert definition
  tr = tr.insert(adjustedDefPos, defNode);

  // Dispatch insertion
  dispatch(tr);

  // Now renumber all footnotes - this will assign the correct sequential label
  renumberFootnotes(ctx);

  // After renumbering, find the footnote at our insert position
  // The reference should be at insertPos in the new state
  const newView = ctx.get(editorViewCtx);
  const refs = getAllReferences(newView);

  // Find the reference closest to our original insert position
  let newLabel: string | null = null;
  for (const ref of refs) {
    // The reference at insertPos is the one we just added
    if (ref.pos === insertPos || ref.pos === insertPos + 1) {
      newLabel = ref.label;
      break;
    }
  }

  // If we couldn't find by exact position, find by document order
  // The new footnote's label is its position in document order
  if (!newLabel) {
    // Count how many references come before insertPos
    let count = 0;
    for (const ref of refs) {
      if (ref.pos <= insertPos) count++;
    }
    newLabel = String(count);
  }

  // Find the definition for this label
  const defs = getAllDefinitions(newView);
  const def = defs.find(d => d.label === newLabel);
  const newDefPos = def?.pos ?? null;

  if (!newLabel || newDefPos === null) {
    console.error("[Footnote] Could not find inserted footnote after renumber");
    return null;
  }

  return { label: newLabel, defPos: newDefPos };
}

/**
 * Renumber all footnotes in document order.
 * Uses createRenumberTransaction from footnoteCleanup for the logic.
 */
export function renumberFootnotes(ctx: Ctx): boolean {
  const view = ctx.get(editorViewCtx);
  const { state, dispatch } = view;

  const refType = state.schema.nodes.footnote_reference;
  const defType = state.schema.nodes.footnote_definition;
  if (!refType || !defType) return false;

  const tr = createRenumberTransaction(state, refType, defType);
  if (!tr) return false;

  dispatch(tr);
  return true;
}

/**
 * Open footnote popup for a newly inserted footnote.
 * Auto-focuses the textarea for immediate editing.
 */
export function openPopupForNewFootnote(
  view: EditorView,
  label: string,
  defPos: number
) {
  // Need to wait for DOM to update
  requestAnimationFrame(() => {
    // Find the reference element in the DOM
    const refEl = view.dom.querySelector(
      `sup[data-type="footnote_reference"][data-label="${label}"]`
    );

    if (!refEl) {
      console.warn("[Footnote] Could not find reference element for popup");
      return;
    }

    const rect = refEl.getBoundingClientRect();
    // Pass autoFocus=true to focus textarea immediately
    useFootnotePopupStore.getState().openPopup(label, "", rect, defPos, true);
  });
}
