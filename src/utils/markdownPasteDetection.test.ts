import { describe, it, expect } from "vitest";
import { isMarkdownPasteCandidate } from "./markdownPasteDetection";

describe("markdownPasteDetection", () => {
  it("detects fenced code blocks", () => {
    const text = "```js\nconst a = 1;\n```";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects headings with body text", () => {
    const text = "# Title\n\nParagraph text.";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects single-line headings", () => {
    const text = "# Title";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects list blocks", () => {
    const text = "- first\n- second";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects single-line list items", () => {
    const text = "- one item";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects markdown tables", () => {
    const text = "| A | B |\n| --- | --- |\n| 1 | 2 |";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects links when combined with other markdown", () => {
    const text = "[Link](https://example.com)\n\nNext line";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects multi-line emphasis without other signals", () => {
    const text = "This is **important**.\nPlease read *carefully*.";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects blockquote markdown when combined with another signal", () => {
    const text = "> # Title\n> Quote line";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("rejects email-style quoted text", () => {
    const text = "On Monday, John wrote:\n> Thanks for your help!\n> Let me know.";
    expect(isMarkdownPasteCandidate(text)).toBe(false);
  });

  it("rejects single-line emphasis", () => {
    expect(isMarkdownPasteCandidate("**bold**")).toBe(false);
  });

  it("rejects raw URLs", () => {
    expect(isMarkdownPasteCandidate("https://example.com")).toBe(false);
  });

  it("rejects ordinary single-line text", () => {
    expect(isMarkdownPasteCandidate("Just a sentence with _underscores_.")).toBe(false);
  });

});
