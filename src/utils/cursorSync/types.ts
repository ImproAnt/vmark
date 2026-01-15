/**
 * Context around cursor for better matching
 */
export interface CursorContext {
  word: string;
  offsetInWord: number;
  contextBefore: string;
  contextAfter: string;
}
