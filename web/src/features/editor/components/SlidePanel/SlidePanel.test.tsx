import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSlideStore } from "../../stores/slideStore";
import { useEditorStore } from "../../stores/editorStore";
import type { Slide } from "@shared/types/slide";

// SlidePanel only needs SLIDE_WIDTH/HEIGHT from the canvas module; mock it so the
// module's fabric side effects (applyPowerPointControls) don't run under jsdom.
vi.mock("@lib/fabric/canvas", () => ({ SLIDE_WIDTH: 1280, SLIDE_HEIGHT: 720 }));

vi.mock("@features/dashboard/stores/authStore", () => ({
  useAuthStore: Object.assign(
    () => ({ accessToken: "tok" }),
    { getState: () => ({ accessToken: "tok" }) },
  ),
}));

// slidesApi.create returns the freshly created slide (server-assigned id).
const createSpy = vi.fn(
  async (): Promise<Slide> => ({
    id: "new-slide",
    presentationId: "p1",
    position: 1,
    content: { version: "6.0.0", objects: [] },
    createdAt: "",
    updatedAt: "",
  }),
);
vi.mock("@shared/api/slides", () => ({
  slidesApi: {
    create: (...args: unknown[]) => createSpy(...(args as [])),
    updateContent: vi.fn(async () => ({})),
  },
}));

import { SlidePanel } from "./SlidePanel";

function existingSlide(): Slide {
  return {
    id: "s1",
    presentationId: "p1",
    position: 0,
    content: { version: "6.0.0", objects: [] },
    createdAt: "",
    updatedAt: "",
  };
}

describe("SlidePanel — add slide regression", () => {
  beforeEach(() => {
    createSpy.mockClear();
    useSlideStore.setState({ slides: [existingSlide()], currentIndex: 0 });
    useEditorStore.setState({ activeSlideId: "s1", presentationId: "p1" });
  });

  // Regression: handleAdd used handleSelect(slides.length) where `slides` was the
  // render-time snapshot (length 1). slides[1] was undefined, so reading `.id`
  // threw "Cannot read properties of undefined (reading 'id')" the moment a new
  // slide was added. The fix selects by the created slide's id instead.
  it("adds a slide and makes it active without throwing", async () => {
    render(<SlidePanel />);

    fireEvent.click(screen.getByRole("button", { name: /スライドを追加/ }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
      // The newly created slide is appended and selected.
      expect(useSlideStore.getState().slides.map((s) => s.id)).toEqual([
        "s1",
        "new-slide",
      ]);
      expect(useEditorStore.getState().activeSlideId).toBe("new-slide");
      expect(useSlideStore.getState().currentIndex).toBe(1);
    });
  });
});
