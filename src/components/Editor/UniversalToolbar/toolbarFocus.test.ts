/**
 * Toolbar Focus - Tests
 *
 * Tests for smart initial focus algorithm per redesign spec Section 4.2.
 */
import { describe, it, expect } from "vitest";
import type { ToolbarGroupButton } from "./toolbarGroups";
import { getInitialFocusIndex, hasAnyEnabledButton } from "./toolbarFocus";
import type { SourceToolbarContext } from "@/plugins/toolbarActions/types";
import type { CursorContext } from "@/types/cursorContext";

function makeButton(action: string, itemAction: string): ToolbarGroupButton {
  return {
    id: action,
    type: "dropdown",
    icon: "",
    label: action,
    action,
    enabledIn: ["always"],
    items: [
      {
        id: `${itemAction}-item`,
        icon: "",
        label: itemAction,
        action: itemAction,
        enabledIn: ["always"],
      },
    ],
  };
}

const buttons = [
  makeButton("inline", "bold"),
  makeButton("block", "heading:1"),
  makeButton("table", "addRow"),
  makeButton("insert", "insertTable"),
];

function makeState(disabled = false, active = false) {
  return { disabled, notImplemented: false, active };
}

function makeContext(overrides: Partial<CursorContext> = {}): SourceToolbarContext {
  return {
    surface: "source",
    view: null,
    context: {
      inCodeBlock: null,
      inBlockMath: null,
      inTable: null,
      inList: null,
      inBlockquote: null,
      inHeading: null,
      inLink: null,
      inImage: null,
      inInlineMath: null,
      inFootnote: null,
      activeFormats: [],
      formatRanges: [],
      innermostFormat: null,
      atLineStart: false,
      atBlankLine: false,
      inWord: null,
      contextMode: "inline-insert",
      nearSpace: false,
      nearPunctuation: false,
      hasSelection: false,
      selectionFrom: 0,
      selectionTo: 0,
      ...overrides,
    },
  };
}

describe("getInitialFocusIndex", () => {
  describe("Step 1: Active format marks", () => {
    it("focuses bold button when bold is active", () => {
      // Bold is active - should focus inline group (index 0)
      const states = [makeState(false, true), makeState(), makeState(), makeState()];
      const context = makeContext();

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(0);
    });

    it("skips disabled active buttons and falls back to first enabled", () => {
      // Inline group is disabled but active - skipped because disabled
      // Falls through to Step 4 (default bold) which is also disabled
      // Falls through to Step 5 (first enabled) which is index 1 (block)
      const states = [makeState(true, true), makeState(), makeState(), makeState()];
      const context = makeContext();

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(1);
    });
  });

  describe("Step 2: Has selection", () => {
    it("focuses inline group when has selection", () => {
      const states = [makeState(), makeState(), makeState(), makeState()];
      const context = makeContext({ hasSelection: true });

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(0);
    });
  });

  describe("Step 3: Context-aware", () => {
    it("focuses table button when in table", () => {
      const states = [makeState(), makeState(), makeState(), makeState()];
      const context = makeContext({
        inTable: { row: 0, col: 0, isHeader: false, nodePos: 0 },
      });

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(2);
    });

    it("focuses block button when in heading", () => {
      const states = [makeState(), makeState(), makeState(), makeState()];
      const context = makeContext({
        inHeading: { level: 2, nodePos: 0 },
      });

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(1);
    });

    it("ignores context when has selection", () => {
      // In table but also has selection - selection wins
      const states = [makeState(), makeState(), makeState(), makeState()];
      const context = makeContext({
        hasSelection: true,
        inTable: { row: 0, col: 0, isHeader: false, nodePos: 0 },
      });

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(0);
    });
  });

  describe("Step 4-5: Defaults and fallback", () => {
    it("defaults to inline group (bold)", () => {
      const states = [makeState(), makeState(), makeState(), makeState()];
      const context = makeContext();

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(0);
    });

    it("falls back to first enabled when default disabled", () => {
      // Inline disabled, block enabled
      const states = [makeState(true), makeState(), makeState(), makeState()];
      const context = makeContext();

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(1);
    });
  });

  describe("Step 6: No enabled buttons", () => {
    it("returns -1 when all buttons disabled", () => {
      const states = [makeState(true), makeState(true), makeState(true), makeState(true)];
      const context = makeContext();

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(-1);
    });
  });
});

describe("hasAnyEnabledButton", () => {
  it("returns true when some buttons enabled", () => {
    const states = [makeState(true), makeState(), makeState(true), makeState()];
    expect(hasAnyEnabledButton(states)).toBe(true);
  });

  it("returns false when all buttons disabled", () => {
    const states = [makeState(true), makeState(true), makeState(true), makeState(true)];
    expect(hasAnyEnabledButton(states)).toBe(false);
  });

  it("returns true for empty list (edge case)", () => {
    expect(hasAnyEnabledButton([])).toBe(false);
  });
});
