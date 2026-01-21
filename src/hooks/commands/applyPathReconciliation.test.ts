import { describe, it, expect, beforeEach } from "vitest";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { applyPathReconciliation } from "@/hooks/commands/applyPathReconciliation";

const WINDOW_MAIN = "main";
const WINDOW_DOC = "doc-1";

function resetStores() {
  const tabState = useTabStore.getState();
  tabState.removeWindow(WINDOW_MAIN);
  tabState.removeWindow(WINDOW_DOC);

  const docState = useDocumentStore.getState();
  Object.keys(docState.documents).forEach((id) => {
    docState.removeDocument(id);
  });
}

describe("applyPathReconciliation", () => {
  beforeEach(() => {
    resetStores();
  });

  it("updates all tabs with matching path across windows", () => {
    const oldPath = "/tmp/shared.md";
    const newPath = "/tmp/renamed.md";

    const tabA = useTabStore.getState().createTab(WINDOW_MAIN, oldPath);
    const tabB = useTabStore.getState().createTab(WINDOW_DOC, oldPath);

    useDocumentStore.getState().initDocument(tabA, "a", oldPath);
    useDocumentStore.getState().initDocument(tabB, "b", oldPath);

    applyPathReconciliation([
      { action: "update_path", oldPath, newPath },
    ]);

    const tabAState = useTabStore.getState().getTabsByWindow(WINDOW_MAIN)[0];
    const tabBState = useTabStore.getState().getTabsByWindow(WINDOW_DOC)[0];

    expect(tabAState.filePath).toBe(newPath);
    expect(tabBState.filePath).toBe(newPath);
    expect(useDocumentStore.getState().getDocument(tabA)?.filePath).toBe(newPath);
    expect(useDocumentStore.getState().getDocument(tabB)?.filePath).toBe(newPath);
  });

  it("marks all matching tabs as missing across windows", () => {
    const oldPath = "/tmp/shared.md";

    const tabA = useTabStore.getState().createTab(WINDOW_MAIN, oldPath);
    const tabB = useTabStore.getState().createTab(WINDOW_DOC, oldPath);

    useDocumentStore.getState().initDocument(tabA, "a", oldPath);
    useDocumentStore.getState().initDocument(tabB, "b", oldPath);

    applyPathReconciliation([
      { action: "mark_missing", oldPath },
    ]);

    expect(useDocumentStore.getState().getDocument(tabA)?.isMissing).toBe(true);
    expect(useDocumentStore.getState().getDocument(tabB)?.isMissing).toBe(true);
  });
});
