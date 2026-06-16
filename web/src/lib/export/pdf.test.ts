import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Slide, SlideContent } from "@shared/types/slide";

// jsPDF is mocked to assert page orchestration without producing a real PDF.
const addImage = vi.fn();
const addPage = vi.fn();
const save = vi.fn();
const ctor = vi.fn();

vi.mock("jspdf", () => ({
  default: class {
    constructor(opts: unknown) {
      ctor(opts);
    }
    addImage = addImage;
    addPage = addPage;
    save = save;
  },
}));

vi.mock("./renderSlides", () => ({
  renderAllSlides: vi.fn(async (slides: Slide[]) =>
    slides.map((_, i) => `data:image/png;base64,IMG${i}`),
  ),
}));

import { exportToPDF } from "./pdf";
import { renderAllSlides } from "./renderSlides";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@lib/fabric/canvas";

function makeSlide(id: string, position: number): Slide {
  const content: SlideContent = { version: "6.0.0", objects: [] };
  return {
    id,
    presentationId: "p1",
    position,
    content,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };
}

describe("exportToPDF", () => {
  beforeEach(() => {
    addImage.mockClear();
    addPage.mockClear();
    save.mockClear();
    ctor.mockClear();
    vi.mocked(renderAllSlides).mockClear();
  });

  it("adds one image per slide and a new page for every slide after the first", async () => {
    const slides = [makeSlide("a", 0), makeSlide("b", 1), makeSlide("c", 2)];
    await exportToPDF(slides, "deck");

    // 3 slides -> 3 images, 2 extra pages (first page is implicit).
    expect(addImage).toHaveBeenCalledTimes(3);
    expect(addPage).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenCalledWith("deck.pdf");
  });

  it("sizes every image to the slide dimensions at the origin", async () => {
    await exportToPDF([makeSlide("a", 0)], "one");
    expect(addImage).toHaveBeenCalledWith(
      "data:image/png;base64,IMG0",
      "PNG",
      0,
      0,
      SLIDE_WIDTH,
      SLIDE_HEIGHT,
    );
  });

  it("constructs a landscape PDF in pixel units", async () => {
    await exportToPDF([makeSlide("a", 0)], "one");
    expect(ctor).toHaveBeenCalledWith({
      orientation: "landscape",
      unit: "px",
      format: [SLIDE_WIDTH, SLIDE_HEIGHT],
    });
  });

  it("does nothing for an empty deck (no PDF created)", async () => {
    await exportToPDF([], "empty");
    expect(ctor).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("defaults the filename when no title is given", async () => {
    await exportToPDF([makeSlide("a", 0)]);
    expect(save).toHaveBeenCalledWith("presentation.pdf");
  });
});
