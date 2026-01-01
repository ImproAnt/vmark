/**
 * Footnote Cleanup Logic
 *
 * Handles orphaned definition cleanup and renumbering when footnote references are deleted.
 */

import type { Transaction, Plugin } from "@milkdown/kit/prose/state";
import type { Node as ProsemirrorNode, NodeType } from "@milkdown/kit/prose/model";

type EditorState = Parameters<NonNullable<Plugin["spec"]["appendTransaction"]>>[2];

/**
 * Get all footnote reference labels from a document.
 */
export function getReferenceLabels(doc: ProsemirrorNode): Set<string> {
  const labels = new Set<string>();
  doc.descendants((node) => {
    if (node.type.name === "footnote_reference") {
      labels.add(node.attrs.label);
    }
    return true;
  });
  return labels;
}

/**
 * Get all footnote definition labels and positions from a document.
 */
export function getDefinitionInfo(doc: ProsemirrorNode): Array<{ label: string; pos: number; size: number }> {
  const defs: Array<{ label: string; pos: number; size: number }> = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "footnote_definition") {
      defs.push({ label: node.attrs.label, pos, size: node.nodeSize });
    }
    return true;
  });
  return defs;
}

/**
 * Create a transaction to renumber all footnotes.
 */
export function createRenumberTransaction(
  state: EditorState,
  refType: NodeType,
  defType: NodeType
): Transaction | null {
  const doc = state.doc;
  const schema = state.schema;

  // Get all references in document order
  const refs: Array<{ label: string; pos: number; size: number }> = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "footnote_reference") {
      refs.push({ label: node.attrs.label, pos, size: node.nodeSize });
    }
    return true;
  });

  if (refs.length === 0) return null;

  // Get all definitions
  const defs = getDefinitionInfo(doc);

  // Build label mapping based on reference order
  const labelMap = new Map<string, string>();
  refs.forEach((ref, index) => {
    const newLabel = String(index + 1);
    if (!labelMap.has(ref.label)) {
      labelMap.set(ref.label, newLabel);
    }
  });

  // Check if renumbering is actually needed
  let needsRenumber = false;
  for (const [oldLabel, newLabel] of labelMap) {
    if (oldLabel !== newLabel) {
      needsRenumber = true;
      break;
    }
  }
  if (!needsRenumber) return null;

  // Build transaction
  let tr = state.tr;

  // Update references (in reverse order)
  const sortedRefs = [...refs].sort((a, b) => b.pos - a.pos);
  for (const ref of sortedRefs) {
    const newLabel = labelMap.get(ref.label);
    if (newLabel && newLabel !== ref.label) {
      const mappedPos = tr.mapping.map(ref.pos);
      const newRefNode = refType.create({ label: newLabel });
      tr = tr.replaceWith(mappedPos, mappedPos + ref.size, newRefNode);
    }
  }

  // Build map of old label -> definition node content
  const defContentByLabel = new Map<string, ProsemirrorNode>();
  for (const def of defs) {
    const node = doc.nodeAt(def.pos);
    if (node) {
      defContentByLabel.set(def.label, node);
    }
  }

  // Delete all definitions (in reverse order)
  const sortedDefs = [...defs].sort((a, b) => b.pos - a.pos);
  for (const def of sortedDefs) {
    const mappedPos = tr.mapping.map(def.pos);
    tr = tr.delete(mappedPos, mappedPos + def.size);
  }

  // Get unique labels in reference order
  const orderedLabels: string[] = [];
  const seenLabels = new Set<string>();
  for (const ref of refs) {
    if (!seenLabels.has(ref.label)) {
      seenLabels.add(ref.label);
      orderedLabels.push(ref.label);
    }
  }

  // Re-insert definitions in order at document end
  let insertPos = tr.doc.content.size;
  const paragraphType = schema.nodes.paragraph;

  for (let i = 0; i < orderedLabels.length; i++) {
    const oldLabel = orderedLabels[i];
    const newLabel = String(i + 1);
    const oldDef = defContentByLabel.get(oldLabel);

    let newDefNode: ProsemirrorNode;
    if (oldDef) {
      newDefNode = defType.create({ label: newLabel }, oldDef.content);
    } else {
      const emptyPara = paragraphType.create();
      newDefNode = defType.create({ label: newLabel }, [emptyPara]);
    }

    tr = tr.insert(insertPos, newDefNode);
    insertPos += newDefNode.nodeSize;
  }

  return tr;
}

/**
 * Create a transaction to delete orphaned definitions and renumber remaining footnotes.
 */
export function createCleanupAndRenumberTransaction(
  state: EditorState,
  remainingRefLabels: Set<string>,
  refType: NodeType,
  defType: NodeType
): Transaction | null {
  const doc = state.doc;
  const schema = state.schema;

  // Get all references in document order (these are the ones that remain)
  const refs: Array<{ label: string; pos: number; size: number }> = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "footnote_reference") {
      refs.push({ label: node.attrs.label, pos, size: node.nodeSize });
    }
    return true;
  });

  // Get all definitions (including orphans)
  const allDefs = getDefinitionInfo(doc);

  // Build label mapping based on remaining reference order
  const labelMap = new Map<string, string>();
  refs.forEach((ref, index) => {
    const newLabel = String(index + 1);
    if (!labelMap.has(ref.label)) {
      labelMap.set(ref.label, newLabel);
    }
  });

  // Build map of old label -> definition node content (only non-orphaned)
  const defContentByLabel = new Map<string, ProsemirrorNode>();
  for (const def of allDefs) {
    if (remainingRefLabels.has(def.label)) {
      const node = doc.nodeAt(def.pos);
      if (node) {
        defContentByLabel.set(def.label, node);
      }
    }
  }

  // Build transaction
  let tr = state.tr;

  // Update references (in reverse order)
  const sortedRefs = [...refs].sort((a, b) => b.pos - a.pos);
  for (const ref of sortedRefs) {
    const newLabel = labelMap.get(ref.label);
    if (newLabel && newLabel !== ref.label) {
      const mappedPos = tr.mapping.map(ref.pos);
      const newRefNode = refType.create({ label: newLabel });
      tr = tr.replaceWith(mappedPos, mappedPos + ref.size, newRefNode);
    }
  }

  // Delete ALL definitions (in reverse order) - both orphaned and remaining
  const sortedDefs = [...allDefs].sort((a, b) => b.pos - a.pos);
  for (const def of sortedDefs) {
    const mappedPos = tr.mapping.map(def.pos);
    tr = tr.delete(mappedPos, mappedPos + def.size);
  }

  // Get unique labels in reference order (only remaining refs)
  const orderedLabels: string[] = [];
  const seenLabels = new Set<string>();
  for (const ref of refs) {
    if (!seenLabels.has(ref.label)) {
      seenLabels.add(ref.label);
      orderedLabels.push(ref.label);
    }
  }

  // Re-insert only non-orphaned definitions in order at document end
  let insertPos = tr.doc.content.size;
  const paragraphType = schema.nodes.paragraph;

  for (let i = 0; i < orderedLabels.length; i++) {
    const oldLabel = orderedLabels[i];
    const newLabel = String(i + 1);
    const oldDef = defContentByLabel.get(oldLabel);

    let newDefNode: ProsemirrorNode;
    if (oldDef) {
      newDefNode = defType.create({ label: newLabel }, oldDef.content);
    } else {
      const emptyPara = paragraphType.create();
      newDefNode = defType.create({ label: newLabel }, [emptyPara]);
    }

    tr = tr.insert(insertPos, newDefNode);
    insertPos += newDefNode.nodeSize;
  }

  return tr;
}
