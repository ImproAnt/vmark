import { vi } from "vitest";

export default vi.fn(() => ({
  pan: vi.fn(),
  zoom: vi.fn(),
  reset: vi.fn(),
  getScale: vi.fn(() => 1),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}));

export type PanzoomObject = ReturnType<typeof import("@panzoom/panzoom").default>;
