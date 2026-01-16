import { describe, it, expect } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import {
  getSourceBlockRange,
  getSourceExpandedRange,
  getSourceLineRange,
  getSourceWordRange,
} from "./sourceSelection";

function createState(doc: string, from: number, to = from) {
  return EditorState.create({
    doc,
    selection: EditorSelection.range(from, to),
  });
}

describe("sourceSelection", () => {
  it("finds word range at cursor", () => {
    const state = createState("Hello world", 1);
    const range = getSourceWordRange(state, 1);
    expect(range).toEqual({ from: 0, to: 5 });
  });

  it("finds line range at cursor", () => {
    const doc = "one\ntwo\nthree";
    const state = createState(doc, 5);
    const line = state.doc.line(2);
    const range = getSourceLineRange(state, 5);
    expect(range).toEqual({ from: line.from, to: line.to });
  });

  it("finds block range between blank lines", () => {
    const doc = "one\ntwo\n\nthree\nfour\n\nfive";
    const state = createState(doc, 10);
    const lineThree = state.doc.line(4);
    const lineFour = state.doc.line(5);
    const range = getSourceBlockRange(state, lineThree.from, lineThree.from + 1);
    expect(range).toEqual({ from: lineThree.from, to: lineFour.to });
  });

  it("expands selection from word to line to block to document", () => {
    const doc = "alpha beta\ngamma\n\nomega";
    const wordState = createState(doc, 1);
    const wordRange = getSourceExpandedRange(wordState, 1, 1);
    expect(wordRange).toEqual({ from: 0, to: 5 });

    const lineState = createState(doc, wordRange?.from ?? 0, wordRange?.to ?? 0);
    const lineRange = getSourceExpandedRange(lineState, lineState.selection.main.from, lineState.selection.main.to);
    const expectedLine = lineState.doc.line(1);
    expect(lineRange).toEqual({ from: expectedLine.from, to: expectedLine.to });

    const blockState = createState(doc, lineRange?.from ?? 0, lineRange?.to ?? 0);
    const blockRange = getSourceExpandedRange(blockState, blockState.selection.main.from, blockState.selection.main.to);
    const expectedBlockEnd = blockState.doc.line(2).to;
    expect(blockRange).toEqual({ from: expectedLine.from, to: expectedBlockEnd });

    const docState = createState(doc, blockRange?.from ?? 0, blockRange?.to ?? 0);
    const docRange = getSourceExpandedRange(docState, docState.selection.main.from, docState.selection.main.to);
    expect(docRange).toEqual({ from: 0, to: docState.doc.length });

    const fullState = createState(doc, 0, docState.doc.length);
    const fullRange = getSourceExpandedRange(fullState, 0, fullState.doc.length);
    expect(fullRange).toBeNull();
  });
});
