import { describe, it, expect, afterEach } from "vitest";
import { useShortcutsStore } from "@/stores/shortcutsStore";
import { buildSourceShortcutKeymap } from "./sourceShortcuts";

function resetShortcuts() {
  useShortcutsStore.setState({ customBindings: {} });
}

afterEach(resetShortcuts);

describe("buildSourceShortcutKeymap", () => {
  it("uses custom shortcut bindings from the store", () => {
    useShortcutsStore.setState({ customBindings: { italic: "Alt-i" } });
    const keys = buildSourceShortcutKeymap().map((binding) => binding.key);

    expect(keys).toContain("Alt-i");
    expect(keys).not.toContain("Mod-i");
  });
});
