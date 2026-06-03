import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRef } from "react";
import { useSlideStore } from "../stores/slideStore";
import { useEditorStore } from "../stores/editorStore";

// Mock the fabric canvas module so loadFromJSON / createCanvas are spies
const loadFromJSONSpy = vi.fn((_canvas?: unknown, _json?: unknown) => Promise.resolve());
const fakeCanvas = {
  on: vi.fn(),
  off: vi.fn(),
  dispose: vi.fn(),
  renderAll: vi.fn(),
  setZoom: vi.fn(),
  setWidth: vi.fn(),
  setHeight: vi.fn(),
  getWidth: () => 1280,
  getHeight: () => 720,
  toJSON: () => ({ version: "6.0.0", objects: [] }),
};

vi.mock("@lib/fabric/canvas", () => ({
  createCanvas: vi.fn(() => fakeCanvas),
  loadFromJSON: (canvas: unknown, json: unknown) => loadFromJSONSpy(canvas, json),
  toJSON: () => ({ version: "6.0.0", objects: [] }),
  fitToContainer: vi.fn(() => 1),
  SLIDE_WIDTH: 1280,
  SLIDE_HEIGHT: 720,
}));

vi.mock("@features/dashboard/stores/authStore", () => ({
  useAuthStore: Object.assign(
    () => ({ accessToken: "tok" }),
    { getState: () => ({ accessToken: "tok" }) }
  ),
}));

import { useCanvas } from "./useCanvas";

function harness() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  return useCanvas(containerRef);
}

describe("useCanvas — infinite loop regression", () => {
  beforeEach(() => {
    loadFromJSONSpy.mockClear();
    useSlideStore.setState({ slides: [
      { id: "s1", presentationId: "p1", position: 0, content: { version: "6.0.0", objects: [] }, createdAt: "", updatedAt: "" },
    ], currentIndex: 0 });
    useEditorStore.setState({ activeSlideId: "s1", presentationId: "p1" });
  });

  it("does NOT reload the canvas when slide CONTENT changes (only on slide switch)", () => {
    const { result, rerender } = renderHook(() => harness());
    // Initialize the fabric canvas the way the real <EditorCanvas> does:
    // a ref callback invokes initCanvas(el) after mount. This populates
    // fabricRef.current so the load effect can actually run.
    act(() => {
      result.current.initCanvas(document.createElement("canvas"));
    });
    rerender();

    const callsAfterInit = loadFromJSONSpy.mock.calls.length;

    // Mutate the SAME slide's content (this is what onChanged does when a
    // textbox is added). In the buggy hook the load effect depended on
    // `slides`, so this mutation re-triggers loadFromJSON -> object:added ->
    // onChanged -> updateSlide -> ... = infinite loop.
    act(() => {
      useSlideStore.getState().updateSlide("s1", { version: "6.0.0", objects: [{ type: "textbox" }] } as never);
    });
    rerender();

    // The load effect must NOT fire again for a content change on the same slide.
    expect(loadFromJSONSpy.mock.calls.length).toBe(callsAfterInit);
  });
});
