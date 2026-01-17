import { describe, it, expect } from "vitest";
import StarterKit from "@tiptap/starter-kit";
import { getSchema } from "@tiptap/core";
import { EditorState, TextSelection, SelectionRange } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";
import { MultiSelection } from "@/plugins/multiCursor/MultiSelection";
import {
  createMarkdownPasteTransaction,
  shouldHandleMarkdownPaste,
} from "./tiptap";

type PasteMode = "auto" | "off";

const schema = getSchema([StarterKit]);

function createParagraphDoc(text: string) {
  const paragraph = schema.nodes.paragraph.create(
    null,
    text ? schema.text(text) : undefined
  );
  return schema.nodes.doc.create(null, [paragraph]);
}

function containsNode(doc: PMNode, typeName: string): boolean {
  let found = false;
  doc.descendants((node) => {
    if (node.type.name === typeName) {
      found = true;
      return false;
    }
    return true;
  });
  return found;
}

function createState(doc: PMNode, selectionPos = 1) {
  return EditorState.create({
    doc,
    selection: TextSelection.create(doc, selectionPos),
  });
}

function createMultiSelectionState(doc: PMNode, ranges: Array<{ from: number; to: number }>) {
  const base = EditorState.create({ doc });
  const selectionRanges = ranges.map((range) => {
    return new SelectionRange(doc.resolve(range.from), doc.resolve(range.to));
  });
  const multiSel = new MultiSelection(selectionRanges, 0);
  return base.apply(base.tr.setSelection(multiSel));
}

describe("markdownPasteExtension", () => {
  it("creates code blocks from fenced markdown", () => {
    const state = createState(createParagraphDoc(""));
    const tr = createMarkdownPasteTransaction(state, "```js\nconst a = 1;\n```");
    expect(tr).not.toBeNull();

    if (tr) {
      const next = state.apply(tr);
      expect(containsNode(next.doc, "codeBlock")).toBe(true);
    }
  });

  it("creates lists from markdown list text", () => {
    const state = createState(createParagraphDoc(""));
    const tr = createMarkdownPasteTransaction(state, "- first\n- second");
    expect(tr).not.toBeNull();

    if (tr) {
      const next = state.apply(tr);
      expect(containsNode(next.doc, "bulletList")).toBe(true);
    }
  });

  it("skips markdown parsing inside code blocks", () => {
    const codeBlock = schema.nodes.codeBlock.create(null, schema.text("code"));
    const doc = schema.nodes.doc.create(null, [codeBlock]);
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 2),
    });

    const result = shouldHandleMarkdownPaste(state, "- item", {
      pasteMode: "auto",
      hasHtml: false,
    });
    expect(result).toBe(false);
  });

  it("skips markdown parsing for multi-selection", () => {
    const doc = createParagraphDoc("hello world");
    const state = createMultiSelectionState(doc, [
      { from: 1, to: 6 },
      { from: 7, to: 12 },
    ]);

    const result = shouldHandleMarkdownPaste(state, "# Title\nText", {
      pasteMode: "auto",
      hasHtml: false,
    });
    expect(result).toBe(false);
  });

  it("does not treat plain text as markdown", () => {
    const state = createState(createParagraphDoc(""));
    const result = shouldHandleMarkdownPaste(state, "Just a sentence.", {
      pasteMode: "auto",
      hasHtml: false,
    });
    expect(result).toBe(false);
  });

  it("respects paste mode off", () => {
    const state = createState(createParagraphDoc(""));
    const result = shouldHandleMarkdownPaste(state, "# Title\nText", {
      pasteMode: "off" as PasteMode,
      hasHtml: false,
    });
    expect(result).toBe(false);
  });
});
