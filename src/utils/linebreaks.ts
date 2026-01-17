import type {
  HardBreakStyle,
  HardBreakStyleOnSave,
  LineEnding,
  LineEndingOnSave,
} from "@/utils/linebreakDetection";

export function resolveHardBreakStyle(
  docStyle: HardBreakStyle,
  preference: HardBreakStyleOnSave
): "backslash" | "twoSpaces" {
  if (preference === "backslash") return "backslash";
  if (preference === "twoSpaces") return "twoSpaces";
  if (docStyle === "twoSpaces") return "twoSpaces";
  return "backslash";
}

export function resolveLineEndingOnSave(
  docLineEnding: LineEnding,
  preference: LineEndingOnSave
): "lf" | "crlf" {
  if (preference === "lf") return "lf";
  if (preference === "crlf") return "crlf";
  return docLineEnding === "crlf" ? "crlf" : "lf";
}

export function normalizeLineEndings(text: string, target: "lf" | "crlf"): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (target === "crlf") {
    return normalized.replace(/\n/g, "\r\n");
  }
  return normalized;
}
