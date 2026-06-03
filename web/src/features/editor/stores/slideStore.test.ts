import { describe, it, expect, beforeEach } from "vitest";
import { useSlideStore } from "./slideStore";
import type { Slide } from "@shared/types/slide";

function slide(id: string, extra: Partial<Slide> = {}): Slide {
  return {
    id,
    content: { version: "6.0.0", objects: [], background: "#ffffff" },
    ...extra,
  } as Slide;
}

describe("useSlideStore", () => {
  beforeEach(() => {
    useSlideStore.setState({ slides: [], currentIndex: 0 });
  });

  it("setSlides replaces the array", () => {
    useSlideStore.getState().setSlides([slide("a"), slide("b")]);
    expect(useSlideStore.getState().slides.map((s) => s.id)).toEqual(["a", "b"]);
    useSlideStore.getState().setSlides([slide("c")]);
    expect(useSlideStore.getState().slides.map((s) => s.id)).toEqual(["c"]);
  });

  it("addSlide appends to the end", () => {
    useSlideStore.getState().setSlides([slide("a")]);
    useSlideStore.getState().addSlide(slide("b"));
    expect(useSlideStore.getState().slides.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("updateSlide merges content into the matching slide only", () => {
    useSlideStore.getState().setSlides([slide("a"), slide("b")]);
    useSlideStore.getState().updateSlide("a", { background: "#000000" });
    const content = (s: Slide) => s.content as unknown as Record<string, unknown>;
    const slides = useSlideStore.getState().slides;
    expect(content(slides[0]).background).toBe("#000000");
    expect(content(slides[0]).version).toBe("6.0.0");
    expect(content(slides[1]).background).toBe("#ffffff");
  });

  it("deleteSlide removes the slide and clamps currentIndex", () => {
    useSlideStore.setState({ slides: [slide("a"), slide("b")], currentIndex: 1 });
    useSlideStore.getState().deleteSlide("a");
    const state = useSlideStore.getState();
    expect(state.slides.map((s) => s.id)).toEqual(["b"]);
    expect(state.currentIndex).toBe(0);
  });

  it("deleteSlide does not push currentIndex below zero", () => {
    useSlideStore.setState({ slides: [slide("a")], currentIndex: 0 });
    useSlideStore.getState().deleteSlide("a");
    expect(useSlideStore.getState().currentIndex).toBe(0);
  });

  it("setCurrentIndex sets the index", () => {
    useSlideStore.setState({ slides: [slide("a"), slide("b"), slide("c")], currentIndex: 0 });
    useSlideStore.getState().setCurrentIndex(2);
    expect(useSlideStore.getState().currentIndex).toBe(2);
  });
});
