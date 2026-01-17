export type LineEnding = "lf" | "crlf" | "unknown";
export type HardBreakStyle = "backslash" | "twoSpaces" | "mixed" | "unknown";
export type LineEndingOnSave = "preserve" | "lf" | "crlf";
export type HardBreakStyleOnSave = "preserve" | "backslash" | "twoSpaces";

export interface LinebreakDetectionResult {
  lineEnding: LineEnding;
  hardBreakStyle: HardBreakStyle;
}

function detectLineEnding(text: string): LineEnding {
  if (text.includes("\r\n")) return "crlf";
  if (text.includes("\r")) return "crlf";
  if (text.includes("\n")) return "lf";
  return "unknown";
}

function isFenceLine(line: string): { fenceChar: "`" | "~"; fenceLength: number } | null {
  const match = line.match(/^\s*([`~]{3,})/);
  if (!match) return null;
  const fence = match[1];
  const fenceChar = fence[0] as "`" | "~";
  return { fenceChar, fenceLength: fence.length };
}

function detectHardBreakStyle(text: string): HardBreakStyle {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const hasFinalNewline = normalized.endsWith("\n");
  const lastIndex = hasFinalNewline ? lines.length - 1 : lines.length;

  let backslashCount = 0;
  let twoSpaceCount = 0;
  let inFence = false;
  let fenceChar: "`" | "~" | null = null;
  let fenceLength = 0;

  for (let i = 0; i < lastIndex; i += 1) {
    const line = lines[i] ?? "";
    const fence = isFenceLine(line);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceChar = fence.fenceChar;
        fenceLength = fence.fenceLength;
      } else if (fence.fenceChar === fenceChar && fence.fenceLength >= fenceLength) {
        inFence = false;
        fenceChar = null;
        fenceLength = 0;
      }
      continue;
    }

    if (inFence) continue;

    const trimmedEnd = line.replace(/[ \t]+$/, "");
    if (trimmedEnd.endsWith("\\")) {
      backslashCount += 1;
      continue;
    }

    const trailingMatch = line.match(/ +$/);
    if (trailingMatch && trailingMatch[0].length >= 2) {
      const before = line.slice(0, -trailingMatch[0].length);
      if (before.trim().length > 0) {
        twoSpaceCount += 1;
      }
    }
  }

  if (backslashCount > 0 && twoSpaceCount > 0) return "mixed";
  if (backslashCount > 0) return "backslash";
  if (twoSpaceCount > 0) return "twoSpaces";
  return "unknown";
}

export function detectLinebreaks(text: string): LinebreakDetectionResult {
  return {
    lineEnding: detectLineEnding(text),
    hardBreakStyle: detectHardBreakStyle(text),
  };
}
