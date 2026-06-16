import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Slide, SlideContent } from "@shared/types/slide";

// --- Mocks -----------------------------------------------------------------
// pptxgenjs is a heavy browser/Node lib; we only care that exportToPPTX wires
// one PowerPoint slide per deck slide, each with the rasterized image, and
// writes a file named after the title.
const addImage = vi.fn();
const addSlide = vi.fn(() => ({ addImage }));
const writeFile = vi.fn(() => Promise.resolve("ok"));
const defineLayout = vi.fn();

vi.mock("pptxgenjs", () => {
  return {
    default: class {
      defineLayout = defineLayout;
      layout = "";
      addSlide = addSlide;
      writeFile = writeFile;
    },
  };
});

// Rasterizer is replaced so the test never touches a real Fabric canvas.
vi.mock("./renderSlides", () => ({
  renderAllSlides: vi.fn(async (slides: Slide[]) =>
    slides.map((_, i) => `data:image/png;base64,IMG${i}`),
  ),
}));

import { exportToPPTX } from "./pptx";
import { renderAllSlides } from "./renderSlides";

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

describe("exportToPPTX", () => {
  beforeEach(() => {
    addImage.mockClear();
    addSlide.mockClear();
    writeFile.mockClear();
    defineLayout.mockClear();
    vi.mocked(renderAllSlides).mockClear();
  });

  it("adds one PPTX slide per deck slide with the rasterized image", async () => {
    const slides = [makeSlide("a", 0), makeSlide("b", 1), makeSlide("c", 2)];
    await exportToPPTX(slides, "deck");

    expect(addSlide).toHaveBeenCalledTimes(3);
    expect(addImage).toHaveBeenCalledTimes(3);
    // Each image is placed full-bleed with the rendered data URL.
    expect(addImage).toHaveBeenNthCalledWith(1, {
      data: "data:image/png;base64,IMG0",
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
    });
  });

  it("defines a 16:9 layout and writes a file named after the title", async () => {
    await exportToPPTX([makeSlide("a", 0)], "my-talk");
    expect(defineLayout).toHaveBeenCalledWith({
      name: "SLIDE_16x9",
      width: 10,
      height: 5.625,
    });
    expect(writeFile).toHaveBeenCalledWith({ fileName: "my-talk.pptx" });
  });

  it("defaults the filename when no title is given", async () => {
    await exportToPPTX([makeSlide("a", 0)]);
    expect(writeFile).toHaveBeenCalledWith({ fileName: "presentation.pptx" });
  });

  it("produces an empty (but valid) file for an empty deck", async () => {
    await exportToPPTX([], "empty");
    expect(addSlide).not.toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalledWith({ fileName: "empty.pptx" });
  });
});
