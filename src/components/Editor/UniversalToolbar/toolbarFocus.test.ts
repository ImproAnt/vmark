/**
 * Toolbar Focus - Tests
 *
 * Tests for smart initial focus algorithm per redesign spec Section 4.2.
 *
 * Priority order:
 * 1. Active format marks (bold > italic > underline > strikethrough > code > link)
 * 2. Has selection → inline group
 * 3. Context-aware (inHeading, inList, inTable, etc.)
 * 4. Default to inline group
 * 5. First enabled button
 * 6. null (don't open toolbar)
 */
import { describe, it, expect } from "vitest";
import type { ToolbarGroupButton } from "./toolbarGroups";
import { getInitialFocusIndex, hasAnyEnabledButton } from "./toolbarFocus";
import type { SourceToolbarContext } from "@/plugins/toolbarActions/types";
import type { CursorContext } from "@/types/cursorContext";

// Helper to create a toolbar button with multiple items
function makeButtonWithItems(
  id: string,
  items: Array<{ action: string; id?: string }>
): ToolbarGroupButton {
  return {
    id,
    type: "dropdown",
    icon: "",
    label: id,
    action: id,
    enabledIn: ["always"],
    items: items.map((item) => ({
      id: item.id ?? item.action,
      icon: "",
      label: item.action,
      action: item.action,
      enabledIn: ["always"],
    })),
  };
}

// Create buttons that match the real toolbar layout
const buttons: ToolbarGroupButton[] = [
  // index 0: block group (heading:1, heading:2, etc.)
  makeButtonWithItems("block", [
    { action: "heading:0" },
    { action: "heading:1" },
    { action: "heading:2" },
  ]),
  // index 1: inline group (bold, italic, underline, strikethrough, code)
  makeButtonWithItems("inline", [
    { action: "bold" },
    { action: "italic" },
    { action: "underline" },
    { action: "strikethrough" },
    { action: "code" },
  ]),
  // index 2: list group (bulletList, orderedList, taskList)
  makeButtonWithItems("list", [
    { action: "bulletList" },
    { action: "orderedList" },
    { action: "taskList" },
  ]),
  // index 3: table group (addRow, addCol, etc.)
  makeButtonWithItems("table", [{ action: "addRow" }, { action: "addCol" }]),
  // index 4: blockquote group
  makeButtonWithItems("blockquote", [{ action: "unnestQuote" }]),
  // index 5: insert group (insertCodeBlock, insertTable, etc.)
  makeButtonWithItems("insert", [
    { action: "insertCodeBlock" },
    { action: "insertTable" },
  ]),
  // index 6: expandables group
  makeButtonWithItems("expandables", [{ action: "insertDetails" }]),
  // index 7: link group
  makeButtonWithItems("link", [{ action: "link" }]),
];

interface ItemState {
  disabled: boolean;
  notImplemented: boolean;
  active: boolean;
}

interface ButtonState extends ItemState {
  itemStates?: ItemState[];
}

function makeState(disabled = false, active = false): ButtonState {
  return { disabled, notImplemented: false, active };
}

function makeStateWithItems(
  disabled: boolean,
  itemActiveFlags: boolean[]
): ButtonState {
  return {
    disabled,
    notImplemented: false,
    active: itemActiveFlags.some(Boolean), // Group is active if any item is active
    itemStates: itemActiveFlags.map((active) => ({
      disabled: false,
      notImplemented: false,
      active,
    })),
  };
}

