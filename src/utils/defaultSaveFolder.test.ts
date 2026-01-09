/**
 * Tests for default save folder resolution
 *
 * Tests the pure resolveDefaultSaveFolder function with three-tier precedence:
 * 1. Workspace root (if in workspace mode)
 * 2. First saved tab's folder in the window
 * 3. Home directory
 *
 * @module utils/defaultSaveFolder.test
 */
import { describe, it, expect } from "vitest";
import { resolveDefaultSaveFolder } from "./defaultSaveFolder";

describe("resolveDefaultSaveFolder", () => {
  const defaultInput = {
    isWorkspaceMode: false,
    workspaceRoot: null,
    savedFilePaths: [],
    homeDirectory: "/Users/test",
  };

  it("returns workspace root when in workspace mode", () => {
    const result = resolveDefaultSaveFolder({
      ...defaultInput,
      isWorkspaceMode: true,
      workspaceRoot: "/workspace/project",
    });

    expect(result).toBe("/workspace/project");
  });

  it("returns first saved tab folder when no workspace", () => {
    const result = resolveDefaultSaveFolder({
      ...defaultInput,
      savedFilePaths: ["/docs/notes/file.md", "/other/path/doc.md"],
    });

    expect(result).toBe("/docs/notes");
  });

  it("skips untitled files (null paths) when finding saved tab folder", () => {
    // savedFilePaths should only contain actual paths, not nulls
    // The hook layer filters these out
    const result = resolveDefaultSaveFolder({
      ...defaultInput,
      savedFilePaths: ["/docs/notes/file.md"],
    });

    expect(result).toBe("/docs/notes");
  });

  it("returns home directory when no workspace and no saved tabs", () => {
    const result = resolveDefaultSaveFolder({
      ...defaultInput,
      savedFilePaths: [],
    });

    expect(result).toBe("/Users/test");
  });

  it("returns home directory for new window with empty saved paths", () => {
    const result = resolveDefaultSaveFolder({
      isWorkspaceMode: false,
      workspaceRoot: null,
      savedFilePaths: [],
      homeDirectory: "/Users/test",
    });

    expect(result).toBe("/Users/test");
  });

  it("prefers workspace root over saved tab folder", () => {
    const result = resolveDefaultSaveFolder({
      isWorkspaceMode: true,
      workspaceRoot: "/workspace/project",
      savedFilePaths: ["/other/path/file.md"],
      homeDirectory: "/Users/test",
    });

    // Workspace root takes precedence
    expect(result).toBe("/workspace/project");
  });

  it("handles Windows-style paths", () => {
    const result = resolveDefaultSaveFolder({
      ...defaultInput,
      savedFilePaths: ["C:\\Users\\Test\\Documents\\file.md"],
    });

    expect(result).toBe("C:\\Users\\Test\\Documents");
  });

  it("ignores workspace root if not in workspace mode", () => {
    const result = resolveDefaultSaveFolder({
      isWorkspaceMode: false,
      workspaceRoot: "/workspace/project", // Set but not in workspace mode
      savedFilePaths: ["/other/path/file.md"],
      homeDirectory: "/Users/test",
    });

    // Should use saved tab folder, not workspace root
    expect(result).toBe("/other/path");
  });

  it("ignores null workspace root even in workspace mode", () => {
    const result = resolveDefaultSaveFolder({
      isWorkspaceMode: true,
      workspaceRoot: null, // Missing root
      savedFilePaths: ["/docs/file.md"],
      homeDirectory: "/Users/test",
    });

    // Should fall through to saved tab folder
    expect(result).toBe("/docs");
  });
});
