import { useCallback } from "react";
import { useWindowLabel } from "../contexts/WindowContext";
import { useDocumentStore, type CursorInfo } from "../stores/documentStore";

// Window-scoped selectors
export function useDocumentContent(): string {
  const windowLabel = useWindowLabel();
  return useDocumentStore((state) => state.documents[windowLabel]?.content ?? "");
}

export function useDocumentFilePath(): string | null {
  const windowLabel = useWindowLabel();
  return useDocumentStore((state) => state.documents[windowLabel]?.filePath ?? null);
}

export function useDocumentIsDirty(): boolean {
  const windowLabel = useWindowLabel();
  return useDocumentStore((state) => state.documents[windowLabel]?.isDirty ?? false);
}

export function useDocumentId(): number {
  const windowLabel = useWindowLabel();
  return useDocumentStore((state) => state.documents[windowLabel]?.documentId ?? 0);
}

export function useDocumentCursorInfo(): CursorInfo | null {
  const windowLabel = useWindowLabel();
  return useDocumentStore((state) => state.documents[windowLabel]?.cursorInfo ?? null);
}

export function useDocumentLastAutoSave(): number | null {
  const windowLabel = useWindowLabel();
  return useDocumentStore((state) => state.documents[windowLabel]?.lastAutoSave ?? null);
}

// Window-scoped actions
export function useDocumentActions() {
  const windowLabel = useWindowLabel();

  const setContent = useCallback(
    (content: string) => {
      useDocumentStore.getState().setContent(windowLabel, content);
    },
    [windowLabel]
  );

  const loadContent = useCallback(
    (content: string, filePath?: string | null) => {
      useDocumentStore.getState().loadContent(windowLabel, content, filePath);
    },
    [windowLabel]
  );

  const setFilePath = useCallback(
    (path: string | null) => {
      useDocumentStore.getState().setFilePath(windowLabel, path);
    },
    [windowLabel]
  );

  const markSaved = useCallback(() => {
    useDocumentStore.getState().markSaved(windowLabel);
  }, [windowLabel]);

  const markAutoSaved = useCallback(() => {
    useDocumentStore.getState().markAutoSaved(windowLabel);
  }, [windowLabel]);

  const setCursorInfo = useCallback(
    (info: CursorInfo | null) => {
      useDocumentStore.getState().setCursorInfo(windowLabel, info);
    },
    [windowLabel]
  );

  return {
    setContent,
    loadContent,
    setFilePath,
    markSaved,
    markAutoSaved,
    setCursorInfo,
  };
}