function makeContext(
  overrides: Partial<CursorContext> = {}
): SourceToolbarContext {
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

function allEnabled(): ButtonState[] {
  return buttons.map(() => makeState(false, false));
}

describe("getInitialFocusIndex", () => {
  describe("Step 1: Active format marks with priority", () => {
    it("focuses inline button when bold is active", () => {
      // Bold is at index 0 in inline group (index 1)
      const states = allEnabled();
      states[1] = makeStateWithItems(false, [true, false, false, false, false]); // bold active

      expect(getInitialFocusIndex({ buttons, states, context: makeContext() })).toBe(1);
    });

    it("focuses inline button when italic is active", () => {
      const states = allEnabled();
      states[1] = makeStateWithItems(false, [false, true, false, false, false]); // italic active

      expect(getInitialFocusIndex({ buttons, states, context: makeContext() })).toBe(1);
    });

    it("bold wins over italic when both are active (priority order)", () => {
      // Per spec Section 4.3: bold > italic in priority list
      const states = allEnabled();
      // Both bold and italic are active
      states[1] = makeStateWithItems(false, [true, true, false, false, false]);

      // Should focus inline group (index 1) because bold is first in priority
      expect(getInitialFocusIndex({ buttons, states, context: makeContext() })).toBe(1);
    });

    it("italic wins over underline when both are active", () => {
      const states = allEnabled();
      states[1] = makeStateWithItems(false, [false, true, true, false, false]); // italic + underline

      // Both are in same button group, so focuses inline (index 1)
      expect(getInitialFocusIndex({ buttons, states, context: makeContext() })).toBe(1);
    });

    it("checks specific mark state, not just group aggregate", () => {
      // Group shows as active (because strikethrough is active)
      // but bold is NOT active - should NOT trigger bold priority
      const states = allEnabled();
      // strikethrough active (index 3), but bold (index 0) is not
      states[1] = makeStateWithItems(false, [false, false, false, true, false]);

      // Should focus inline because strikethrough is in the mark priority list
      expect(getInitialFocusIndex({ buttons, states, context: makeContext() })).toBe(1);
    });

    it("link wins when only link is active", () => {
      const states = allEnabled();
      states[7] = makeStateWithItems(false, [true]); // link active

      expect(getInitialFocusIndex({ buttons, states, context: makeContext() })).toBe(7);
    });

    it("code wins over link when both are active (priority order)", () => {
      // code appears before link in priority list
      const states = allEnabled();
      states[1] = makeStateWithItems(false, [false, false, false, false, true]); // code active
      states[7] = makeStateWithItems(false, [true]); // link active

      // Code is before link in priority, so inline group (code) wins
      expect(getInitialFocusIndex({ buttons, states, context: makeContext() })).toBe(1);
    });

    it("skips disabled active buttons and checks next priority", () => {
      const states = allEnabled();
      // Bold active but inline group disabled
      states[1] = makeStateWithItems(true, [true, false, false, false, false]);
      // Link also active
      states[7] = makeStateWithItems(false, [true]);

      // Skips bold (disabled), falls to link
      expect(getInitialFocusIndex({ buttons, states, context: makeContext() })).toBe(7);
    });
  });

  describe("Step 2: Has selection → inline group", () => {
    it("focuses inline group when has selection (no active marks)", () => {
      const states = allEnabled();
      const context = makeContext({ hasSelection: true });

      // inline group is at index 1
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(1);
    });

    it("active marks beat selection context", () => {
      const states = allEnabled();
      // Link is active
      states[7] = makeStateWithItems(false, [true]);
      const context = makeContext({ hasSelection: true });

      // Link (active mark) wins over selection default
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(7);
    });

    it("falls back to first enabled if inline disabled with selection", () => {
      const states = allEnabled();
      states[1].disabled = true; // inline disabled
      const context = makeContext({ hasSelection: true });

      // Falls through to Step 4 (default to inline) which is disabled
      // Then Step 5: first enabled (block at index 0)
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(0);
    });
  });

  describe("Step 3: Context-aware (only without selection)", () => {
    it("focuses block group when in heading", () => {
      const states = allEnabled();
      const context = makeContext({
        inHeading: { level: 2, nodePos: 0 },
      });

      // block group at index 0
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(0);
    });

    it("focuses list group when in bullet list", () => {
      const states = allEnabled();
      const context = makeContext({
        inList: { type: "bullet", depth: 0, nodePos: 0 },
      });

      // list group at index 2
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(2);
    });

    it("focuses list group when in ordered list", () => {
      const states = allEnabled();
      const context = makeContext({
        inList: { type: "ordered", depth: 0, nodePos: 0 },
      });

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(2);
    });

    it("focuses table group when in table", () => {
      const states = allEnabled();
      const context = makeContext({
        inTable: { row: 0, col: 0, isHeader: false, nodePos: 0 },
      });

      // table group at index 3
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(3);
    });

    it("focuses blockquote group when in blockquote", () => {
      const states = allEnabled();
      const context = makeContext({
        inBlockquote: { depth: 1, nodePos: 0 },
      });

      // blockquote group at index 4
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(4);
    });

    it("focuses insert group when in code block", () => {
      const states = allEnabled();
      const context = makeContext({
        inCodeBlock: { language: "javascript", nodePos: 0 },
      });

      // insert group at index 5
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(5);
    });

    it("focuses link group when cursor is in link", () => {
      const states = allEnabled();
      const context = makeContext({
        inLink: { href: "https://example.com", text: "example", from: 0, to: 10, contentFrom: 1, contentTo: 8 },
      });

      // link group at index 7
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(7);
    });

    it("ignores context when has selection (selection beats context)", () => {
      // Per spec Section 4.3: "In table with text selected → inline group"
      const states = allEnabled();
      const context = makeContext({
        hasSelection: true,
        inTable: { row: 0, col: 0, isHeader: false, nodePos: 0 },
      });

      // Selection → inline group (index 1), not table group
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(1);
    });

    it("bold text inside link → bold wins (marks beat context)", () => {
      // Per spec Section 4.3: "Bold in link → bold wins"
      const states = allEnabled();
      states[1] = makeStateWithItems(false, [true, false, false, false, false]); // bold active
      const context = makeContext({
        inLink: { href: "https://example.com", text: "bold link", from: 0, to: 10, contentFrom: 1, contentTo: 9 },
      });

      // Bold (active mark) beats inLink context
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(1);
    });

    it("heading context priority: inHeading checked before inList", () => {
      const states = allEnabled();
      const context = makeContext({
        inHeading: { level: 2, nodePos: 0 },
        inList: { type: "bullet", depth: 0, nodePos: 0 },
      });

      // Heading is checked first in context order
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(0);
    });
  });

  describe("Step 4-5: Defaults and fallback", () => {
    it("defaults to inline group (bold button)", () => {
      const states = allEnabled();
      const context = makeContext();

      // inline group at index 1
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(1);
    });

    it("falls back to first enabled when inline disabled", () => {
      const states = allEnabled();
      states[1].disabled = true; // inline disabled
      const context = makeContext();

      // block group at index 0 is first enabled
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(0);
    });

    it("finds first enabled skipping multiple disabled", () => {
      const states = allEnabled();
      states[0].disabled = true; // block disabled
      states[1].disabled = true; // inline disabled
      const context = makeContext();

      // list group at index 2 is first enabled
      expect(getInitialFocusIndex({ buttons, states, context })).toBe(2);
    });
  });

  describe("Step 6: No enabled buttons", () => {
    it("returns -1 when all buttons disabled", () => {
      const states = buttons.map(() => makeState(true, false));
      const context = makeContext();

      expect(getInitialFocusIndex({ buttons, states, context })).toBe(-1);
    });

    it("returns -1 when buttons array is empty", () => {
      expect(
        getInitialFocusIndex({ buttons: [], states: [], context: makeContext() })
      ).toBe(-1);
    });
  });

  describe("Edge cases", () => {
    it("handles button without itemStates (fallback to group active)", () => {
      const states = allEnabled();
      // Set group as active without itemStates
      states[1] = { disabled: false, notImplemented: false, active: true };

      // Should still focus inline since group is active (fallback behavior)
      expect(getInitialFocusIndex({ buttons, states, context: makeContext() })).toBe(1);
    });

    it("handles mismatched itemStates length gracefully", () => {
      const states = allEnabled();
      // itemStates shorter than items array
      states[1] = {
        disabled: false,
        notImplemented: false,
        active: true,
        itemStates: [{ disabled: false, notImplemented: false, active: false }],
      };

      // Bold is at index 0 in items, itemStates[0] is false
      // Falls through to default inline group
      expect(getInitialFocusIndex({ buttons, states, context: makeContext() })).toBe(1);
    });
  });
});

describe("hasAnyEnabledButton", () => {
  it("returns true when some buttons enabled", () => {
    const states = [makeState(true), makeState(false), makeState(true)];
    expect(hasAnyEnabledButton(states)).toBe(true);
  });

  it("returns false when all buttons disabled", () => {
    const states = [makeState(true), makeState(true), makeState(true)];
    expect(hasAnyEnabledButton(states)).toBe(false);
  });

  it("returns true when first button enabled", () => {
    const states = [makeState(false), makeState(true), makeState(true)];
    expect(hasAnyEnabledButton(states)).toBe(true);
  });

  it("returns true when last button enabled", () => {
    const states = [makeState(true), makeState(true), makeState(false)];
    expect(hasAnyEnabledButton(states)).toBe(true);
  });

  it("returns false for empty list", () => {
    expect(hasAnyEnabledButton([])).toBe(false);
  });
});
