import { create } from "zustand";

// Node types for cursor sync
export type NodeType =
  | "paragraph"
  | "heading"
  | "list_item"
  | "code_block"
  | "table_cell"
  | "blockquote";

// Cursor position info for syncing between editors
export interface CursorInfo {
  contentLineIndex: number;
  wordAtCursor: string;
  offsetInWord: number;
  nodeType: NodeType;
  percentInLine: number;
  contextBefore: string;
  contextAfter: string;
}

// Per-window document state
export interface DocumentState {
  content: string;
  savedContent: string;
  filePath: string | null;
  isDirty: boolean;
  documentId: number;
  cursorInfo: CursorInfo | null;
  lastAutoSave: number | null;
}

interface DocumentStore {
  // Documents keyed by window label
  documents: Record<string, DocumentState>;

  // Actions
  initDocument: (windowLabel: string, content?: string, filePath?: string | null) => void;
  setContent: (windowLabel: string, content: string) => void;
  loadContent: (windowLabel: string, content: string, filePath?: string | null) => void;
  setFilePath: (windowLabel: string, path: string | null) => void;
  markSaved: (windowLabel: string) => void;
  markAutoSaved: (windowLabel: string) => void;
  setCursorInfo: (windowLabel: string, info: CursorInfo | null) => void;
  removeDocument: (windowLabel: string) => void;

  // Selectors
  getDocument: (windowLabel: string) => DocumentState | undefined;
  getAllDirtyWindows: () => string[];
}

const createInitialDocument = (content = "", filePath: string | null = null): DocumentState => ({
  content,
  savedContent: content,
  filePath,
  isDirty: false,
  documentId: 0,
  cursorInfo: null,
  lastAutoSave: null,
});

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: {},

  initDocument: (windowLabel, content = "", filePath = null) =>
    set((state) => ({
      documents: {
        ...state.documents,
        [windowLabel]: createInitialDocument(content, filePath),
      },
    })),

  setContent: (windowLabel, content) =>
    set((state) => {
      const doc = state.documents[windowLabel];
      if (!doc) return state;
      return {
        documents: {
          ...state.documents,
          [windowLabel]: {
            ...doc,
            content,
            isDirty: doc.savedContent !== content,
          },
        },
      };
    }),

  loadContent: (windowLabel, content, filePath) =>
    set((state) => {
      const doc = state.documents[windowLabel];
      if (!doc) return state;
      return {
        documents: {
          ...state.documents,
          [windowLabel]: {
            ...doc,
            content,
            savedContent: content,
            filePath: filePath ?? null,
            isDirty: false,
            documentId: doc.documentId + 1,
          },
        },
      };
    }),

  setFilePath: (windowLabel, path) =>
    set((state) => {
      const doc = state.documents[windowLabel];
      if (!doc) return state;
      return {
        documents: {
          ...state.documents,
          [windowLabel]: { ...doc, filePath: path },
        },
      };
    }),

  markSaved: (windowLabel) =>
    set((state) => {
      const doc = state.documents[windowLabel];
      if (!doc) return state;
      return {
        documents: {
          ...state.documents,
          [windowLabel]: {
            ...doc,
            savedContent: doc.content,
            isDirty: false,
          },
        },
      };
    }),

  markAutoSaved: (windowLabel) =>
    set((state) => {
      const doc = state.documents[windowLabel];
      if (!doc) return state;
      return {
        documents: {
          ...state.documents,
          [windowLabel]: {
            ...doc,
            savedContent: doc.content,
            isDirty: false,
            lastAutoSave: Date.now(),
          },
        },
      };
    }),

  setCursorInfo: (windowLabel, info) =>
    set((state) => {
      const doc = state.documents[windowLabel];
      if (!doc) return state;
      return {
        documents: {
          ...state.documents,
          [windowLabel]: { ...doc, cursorInfo: info },
        },
      };
    }),

  removeDocument: (windowLabel) =>
    set((state) => {
      const { [windowLabel]: _, ...rest } = state.documents;
      return { documents: rest };
    }),

  getDocument: (windowLabel) => get().documents[windowLabel],

  getAllDirtyWindows: () => {
    const { documents } = get();
    return Object.entries(documents)
      .filter(([_, doc]) => doc.isDirty)
      .map(([label]) => label);
  },
}));
