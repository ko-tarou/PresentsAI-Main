import { describe, it, expect, vi } from "vitest";
import { renderAllSlides } from "./renderSlides";
import type { Slide, SlideContent } from "@shared/types/slide";

function makeSlide(id: string, position: number, label: string): Slide {
  const content: SlideContent = { version: "6.0.0", objects: [{ label }] };
  return {
    id,
    presentationId: "p1",
    position,
    content,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };
}

describe("renderAllSlides", () => {
  it("returns one data URL per slide (count parity)", async () => {
    const slides = [
      makeSlide("a", 0, "A"),
      makeSlide("b", 1, "B"),
      makeSlide("c", 2, "C"),
    ];
    const render = vi.fn((c: SlideContent) => Promise.resolve(`url:${(c.objects[0] as { label: string }).label}`));

    const urls = await renderAllSlides(slides, render);

    expect(urls).toHaveLength(slides.length);
    expect(render).toHaveBeenCalledTimes(slides.length);
  });

  it("walks slides in position order regardless of array order", async () => {
    const slides = [
      makeSlide("c", 2, "C"),
      makeSlide("a", 0, "A"),
      makeSlide("b", 1, "B"),
    ];
    const render = (c: SlideContent) =>
      Promise.resolve(`url:${(c.objects[0] as { label: string }).label}`);

    const urls = await renderAllSlides(slides, render);

    expect(urls).toEqual(["url:A", "url:B", "url:C"]);
  });

  it("returns an empty array for an empty deck", async () => {
    const render = vi.fn(() => Promise.resolve("url"));
    const urls = await renderAllSlides([], render);
    expect(urls).toEqual([]);
    expect(render).not.toHaveBeenCalled();
  });

  it("passes each slide's content through to the renderer", async () => {
    const slides = [makeSlide("a", 0, "only")];
    const render = vi.fn((c: SlideContent) => Promise.resolve(JSON.stringify(c)));
    await renderAllSlides(slides, render);
    expect(render).toHaveBeenCalledWith(slides[0].content);
  });
});
