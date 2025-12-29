/**
 * Typewriter Mode Plugin
 *
 * Keeps the cursor vertically centered on screen as you type.
 * The page scrolls to keep your writing position at a comfortable eye level.
 *
 * Edge cases handled:
 * - Skip initial load (first few updates)
 * - Use requestAnimationFrame to batch scroll updates
 * - Only scroll if cursor is significantly off-center
 * - Cancel pending scrolls on rapid cursor movement
 */

import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { useEditorStore } from "@/stores/editorStore";

const typewriterPluginKey = new PluginKey("typewriterMode");

// Threshold for scrolling (pixels from target position)
const SCROLL_THRESHOLD = 30;
// Number of initial updates to skip (avoid jarring scroll on load)
const SKIP_INITIAL_UPDATES = 3;

export const typewriterModePlugin = $prose(() => {
  let updateCount = 0;
  let rafId: number | null = null;

  return new Plugin({
    key: typewriterPluginKey,
    view: () => ({
      update: (view, prevState) => {
        const typewriterEnabled =
          useEditorStore.getState().typewriterModeEnabled;
        if (!typewriterEnabled) return;

        // Only scroll if selection changed
        if (view.state.selection.eq(prevState.selection)) return;

        // Skip initial updates to avoid jarring scroll on load
        updateCount++;
        if (updateCount <= SKIP_INITIAL_UPDATES) return;

        // Cancel any pending scroll to handle rapid cursor movement
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }

        // Use requestAnimationFrame to batch scroll updates
        rafId = requestAnimationFrame(() => {
          rafId = null;

          try {
            // Get cursor position in viewport coordinates
            const { from } = view.state.selection;
            const coords = view.coordsAtPos(from);

            // Find the scrollable container
            const scrollContainer =
              view.dom.closest(".editor-content") || view.dom.parentElement;
            if (!scrollContainer) return;

            // Get container dimensions
            const containerRect = scrollContainer.getBoundingClientRect();
            const containerHeight = containerRect.height;

            // Target: keep cursor at 40% from top (comfortable reading position)
            const targetY = containerRect.top + containerHeight * 0.4;

            // Calculate how much to scroll
            const scrollOffset = coords.top - targetY;

            // Only scroll if the offset is significant (avoid jitter)
            if (Math.abs(scrollOffset) > SCROLL_THRESHOLD) {
              scrollContainer.scrollBy({
                top: scrollOffset,
                behavior: "smooth",
              });
            }
          } catch {
            // coordsAtPos can throw if position is invalid
          }
        });
      },
      destroy: () => {
        // Clean up pending animation frame
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      },
    }),
  });
});
