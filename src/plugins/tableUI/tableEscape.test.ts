/**
 * Tests for Table Escape functionality
 *
 * ArrowUp at first row of first-block table → insert paragraph before
 * ArrowDown at last row of last-block table → insert paragraph after
 */

import { describe, it, expect } from "vitest";
import { isTableFirstBlock, isTableLastBlock } from "./tableEscape";

describe("isTableFirstBlock", () => {
  it("returns true when tablePos is 0", () => {
    expect(isTableFirstBlock(0)).toBe(true);
  });

  it("returns false when tablePos is greater than 0", () => {
    expect(isTableFirstBlock(10)).toBe(false);
    expect(isTableFirstBlock(1)).toBe(false);
  });
});

describe("isTableLastBlock", () => {
  it("returns true when table ends at document end", () => {
    // Table at pos 0 with nodeSize 50, doc size 50
    expect(isTableLastBlock(0, 50, 50)).toBe(true);
  });

  it("returns false when there is content after table", () => {
    // Table at pos 0 with nodeSize 50, doc size 100
    expect(isTableLastBlock(0, 50, 100)).toBe(false);
  });

  it("handles table not at start", () => {
    // Table at pos 20 with nodeSize 30, doc size 50 (ends at 50)
    expect(isTableLastBlock(20, 30, 50)).toBe(true);
    // Table at pos 20 with nodeSize 30, doc size 60 (ends at 50, doc is 60)
    expect(isTableLastBlock(20, 30, 60)).toBe(false);
  });
});
