import { describe, expect, it } from "vitest";
import { removeTrailingSpaces } from "./rules";

describe("cjkFormatter removeTrailingSpaces", () => {
  it("removes trailing spaces by default", () => {
    const input = "keep  \ntrim \n";
    expect(removeTrailingSpaces(input)).toBe("keep\ntrim\n");
  });

  it("preserves two-space hard breaks when configured", () => {
    const input = "keep  \ntrim \n    \n";
    const output = removeTrailingSpaces(input, { preserveTwoSpaceHardBreaks: true });
    expect(output).toBe("keep  \ntrim\n\n");
  });
});
