/**
 * Toolbar Groups - Tests
 *
 * TDD tests for button group definitions (WI-002).
 */
import { describe, it, expect } from "vitest";
import { TOOLBAR_GROUPS } from "./toolbarGroups";

describe("toolbarGroups", () => {
  describe("structure", () => {
    it("defines groups in spec order", () => {
      const groupIds = TOOLBAR_GROUPS.map((g) => g.id);
      expect(groupIds).toEqual([
        "block",
        "inline",
        "list",
        "table",
        "blockquote",
        "insert",
        "expandables",
        "link",
      ]);
    });

    it("each group has required properties", () => {
      for (const group of TOOLBAR_GROUPS) {
        expect(group.id).toBeDefined();
        expect(group.label).toBeDefined();
        expect(Array.isArray(group.items)).toBe(true);
        expect(group.items.length).toBeGreaterThan(0);
      }
    });

    it("each item has required properties", () => {
      for (const group of TOOLBAR_GROUPS) {
        for (const item of group.items) {
          expect(item.id).toBeDefined();
          expect(item.icon).toBeDefined();
          expect(item.label).toBeDefined();
          expect(item.action).toBeDefined();
        }
      }
    });
  });

  describe("block group", () => {
    it("contains heading items", () => {
      const block = TOOLBAR_GROUPS.find((g) => g.id === "block");
      expect(block).toBeDefined();
      const headingItems = block!.items.map((item) => item.id);
      expect(headingItems).toContain("paragraph");
      expect(headingItems).toContain("h1");
    });
  });

  describe("inline group", () => {
    it("contains all format items", () => {
      const inline = TOOLBAR_GROUPS.find((g) => g.id === "inline");
      expect(inline).toBeDefined();

      const itemIds = inline!.items.map((item) => item.id);

      expect(itemIds).toContain("bold");
      expect(itemIds).toContain("italic");
      expect(itemIds).toContain("underline");
      expect(itemIds).toContain("strikethrough");
      expect(itemIds).toContain("highlight");
      expect(itemIds).toContain("superscript");
      expect(itemIds).toContain("subscript");
      expect(itemIds).toContain("code");
      expect(itemIds).toContain("clear-formatting");
    });
  });

  describe("list group", () => {
    it("contains bullet, ordered, task, indent, outdent, remove", () => {
      const list = TOOLBAR_GROUPS.find((g) => g.id === "list");
      expect(list).toBeDefined();

      const itemIds = list!.items.map((item) => item.id);

      expect(itemIds).toContain("bullet-list");
      expect(itemIds).toContain("ordered-list");
      expect(itemIds).toContain("task-list");
      expect(itemIds).toContain("indent");
      expect(itemIds).toContain("outdent");
      expect(itemIds).toContain("remove-list");
    });
  });

  describe("table group", () => {
    it("contains table operations", () => {
      const table = TOOLBAR_GROUPS.find((g) => g.id === "table");
      expect(table).toBeDefined();

      const itemIds = table!.items.map((item) => item.id);

      expect(itemIds).toContain("insert-table");
      expect(itemIds).toContain("add-row");
      expect(itemIds).toContain("add-col");
    });
  });

  describe("button enabled state", () => {
    it("buttons have enabledIn property for context", () => {
      // All buttons should have enabledIn to define when they're active
      for (const group of TOOLBAR_GROUPS) {
        for (const item of group.items) {
          expect(item.enabledIn).toBeDefined();
        }
      }
    });
  });
});
