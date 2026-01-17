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

  it("detects list blocks", () => {
    const text = "- first\n- second";
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

  it("rejects single-line emphasis", () => {
    expect(isMarkdownPasteCandidate("**bold**")).toBe(false);
  });

  it("rejects raw URLs", () => {
    expect(isMarkdownPasteCandidate("https://example.com")).toBe(false);
  });

  it("rejects ordinary single-line text", () => {
    expect(isMarkdownPasteCandidate("Just a sentence with _underscores_.")).toBe(false);
  });

  it("rejects single-line list items without other signals", () => {
    expect(isMarkdownPasteCandidate("- one item")).toBe(false);
  });
});
